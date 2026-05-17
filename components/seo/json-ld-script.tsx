import { safeJsonLd } from "@/lib/seo/json-ld";

type JsonLdScriptProps = {
  data: unknown;
  id?: string;
};

export function JsonLdScript({
  data,
  id = "structured-data",
}: JsonLdScriptProps) {
  if (!data) {
    return null;
  }

  return (
    <script
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
      id={id}
      type="application/ld+json"
    />
  );
}
