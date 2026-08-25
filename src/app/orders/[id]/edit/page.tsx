import { OrderForm } from "@/features/orders/order-form";

export default async function EditOrderPage({ params }: PageProps<"/orders/[id]/edit">) { const { id } = await params; return <OrderForm orderId={id}/>; }
