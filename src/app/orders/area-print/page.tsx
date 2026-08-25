import { AreaPendingPrint } from "@/features/orders/area-pending-print";
export default async function Page({searchParams}:{searchParams:Promise<{area?:string;orders?:string}>}){const p=await searchParams;return <AreaPendingPrint areaId={p.area??""} orderIds={(p.orders??"").split(",").filter(Boolean)}/>}
