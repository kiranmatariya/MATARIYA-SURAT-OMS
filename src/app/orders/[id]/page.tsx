import { OrderDetails } from "@/features/orders/order-details";

export default async function OrderDetailsPage({ params }: PageProps<"/orders/[id]">) { const { id } = await params; return <OrderDetails orderId={id}/>; }
