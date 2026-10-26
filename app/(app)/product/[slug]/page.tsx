import { ProductDetail } from "./ProductDetail";

// Products and prices are members-only, so they're never on the server: the page renders in the browser after sign-in.
export const metadata = { title: "Product · Lovioo" };

export default function ProductPage({ params }: { params: { slug: string } }) {
  return <ProductDetail slug={params.slug} />;
}
