import type { Metadata } from "next";

import {
  buildMethodologyMetadata,
  MethodologyRoutePage,
} from "@/app/methodology/methodology-route";

export const metadata: Metadata = buildMethodologyMetadata("perm");

export default function PermMethodologyPage() {
  return <MethodologyRoutePage slug="perm" />;
}
