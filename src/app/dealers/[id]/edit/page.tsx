import { DealerForm } from "@/features/dealers/dealer-form";

export default async function EditDealerPage({ params }: PageProps<"/dealers/[id]/edit">) {
  const { id } = await params;
  return <DealerForm dealerId={id} />;
}
