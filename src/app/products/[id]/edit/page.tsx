import { ProductForm } from "@/features/products/product-form";

export default async function EditProductPage({ params }: PageProps<"/products/[id]/edit">) { const { id } = await params; return <ProductForm productId={id}/>; }
