import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts, products, type Product } from "@/lib/products";
import { SITE_URL, absoluteUrl, jsonLd } from "@/lib/site";
import ProductDetail from "@/components/ProductDetail";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Product not found — Sutra" };
  const title = `${product.name} — Sutra`;
  return {
    title,
    description: product.description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title,
      description: product.description,
      url: `/product/${product.slug}`,
      images: product.images.slice(0, 1).map((url) => ({ url, alt: product.name })),
    },
  };
}

/*
 * What Google reads to show the piece with its price and stock in results, and
 * the Home › Shop › Women trail above it. No star rating: the ratings on
 * pieces are not from real reviews yet, and Google penalises made-up ones.
 */
function productJsonLd(product: Product) {
  const url = `${SITE_URL}/product/${product.slug}`;
  return jsonLd([
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: product.images.map(absoluteUrl),
      sku: product.slug,
      brand: { "@type": "Brand", name: "Sutra" },
      category: product.category.name,
      ...(product.fabric ? { material: product.fabric } : {}),
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "INR",
        price: product.price,
        itemCondition: "https://schema.org/NewCondition",
        availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: "Sutra" },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
        { "@type": "ListItem", position: 3, name: product.category.name, item: `${SITE_URL}/shop?category=${product.category.slug}` },
        { "@type": "ListItem", position: 4, name: product.name, item: url },
      ],
    },
  ]);
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: productJsonLd(product) }} />
      <ProductDetail product={product} related={getRelatedProducts(product, 4)} />
    </>
  );
}
