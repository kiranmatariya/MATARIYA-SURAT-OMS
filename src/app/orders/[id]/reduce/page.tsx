import { PendingTransactionForm } from "@/features/orders/pending-transaction-form";
export default async function ReductionPage({ params }: PageProps<"/orders/[id]/reduce">) { const { id } = await params; return <PendingTransactionForm orderId={id} mode="reduction"/>; }
