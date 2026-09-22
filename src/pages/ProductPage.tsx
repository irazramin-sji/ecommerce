import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageLayout from "@/components/layout/PageLayout";
import EmptyState from "@/components/layout/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: string | number;
  stock_quantity?: number;
  material_type?: string | null;
  shape?: string | null;
  length?: string | null;
  tip_size?: string | null;
  is_featured?: boolean;
  product_images?: { id: string; url: string; alt_text?: string | null }[];
  product_videos?: { id: string; embed_url?: string | null; title?: string | null }[];
  product_user_guides?: { id: string; file_url?: string | null; title?: string | null }[];
};

export default function ProductPage(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState({
    material: "",
    length: "",
    tip_size: "",
  });

  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Product | null>({
    queryKey: ["product", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("products")
        .select(
          `
        *,
        product_images (id, url, alt_text, "order"),
        product_videos (id, embed_url, title, "order"),
        product_user_guides (id, file_url, title)
      `
        )
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data as Product | null;
    },
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 2,
  });

  const reviewMutation = useMutation({
    mutationFn: async (payload: {
      product_id: string;
      rating: number;
      comment?: string;
    }) => {
      const { data, error } = await supabase
        .from("customer_reviews")
        .insert([{ ...payload, is_approved: false }]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Review submitted and awaiting approval");
      queryClient.invalidateQueries({ queryKey: ["product", slug] });
    },
    onError: (err: any) => {
      toast.error("Failed to submit review: " + (err?.message ?? "Unknown"));
    },
  });

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: 1,
        image: product.product_images?.[0]?.url ?? null,
      });
      toast.success("Added to cart");
    } catch (err: any) {
      toast.error("Could not add to cart: " + (err?.message ?? "Unknown"));
    }
  };

  const handleSubmitReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const rating = Number(formData.get("rating") ?? 5);
    const comment = String(formData.get("comment") ?? "");
    if (!product) {
      toast.error("Product not loaded");
      return;
    }
    await reviewMutation.mutateAsync({
      product_id: product.id,
      rating,
      comment,
    });
    form.reset();
  };

  const mainImage = useMemo(
    () => product?.product_images?.sort((a, b) => (a as any).order - (b as any).order)[0]?.url,
    [product]
  );

  if (isLoading) {
    return (
      <PageLayout>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-80 w-full rounded" />
            <div>
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-6 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-10 w-40 mt-4" />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (isError) {
    return (
      <PageLayout>
        <div className="p-6">
          <EmptyState
            title="Failed to load product"
            description={String((error as any)?.message ?? "An error occurred while fetching the product.")}
            action={
              <Button onClick={() => refetch()}>Retry</Button>
            }
          />
        </div>
      </PageLayout>
    );
  }

  if (!product) {
    return (
      <PageLayout>
        <div className="p-6">
          <EmptyState
            title="Product not found"
            description="We couldn't find the product you were looking for."
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="border rounded p-4">
              {mainImage ? (
                // simple image gallery: main image + thumbnails
                <img
                  src={mainImage}
                  alt={product.product_images?.[0]?.alt_text ?? product.name}
                  className="w-full h-96 object-contain"
                />
              ) : (
                <div className="bg-muted w-full h-96 flex items-center justify-center rounded">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}

              <div className="flex gap-2 mt-4 overflow-x-auto">
                {product.product_images?.sort((a, b) => (a as any).order - (b as any).order).map((img) => (
                  <button
                    key={img.id}
                    onClick={() => {
                      // set main image by moving the clicked one to front locally
                      // simple approach: update selectedVariant (not ideal but avoids extra state)
                      const element = document.querySelector<HTMLImageElement>("img[alt]");
                      if (element) element.src = img.url;
                    }}
                    className="w-20 h-20 flex-none border rounded overflow-hidden"
                  >
                    <img src={img.url} alt={img.alt_text ?? product.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-semibold mb-2">{product.name}</h1>
            <p className="text-xl text-primary mb-4">${Number(product.price).toFixed(2)}</p>
            <p className="mb-4 text-sm text-muted-foreground">{product.description}</p>

            <div className="space-y-3 mb-4">
              {/* Variant selectors (simple) */}
              {product.material_type && (
                <div>
                  <label className="block text-sm font-medium mb-1">Material</label>
                  <select
                    value={selectedVariant.material}
                    onChange={(e) => setSelectedVariant((s) => ({ ...s, material: e.target.value }))}
                    className="border rounded p-2 w-full"
                    aria-label="Select material"
                  >
                    <option value="">{product.material_type}</option>
                    <option value={product.material_type}>{product.material_type}</option>
                  </select>
                </div>
              )}

              {product.length && (
                <div>
                  <label className="block text-sm font-medium mb-1">Length</label>
                  <select
                    value={selectedVariant.length}
                    onChange={(e) => setSelectedVariant((s) => ({ ...s, length: e.target.value }))}
                    className="border rounded p-2 w-full"
                    aria-label="Select length"
                  >
                    <option value="">{product.length}</option>
                    <option value={product.length}>{product.length}</option>
                  </select>
                </div>
              )}

              {product.tip_size && (
                <div>
                  <label className="block text-sm font-medium mb-1">Tip Size</label>
                  <select
                    value={selectedVariant.tip_size}
                    onChange={(e) => setSelectedVariant((s) => ({ ...s, tip_size: e.target.value }))}
                    className="border rounded p-2 w-full"
                    aria-label="Select tip size"
                  >
                    <option value="">{product.tip_size}</option>
                    <option value={product.tip_size}>{product.tip_size}</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleAddToCart}>Add to Cart</Button>
              <div className="text-sm text-muted-foreground">
                {product.stock_quantity && product.stock_quantity > 0 ? (
                  <span>{product.stock_quantity} in stock</span>
                ) : (
                  <span>Out of stock</span>
                )}
              </div>
            </div>

            {/* User guides */}
            {product.product_user_guides && product.product_user_guides.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">User Guides</h3>
                <ul className="list-disc ml-5">
                  {product.product_user_guides.map((g) => (
                    <li key={g.id}>
                      {g.title ? g.title : "Manual"}{" "}
                      {g.file_url && (
                        <a href={g.file_url} target="_blank" rel="noreferrer" className="text-primary underline">
                          Download
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Tabs simplified: Description + Videos + Reviews */}
        <div className="mt-10">
          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: product.description ?? "" }} />
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">Videos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.product_videos?.length ? (
                  product.product_videos.map((v) => (
                    <div key={v.id} className="border rounded p-2">
                      {v.embed_url ? (
                        <iframe
                          title={v.title ?? "Product video"}
                          src={v.embed_url}
                          className="w-full h-48"
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground">No video</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No videos available.</div>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">Customer Reviews</h2>

              <div className="mb-4">
                <form onSubmit={handleSubmitReview} className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium">Rating</label>
                    <select name="rating" defaultValue={5} className="border rounded p-2">
                      <option value={5}>5 - Excellent</option>
                      <option value={4}>4 - Good</option>
                      <option value={3}>3 - Average</option>
                      <option value={2}>2 - Poor</option>
                      <option value={1}>1 - Terrible</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Comment</label>
                    <textarea name="comment" className="w-full border rounded p-2" rows={4} />
                  </div>
                  <div>
                    <Button type="submit" disabled={reviewMutation.isLoading}>
                      {reviewMutation.isLoading ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Approved reviews */}
              <ApprovedReviews productId={product.id} />
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function ApprovedReviews({ productId }: { productId: string }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["product_reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_reviews")
        .select("id, rating, comment, created_at")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as { id: string; rating: number; comment?: string; created_at?: string }[];
    },
    staleTime: 1000 * 60,
  });

  if (isLoading) return <Skeleton className="h-20 w-full" />;

  if (isError) {
    return (
      <div className="text-sm text-destructive">
        Failed to load reviews. <button className="underline" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className="text-sm text-muted-foreground">No reviews yet.</div>;
  }

  return (
    <ul className="space-y-4">
      {data.map((r) => (
        <li key={r.id} className="border rounded p-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">Rating: {r.rating}/5</div>
            <div className="text-xs text-muted-foreground">{new Date(r.created_at ?? "").toLocaleDateString()}</div>
          </div>
          {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
        </li>
      ))}
    </ul>
  );
}
