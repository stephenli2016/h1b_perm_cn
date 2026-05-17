import type { Metadata } from "next";

import {
  buildMethodologyMetadata,
  MethodologyRoutePage,
} from "@/app/methodology/methodology-route";

export const metadata: Metadata = buildMethodologyMetadata("lca");

export default function LcaMethodologyPage() {
  return <MethodologyRoutePage slug="lca" />;
}
