from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from datetime import date, datetime
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable, Literal


ChartType = Literal["final_action", "dates_for_filing"]
CutoffStatus = Literal["date", "current", "unavailable"]
EmploymentCategory = Literal["EB-1", "EB-2", "EB-3"]

MONTH_NAMES = {
    "JAN": 1,
    "JANUARY": 1,
    "FEB": 2,
    "FEBRUARY": 2,
    "MAR": 3,
    "MARCH": 3,
    "APR": 4,
    "APRIL": 4,
    "MAY": 5,
    "JUN": 6,
    "JUNE": 6,
    "JUL": 7,
    "JULY": 7,
    "AUG": 8,
    "AUGUST": 8,
    "SEP": 9,
    "SEPT": 9,
    "SEPTEMBER": 9,
    "OCT": 10,
    "OCTOBER": 10,
    "NOV": 11,
    "NOVEMBER": 11,
    "DEC": 12,
    "DECEMBER": 12,
}


@dataclass(frozen=True)
class ParsedVisaBulletinCutoff:
    raw_value: str
    cutoff_status: CutoffStatus
    cutoff_date: str | None


@dataclass(frozen=True)
class NormalizedVisaBulletinMonth:
    source_file_id: str
    month_key: str
    bulletin_year: int
    bulletin_month: int
    source_url: str
    published_at: str | None


@dataclass(frozen=True)
class NormalizedVisaBulletinDate:
    source_file_id: str
    month_key: str
    category: EmploymentCategory
    chargeability_area: str
    chart_type: ChartType
    cutoff_status: CutoffStatus
    cutoff_date: str | None
    raw_value: str


@dataclass(frozen=True)
class VisaBulletinParseResult:
    source_file_id: str
    input_path: str
    month: NormalizedVisaBulletinMonth
    records_seen: int
    records_inserted: int
    records: tuple[NormalizedVisaBulletinDate, ...]


@dataclass(frozen=True)
class UscisFilingChartSelection:
    source_file_id: str
    month_key: str
    employment_based_chart: ChartType
    raw_text: str


@dataclass(frozen=True)
class UscisFilingChartParseResult:
    source_file_id: str
    input_path: str
    selection: UscisFilingChartSelection


def parse_visa_bulletin_file(
    path: Path | str,
    *,
    source_file_id: str,
    source_url: str,
    month_key: str | None = None,
) -> VisaBulletinParseResult:
    input_path = Path(path)
    snapshot = _parse_html_snapshot(input_path)
    resolved_month = month_key or _resolve_month_key(snapshot.text)
    bulletin_year, bulletin_month = _split_month_key(resolved_month)
    published_at = _parse_published_at(snapshot.text)

    records: list[NormalizedVisaBulletinDate] = []
    for table in snapshot.tables:
        chart_type = _chart_type_from_heading(table.heading)
        if chart_type is None:
            continue

        headers = table.rows[0] if table.rows else []
        china_index = _china_column_index(headers)
        if china_index is None:
            continue

        for row in table.rows[1:]:
            if len(row) <= china_index:
                continue
            category = _normalize_employment_category(row[0])
            if category is None:
                continue
            cutoff = parse_visa_bulletin_cutoff(row[china_index], bulletin_year)
            records.append(
                NormalizedVisaBulletinDate(
                    source_file_id=source_file_id,
                    month_key=resolved_month,
                    category=category,
                    chargeability_area="china-mainland",
                    chart_type=chart_type,
                    cutoff_status=cutoff.cutoff_status,
                    cutoff_date=cutoff.cutoff_date,
                    raw_value=cutoff.raw_value,
                )
            )

    return VisaBulletinParseResult(
        source_file_id=source_file_id,
        input_path=str(input_path),
        month=NormalizedVisaBulletinMonth(
            source_file_id=source_file_id,
            month_key=resolved_month,
            bulletin_year=bulletin_year,
            bulletin_month=bulletin_month,
            source_url=source_url,
            published_at=published_at,
        ),
        records_seen=sum(max(len(table.rows) - 1, 0) for table in snapshot.tables),
        records_inserted=len(records),
        records=tuple(records),
    )


def parse_uscis_filing_chart_file(
    path: Path | str,
    *,
    source_file_id: str,
    month_key: str | None = None,
    fallback_employment_based_chart: ChartType | None = None,
) -> UscisFilingChartParseResult:
    input_path = Path(path)
    raw_text = _clean_html_text(input_path.read_text(encoding="utf-8"))
    resolved_month = month_key or _resolve_month_key(raw_text)
    chart = _parse_employment_based_chart(raw_text) or fallback_employment_based_chart
    if chart is None:
        raise ValueError("USCIS employment-based filing chart could not be inferred")

    return UscisFilingChartParseResult(
        source_file_id=source_file_id,
        input_path=str(input_path),
        selection=UscisFilingChartSelection(
            source_file_id=source_file_id,
            month_key=resolved_month,
            employment_based_chart=chart,
            raw_text=raw_text,
        ),
    )


def parse_visa_bulletin_cutoff(value: object, bulletin_year: int) -> ParsedVisaBulletinCutoff:
    raw_value = _clean_cell(value) or ""
    compact = raw_value.upper().replace(" ", "")

    if compact == "C":
        return ParsedVisaBulletinCutoff(raw_value=raw_value, cutoff_status="current", cutoff_date=None)
    if compact == "U":
        return ParsedVisaBulletinCutoff(
            raw_value=raw_value,
            cutoff_status="unavailable",
            cutoff_date=None,
        )

    parsed_date = _parse_dos_date(raw_value, bulletin_year)
    if parsed_date is None:
        raise ValueError(f"unsupported visa bulletin cutoff value: {raw_value}")

    return ParsedVisaBulletinCutoff(
        raw_value=raw_value,
        cutoff_status="date",
        cutoff_date=parsed_date.isoformat(),
    )


def priority_date_is_before_cutoff(
    priority_date: str,
    cutoff: ParsedVisaBulletinCutoff,
) -> bool:
    if cutoff.cutoff_status == "current":
        return True
    if cutoff.cutoff_status == "unavailable" or cutoff.cutoff_date is None:
        return False
    return date.fromisoformat(priority_date) < date.fromisoformat(cutoff.cutoff_date)


def write_visa_bulletin_jsonl(
    path: Path | str,
    results: Iterable[VisaBulletinParseResult],
) -> int:
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0

    with output_path.open("w", encoding="utf-8") as handle:
        for result in results:
            handle.write(
                json.dumps(
                    {"record_type": "month", **asdict(result.month)},
                    ensure_ascii=False,
                    sort_keys=True,
                )
            )
            handle.write("\n")
            count += 1
            for record in result.records:
                handle.write(
                    json.dumps(
                        {"record_type": "date", **asdict(record)},
                        ensure_ascii=False,
                        sort_keys=True,
                    )
                )
                handle.write("\n")
                count += 1

    return count


def write_uscis_filing_chart_jsonl(
    path: Path | str,
    results: Iterable[UscisFilingChartParseResult],
) -> int:
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0

    with output_path.open("w", encoding="utf-8") as handle:
        for result in results:
            handle.write(
                json.dumps(asdict(result.selection), ensure_ascii=False, sort_keys=True)
            )
            handle.write("\n")
            count += 1

    return count


@dataclass(frozen=True)
class _HtmlTable:
    heading: str
    rows: tuple[tuple[str, ...], ...]


@dataclass(frozen=True)
class _HtmlSnapshot:
    text: str
    tables: tuple[_HtmlTable, ...]


class _VisaBulletinHtmlParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.text_chunks: list[str] = []
        self.tables: list[_HtmlTable] = []
        self._heading_chunks: list[str] = []
        self._last_heading = ""
        self._heading_tag: str | None = None
        self._in_table = False
        self._in_row = False
        self._in_cell = False
        self._current_rows: list[tuple[str, ...]] = []
        self._current_row: list[str] = []
        self._current_cell: list[str] = []
        self._current_table_heading = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"h1", "h2", "h3", "h4"}:
            self._heading_tag = tag
            self._heading_chunks = []
        elif tag == "table":
            self._in_table = True
            self._current_rows = []
            self._current_table_heading = self._last_heading
        elif self._in_table and tag == "tr":
            self._in_row = True
            self._current_row = []
        elif self._in_row and tag in {"td", "th"}:
            self._in_cell = True
            self._current_cell = []

    def handle_endtag(self, tag: str) -> None:
        if tag == self._heading_tag:
            heading = _clean_text("".join(self._heading_chunks))
            if heading:
                self._last_heading = heading
                self.text_chunks.append(heading)
            self._heading_tag = None
            self._heading_chunks = []
        elif self._in_cell and tag in {"td", "th"}:
            self._current_row.append(_clean_text("".join(self._current_cell)))
            self._in_cell = False
        elif self._in_row and tag == "tr":
            if any(cell for cell in self._current_row):
                self._current_rows.append(tuple(self._current_row))
            self._in_row = False
        elif self._in_table and tag == "table":
            self.tables.append(
                _HtmlTable(
                    heading=self._current_table_heading,
                    rows=tuple(self._current_rows),
                )
            )
            self._in_table = False

    def handle_data(self, data: str) -> None:
        if self._heading_tag:
            self._heading_chunks.append(data)
        if self._in_cell:
            self._current_cell.append(data)
        if data.strip():
            self.text_chunks.append(data)


def _parse_html_snapshot(path: Path) -> _HtmlSnapshot:
    parser = _VisaBulletinHtmlParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return _HtmlSnapshot(
        text=_clean_text(" ".join(parser.text_chunks)),
        tables=tuple(parser.tables),
    )


def _chart_type_from_heading(value: str) -> ChartType | None:
    normalized = value.upper()
    if "EMPLOYMENT" not in normalized:
        return None
    if "FINAL ACTION" in normalized:
        return "final_action"
    if "DATES FOR FILING" in normalized:
        return "dates_for_filing"
    return None


def _china_column_index(headers: tuple[str, ...]) -> int | None:
    for index, header in enumerate(headers):
        normalized = header.upper().replace(" ", "-")
        if "CHINA" in normalized and "MAINLAND" in normalized:
            return index
    return None


def _normalize_employment_category(value: str) -> EmploymentCategory | None:
    normalized = value.strip().upper()
    mapping: dict[str, EmploymentCategory] = {
        "1ST": "EB-1",
        "EB-1": "EB-1",
        "EB1": "EB-1",
        "2ND": "EB-2",
        "EB-2": "EB-2",
        "EB2": "EB-2",
        "3RD": "EB-3",
        "EB-3": "EB-3",
        "EB3": "EB-3",
    }
    return mapping.get(normalized)


def _parse_employment_based_chart(raw_text: str) -> ChartType | None:
    normalized = raw_text.upper()
    employment_index = normalized.find("EMPLOYMENT-BASED")
    if employment_index == -1:
        employment_index = normalized.find("EMPLOYMENT BASED")
    if employment_index == -1:
        return None

    segment = normalized[employment_index : employment_index + 500]
    if "DATES FOR FILING" in segment:
        return "dates_for_filing"
    if "FINAL ACTION DATES" in segment:
        return "final_action"
    return None


def _resolve_month_key(raw_text: str) -> str:
    patterns = (
        r"\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b",
        r"\b(\d{4})-(\d{2})\b",
    )
    for pattern in patterns:
        match = re.search(pattern, raw_text, flags=re.IGNORECASE)
        if not match:
            continue
        if len(match.groups()) == 2 and match.group(1).isdigit():
            return f"{int(match.group(1)):04d}-{int(match.group(2)):02d}"
        month = MONTH_NAMES[match.group(1).upper()]
        return f"{int(match.group(2)):04d}-{month:02d}"

    raise ValueError("could not infer bulletin month")


def _split_month_key(month_key: str) -> tuple[int, int]:
    year, month = month_key.split("-")
    return int(year), int(month)


def _parse_published_at(raw_text: str) -> str | None:
    match = re.search(
        r"CA/VO:\s*([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})",
        raw_text,
        flags=re.IGNORECASE,
    )
    if not match:
        return None
    month = MONTH_NAMES[match.group(1).upper()]
    return date(int(match.group(3)), month, int(match.group(2))).isoformat()


def _parse_dos_date(value: str, bulletin_year: int) -> date | None:
    normalized = value.strip().upper().replace("-", "")
    match = re.fullmatch(r"(\d{1,2})([A-Z]{3,9})(\d{2,4})", normalized)
    if not match:
        return None

    day = int(match.group(1))
    month = MONTH_NAMES.get(match.group(2))
    if month is None:
        return None
    raw_year = match.group(3)
    year = _resolve_two_or_four_digit_year(raw_year, bulletin_year)
    return date(year, month, day)


def _resolve_two_or_four_digit_year(value: str, bulletin_year: int) -> int:
    if len(value) == 4:
        return int(value)

    year = 2000 + int(value)
    if year > bulletin_year + 1:
        year -= 100
    return year


def _clean_html_text(value: str) -> str:
    without_tags = re.sub(r"<[^>]+>", " ", value)
    return _clean_text(without_tags)


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _clean_cell(value: object) -> str | None:
    if value is None:
        return None
    text = _clean_text(str(value))
    return text or None
