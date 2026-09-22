import React from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { EmptyState } from "@/components/layout/EmptyState";

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const filters = {
    search: searchParams.get("search") ?? undefined,
    material: searchParams.get("material") ?? undefined,
    shape: searchParams.get("shape") ?? undefined,
    category: slug ?? undefined
  };

  const { data, isLoading, isError, fetchNextPage, hasNextPage } = useProducts(filters);
  const { addItem } = useCart();

  const products = data?.pages?.flatMap((p: any) => p.data ?? []) ?? [];

  return (
    <PageLayout>
      <PageLayout.Header>
        <div className="py-6">
          <h1 className="text-2xl font-bold">{slug ? `Category: ${slug}` : "All Products"}</h1>
        </div>
      </PageLayout.Header>

      <PageLayout.Content>
        <div className="flex flex-col md:flex-row gap-6">
          <ProductFilters />
          <main className="flex-1">
            {isLoading && <div>Loading products...</div>}
            {isError && <div className="text-red-600">Failed to load products.</div>}
            {!isLoading && products.length === 0 && (
              <EmptyState title="No products found" description="Try adjusting filters or search terms." />
            )}
            {products.length > 0 && (
              <>
                <ProductGrid
                  products={products}
                  onAdd={(p) =>
                    addItem({
                      product_id: p.id,
                      name: p.name,
                      unit_price: Number(p.price),
                      quantity: 1,
                      image: p.product_images?.[0]?.url ?? null,
                      sku: p.sku ?? null
                    })
                  }
                />
                <div className="mt-6 text-center">
                  {hasNextPage ? (
                    <button className="btn" onClick={() => fetchNextPage()}>
                      Load more
                    </button>
                  ) : (
                    <div className="text-sm text-muted-foreground">End of results</div>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </PageLayout.Content>
    </PageLayout>
  );
}
