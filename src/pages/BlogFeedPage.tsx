import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import EmptyState from "@/components/layout/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  published_at?: string | null;
  image_url?: string | null;
  created_at?: string;
};

export default function BlogFeedPage(): JSX.Element {
  const { data, isLoading, isError, error, refetch } = useQuery<BlogPost[]>({
    queryKey: ["blog_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, published_at, image_url, created_at")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="p-6">
          <Skeleton className="h-6 w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
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
            title="Failed to load blog posts"
            description={String((error as any)?.message ?? "An error occurred while fetching posts.")}
            action={<button onClick={() => refetch()} className="btn">Retry</button>}
          />
        </div>
      </PageLayout>
    );
  }

  if (!data || data.length === 0) {
    return (
      <PageLayout>
        <div className="p-6">
          <EmptyState title="No posts yet" description="We haven't published any posts yet. Check back later." />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Blog</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.map((post) => (
            <article key={post.id} className="border rounded overflow-hidden">
              {post.image_url ? (
                <img src={post.image_url} alt={post.title} className="w-full h-48 object-cover" />
              ) : (
                <div className="bg-muted h-48 flex items-center justify-center">No image</div>
              )}
              <div className="p-4">
                <h2 className="font-medium text-lg">{post.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}
                </p>
                <div className="mt-3">
                  <Link to={`/blog/${post.slug}`} className="text-primary underline">
                    Read article
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
