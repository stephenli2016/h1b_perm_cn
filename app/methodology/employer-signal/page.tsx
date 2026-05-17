import type { Metadata } from "next";

import {
  buildMethodologyMetadata,
  MethodologyRoutePage,
} from "@/app/methodology/methodology-route";

export const metadata: Metadata = buildMethodologyMetadata("employer-signal");

export default function EmployerSignalMethodologyPage() {
  return <MethodologyRoutePage slug="employer-signal" />;
}
