from __future__ import annotations

import json
import re
import unicodedata
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable, Literal, Sequence


SourceSystem = Literal["oflc_lca", "oflc_perm", "uscis_h1b_hub", "manual_seed"]

LEGAL_SUFFIX_PATTERN = re.compile(
    r"\b("
    r"limited liability company|incorporated|corporation|company|limited|"
    r"l\.?\s*l\.?\s*c\.?|l\.?\s*l\.?\s*p\.?|l\.?\s*p\.?|"
    r"p\.?\s*l\.?\s*l\.?\s*c\.?|p\.?\s*c\.?|"
    r"inc|llc|corp|co|ltd|llp|lp|pllc|pc|na"
    r")\b"
)
PROFESSIONAL_SOC_PATTERN = re.compile(r"^(11|13|15|17|19|23|27|29)-")


@dataclass(frozen=True)
class SourceEmployerRecord:
    source_system: SourceSystem
    raw_employer_name: str
    normalized_employer_name: str
    fiscal_year: int
    job_title: str | None = None
    city: str | None = None
    state: str | None = None
    soc_code: str | None = None


@dataclass(frozen=True)
class ManualAliasSeed:
    canonical_name: str
    display_name: str
    slug: str
    aliases: tuple[str, ...]
    confidence_score: float = 1.0


@dataclass(frozen=True)
class CanonicalEmployer:
    id: str
    canonical_name: str
    display_name: str
    slug: str
    normalized_name: str
    match_source: str


@dataclass(frozen=True)
class EmployerAliasOutput:
    id: str
    employer_id: str
    raw_name: str
    normalized_name: str
    source_system: SourceSystem
    confidence_score: float
    review_status: Literal["auto", "manual", "needs_review"]
    match_method: Literal["exact_normalized", "manual_seed"]
    record_count: int


@dataclass(frozen=True)
class CompanyPageCandidateOutput:
    rank: int
    employer_id: str
    canonical_name: str
    display_name: str
    slug: str
    lca_count_5y: int
    perm_count_5y: int
    uscis_record_count_5y: int
    job_title_count: int
    location_count: int
    latest_fiscal_year: int
    quality_score: float
    indexable: bool
    noindex_reason: str | None
    matched_thresholds: tuple[str, ...]
    alias_count: int
    min_alias_confidence: float | None


@dataclass(frozen=True)
class CompanyCanonicalizationResult:
    employers: tuple[CanonicalEmployer, ...]
    aliases: tuple[EmployerAliasOutput, ...]
    candidates: tuple[CompanyPageCandidateOutput, ...]
    latest_fiscal_year: int
    recent_year_window: int


def normalize_employer_name(value: object) -> str:
    text = _clean_text(value)
    if not text:
        return ""

    ascii_text = (
        unicodedata.normalize("NFKD", text)
        .encode("ascii", "ignore")
        .decode("ascii")
    )
    normalized = ascii_text.lower().replace("&", " and ")
    normalized = LEGAL_SUFFIX_PATTERN.sub(" ", normalized)
    normalized = re.sub(r"\bthe\b", " ", normalized)
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    return re.sub(r"\s+", " ", normalized).strip()


def slugify_employer_name(value: str) -> str:
    normalized = normalize_employer_name(value)
    return re.sub(r"[^a-z0-9]+", "-", normalized).strip("-") or "employer"


def load_manual_alias_seeds(path: Path | str | None) -> tuple[ManualAliasSeed, ...]:
    if path is None:
        return ()

    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    seeds = payload.get("seeds", payload if isinstance(payload, list) else [])
    parsed: list[ManualAliasSeed] = []

    for seed in seeds:
        parsed.append(
            ManualAliasSeed(
                canonical_name=seed["canonical_name"],
                display_name=seed.get("display_name", seed["canonical_name"]),
                slug=seed.get("slug") or slugify_employer_name(seed["canonical_name"]),
                aliases=tuple(seed.get("aliases", [])),
                confidence_score=float(seed.get("confidence_score", 1.0)),
            )
        )

    return tuple(parsed)


def load_source_records_from_jsonl(
    path: Path | str,
    *,
    source_system: SourceSystem,
) -> tuple[SourceEmployerRecord, ...]:
    input_path = Path(path)
    records: list[SourceEmployerRecord] = []

    if not input_path.exists():
        raise FileNotFoundError(f"missing normalized input: {input_path}")

    with input_path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if not line.strip():
                continue

            payload = json.loads(line)
            raw_name = payload.get("raw_employer_name")
            normalized_name = normalize_employer_name(
                payload.get("normalized_employer_name") or raw_name
            )

            if not raw_name or not normalized_name:
                continue

            records.append(
                SourceEmployerRecord(
                    source_system=source_system,
                    raw_employer_name=raw_name,
                    normalized_employer_name=normalized_name,
                    fiscal_year=int(payload.get("fiscal_year") or 0),
                    job_title=payload.get("job_title"),
                    city=payload.get("worksite_city") or payload.get("city"),
                    state=payload.get("worksite_state") or payload.get("state"),
                    soc_code=payload.get("soc_code"),
                )
            )

    return tuple(records)


def build_company_canonicalization(
    records: Iterable[SourceEmployerRecord],
    *,
    manual_alias_seeds: Sequence[ManualAliasSeed] = (),
    recent_year_window: int = 5,
    limit: int = 2000,
) -> CompanyCanonicalizationResult:
    all_records = tuple(record for record in records if record.normalized_employer_name)
    latest_fiscal_year = max((record.fiscal_year for record in all_records), default=0)
    oldest_fiscal_year = latest_fiscal_year - recent_year_window + 1
    seed_lookup = _manual_seed_lookup(manual_alias_seeds)
    grouped_records: dict[str, list[SourceEmployerRecord]] = defaultdict(list)
    group_seeds: dict[str, ManualAliasSeed] = {}

    for record in all_records:
        seed = seed_lookup.get(record.normalized_employer_name)
        group_key = f"seed:{seed.slug}" if seed else f"auto:{record.normalized_employer_name}"
        grouped_records[group_key].append(record)

        if seed:
            group_seeds[group_key] = seed

    employers: list[CanonicalEmployer] = []
    aliases: list[EmployerAliasOutput] = []
    candidate_inputs: list[tuple[CanonicalEmployer, list[SourceEmployerRecord]]] = []

    for group_key, group_records in sorted(grouped_records.items()):
        seed = group_seeds.get(group_key)
        employer = _build_employer(group_records, seed)
        employers.append(employer)
        candidate_inputs.append((employer, group_records))
        aliases.extend(_build_aliases(employer, group_records, seed))

    candidates = _build_candidates(
        candidate_inputs,
        aliases,
        oldest_fiscal_year=oldest_fiscal_year,
        latest_fiscal_year=latest_fiscal_year,
        limit=limit,
    )

    return CompanyCanonicalizationResult(
        employers=tuple(sorted(employers, key=lambda employer: employer.slug)),
        aliases=tuple(sorted(aliases, key=lambda alias: alias.id)),
        candidates=candidates,
        latest_fiscal_year=latest_fiscal_year,
        recent_year_window=recent_year_window,
    )


def write_jsonl(path: Path | str, rows: Iterable[object]) -> int:
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0

    with output_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            payload = asdict(row) if hasattr(row, "__dataclass_fields__") else row
            handle.write(json.dumps(payload, ensure_ascii=False, sort_keys=True))
            handle.write("\n")
            count += 1

    return count


def _manual_seed_lookup(
    manual_alias_seeds: Sequence[ManualAliasSeed],
) -> dict[str, ManualAliasSeed]:
    lookup: dict[str, ManualAliasSeed] = {}

    for seed in manual_alias_seeds:
        names = [seed.canonical_name, seed.display_name, *seed.aliases]
        for name in names:
            normalized = normalize_employer_name(name)
            if normalized:
                lookup[normalized] = seed

    return lookup


def _build_employer(
    records: Sequence[SourceEmployerRecord],
    seed: ManualAliasSeed | None,
) -> CanonicalEmployer:
    if seed:
        return CanonicalEmployer(
            id=f"emp-{seed.slug}",
            canonical_name=seed.canonical_name,
            display_name=seed.display_name,
            slug=seed.slug,
            normalized_name=normalize_employer_name(seed.canonical_name),
            match_source="manual_seed",
        )

    normalized_name = records[0].normalized_employer_name
    raw_name = _most_common_raw_name(records)
    display_name = _display_name(raw_name)
    slug = _unique_slug(slugify_employer_name(display_name), normalized_name)

    return CanonicalEmployer(
        id=f"emp-{slug}",
        canonical_name=display_name,
        display_name=_display_name_without_suffix(display_name),
        slug=slug,
        normalized_name=normalized_name,
        match_source="exact_normalized",
    )


def _build_aliases(
    employer: CanonicalEmployer,
    records: Sequence[SourceEmployerRecord],
    seed: ManualAliasSeed | None,
) -> list[EmployerAliasOutput]:
    alias_counts: Counter[tuple[str, str, SourceSystem]] = Counter(
        (
            record.raw_employer_name,
            record.normalized_employer_name,
            record.source_system,
        )
        for record in records
    )
    outputs: list[EmployerAliasOutput] = []

    for index, ((raw_name, normalized_name, source_system), count) in enumerate(
        sorted(alias_counts.items()),
        start=1,
    ):
        outputs.append(
            EmployerAliasOutput(
                id=f"alias-{employer.slug}-{index}",
                employer_id=employer.id,
                raw_name=raw_name,
                normalized_name=normalized_name,
                source_system=source_system,
                confidence_score=seed.confidence_score if seed else 0.96,
                review_status="manual" if seed else "auto",
                match_method="manual_seed" if seed else "exact_normalized",
                record_count=count,
            )
        )

    return outputs


def _build_candidates(
    candidate_inputs: Sequence[tuple[CanonicalEmployer, Sequence[SourceEmployerRecord]]],
    aliases: Sequence[EmployerAliasOutput],
    *,
    oldest_fiscal_year: int,
    latest_fiscal_year: int,
    limit: int,
) -> tuple[CompanyPageCandidateOutput, ...]:
    aliases_by_employer: dict[str, list[EmployerAliasOutput]] = defaultdict(list)
    for alias in aliases:
        aliases_by_employer[alias.employer_id].append(alias)

    rows: list[CompanyPageCandidateOutput] = []

    for employer, records in candidate_inputs:
        recent_records = [
            record for record in records if record.fiscal_year >= oldest_fiscal_year
        ]
        lca_count = sum(1 for record in recent_records if record.source_system == "oflc_lca")
        perm_count = sum(1 for record in recent_records if record.source_system == "oflc_perm")
        uscis_count = sum(
            1 for record in recent_records if record.source_system == "uscis_h1b_hub"
        )
        job_title_count = len(
            {
                _normalize_key(record.job_title)
                for record in recent_records
                if record.job_title
            }
        )
        location_count = len(
            {
                _location_key(record.city, record.state)
                for record in recent_records
                if record.city and record.state
            }
        )
        employer_aliases = aliases_by_employer.get(employer.id, [])
        decision = decide_indexability(
            lca_count_5y=lca_count,
            perm_count_5y=perm_count,
            uscis_record_count_5y=uscis_count,
            job_title_count=job_title_count,
            location_count=location_count,
        )

        rows.append(
            CompanyPageCandidateOutput(
                rank=0,
                employer_id=employer.id,
                canonical_name=employer.canonical_name,
                display_name=employer.display_name,
                slug=employer.slug,
                lca_count_5y=lca_count,
                perm_count_5y=perm_count,
                uscis_record_count_5y=uscis_count,
                job_title_count=job_title_count,
                location_count=location_count,
                latest_fiscal_year=max(
                    (record.fiscal_year for record in records),
                    default=latest_fiscal_year,
                ),
                quality_score=score_company_candidate(
                    lca_count_5y=lca_count,
                    perm_count_5y=perm_count,
                    uscis_record_count_5y=uscis_count,
                    job_title_count=job_title_count,
                    location_count=location_count,
                    professional_soc_record_count=sum(
                        1
                        for record in recent_records
                        if record.soc_code
                        and PROFESSIONAL_SOC_PATTERN.match(record.soc_code)
                    ),
                ),
                indexable=decision[0],
                noindex_reason=decision[1],
                matched_thresholds=decision[2],
                alias_count=len(employer_aliases),
                min_alias_confidence=min(
                    (alias.confidence_score for alias in employer_aliases),
                    default=None,
                ),
            )
        )

    sorted_rows = sorted(
        rows,
        key=lambda row: (
            -row.quality_score,
            -row.lca_count_5y,
            -row.perm_count_5y,
            row.slug,
        ),
    )[:limit]

    return tuple(
        CompanyPageCandidateOutput(**{**asdict(row), "rank": index})
        for index, row in enumerate(sorted_rows, start=1)
    )


def decide_indexability(
    *,
    lca_count_5y: int,
    perm_count_5y: int,
    uscis_record_count_5y: int,
    job_title_count: int,
    location_count: int,
) -> tuple[bool, str | None, tuple[str, ...]]:
    thresholds = tuple(
        threshold
        for threshold in (
            "recent_lca_count_10" if lca_count_5y >= 10 else None,
            "recent_perm_count_3" if perm_count_5y >= 3 else None,
            "uscis_hub_rows_3" if uscis_record_count_5y >= 3 else None,
        )
        if threshold
    )

    if not thresholds:
        return (
            False,
            "Does not meet initial data threshold: needs at least 10 recent LCA records, 3 recent PERM records, or 3 USCIS Employer Data Hub rows.",
            thresholds,
        )

    if job_title_count == 0 or location_count == 0:
        return (
            False,
            "Has enough volume signal but lacks job-title and location diversity.",
            thresholds,
        )

    return True, None, thresholds


def score_company_candidate(
    *,
    lca_count_5y: int,
    perm_count_5y: int,
    uscis_record_count_5y: int,
    job_title_count: int,
    location_count: int,
    professional_soc_record_count: int,
) -> float:
    volume_score = (
        min(lca_count_5y * 2, 80)
        + min(perm_count_5y * 8, 80)
        + min(uscis_record_count_5y * 5, 25)
    )
    diversity_score = min(job_title_count * 3, 30) + min(location_count * 2, 20)
    relevance_score = (
        (10 if perm_count_5y > 0 else 0)
        + (8 if lca_count_5y > 0 and perm_count_5y > 0 else 0)
        + min(professional_soc_record_count, 20)
    )

    return float(volume_score + diversity_score + relevance_score)


def _most_common_raw_name(records: Sequence[SourceEmployerRecord]) -> str:
    counter = Counter(record.raw_employer_name for record in records)
    return counter.most_common(1)[0][0]


def _display_name(value: str) -> str:
    words = re.split(r"(\W+)", value.strip())
    special = {
        "AI",
        "CO",
        "CORP",
        "INC",
        "LLC",
        "LLP",
        "LP",
        "NA",
        "PC",
        "PLC",
        "PLLC",
        "USA",
    }

    return "".join(
        word.upper() if word.upper().replace(".", "") in special else word.capitalize()
        for word in words
    ).strip()


def _display_name_without_suffix(value: str) -> str:
    normalized = re.sub(
        r"\b(LLC|INC|CORP|CORPORATION|COMPANY|CO|LTD|LIMITED|LLP|LP|PLLC|PC|NA)\b\.?$",
        "",
        value,
        flags=re.IGNORECASE,
    )
    return re.sub(r"\s+", " ", normalized).strip() or value


def _unique_slug(slug: str, normalized_name: str) -> str:
    if slug:
        return slug
    return re.sub(r"[^a-z0-9]+", "-", normalized_name).strip("-") or "employer"


def _normalize_key(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def _location_key(city: str | None, state: str | None) -> str:
    return f"{_normalize_key(city)}-{(state or '').upper()}".strip("-")


def _clean_text(value: object) -> str:
    if value is None:
        return ""
    return str(value).strip()
