import { PendingTransactionForm } from "@/features/orders/pending-transaction-form";
export default async function DispatchPage({ params }: PageProps<"/orders/[id]/dispatch">) { const { id } = await params; return <PendingTransactionForm orderId={id} mode="dispatch"/>; }
