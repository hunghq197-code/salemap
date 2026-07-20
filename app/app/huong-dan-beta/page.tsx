import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LegacyGuidePage() {
  redirect("/app/huong-dan");
}
