import type { Metadata } from "next";

import {
  buildMethodologyMetadata,
  MethodologyRoutePage,
} from "@/app/methodology/methodology-route";

export const metadata: Metadata = buildMethodologyMetadata("wage");

export default function WageMethodologyPage() {
  return <MethodologyRoutePage slug="wage" />;
}
