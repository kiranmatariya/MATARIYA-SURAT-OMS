import { PendingPackingList } from "@/features/orders/pending-packing-list";
export default async function PendingPackingListPage({ params }: PageProps<"/orders/[id]/packing-list">) { const { id } = await params; return <PendingPackingList orderId={id}/>; }
