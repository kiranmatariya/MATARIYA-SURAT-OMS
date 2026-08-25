import { DispatchDetails } from "@/features/orders/dispatch-details";
export default async function DispatchDetailsPage({ params }: PageProps<"/dispatches/[id]">) { const { id } = await params; return <DispatchDetails transactionId={id}/>; }
