import { A5PackingSheet } from "@/features/orders/a5-packing-sheet";
export default async function A5PackingSheetPage({ params }: PageProps<"/dispatches/[id]/print">) { const { id } = await params; return <A5PackingSheet dispatchId={id}/>; }
