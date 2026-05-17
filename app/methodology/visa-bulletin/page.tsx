import type { Metadata } from "next";

import {
  buildMethodologyMetadata,
  MethodologyRoutePage,
} from "@/app/methodology/methodology-route";

export const metadata: Metadata = buildMethodologyMetadata("visa-bulletin");

export default function VisaBulletinMethodologyPage() {
  return <MethodologyRoutePage slug="visa-bulletin" />;
}
