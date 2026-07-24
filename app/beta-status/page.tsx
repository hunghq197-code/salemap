import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
};

export default function LegacyStatusPage() {
  redirect("/status");
}
