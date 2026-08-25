import { FanRodPlanning } from "@/features/planning/fan-rod-planning";
export default async function FanRodPrintPreviewPage({ searchParams }: { searchParams: Promise<{ gauge?: string; colour?: string; view?: string }> }) {
  const query = await searchParams;
  return <FanRodPlanning printMode initialGaugeId={query.gauge ?? ""} initialColourId={query.colour ?? ""} initialView={query.view === "SUMMARY" ? "SUMMARY" : "PARTY"}/>;
}
