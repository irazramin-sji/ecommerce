import React from "react";
import { useParams } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import EmptyState from "@/components/layout/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content?: string | null;
  image_url?: string | null;
  published_at?: string | null;
  author_id?: string | null;
};

export default function BlogPostPage(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, isError, error, refetch } = useQuery<BlogPost | null>({
    queryKey: ["blog_post", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, content, image_url, published_at, author_id")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as BlogPost | null;
    },
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="p-6">
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageLayout>
    );
  }

  if (isError) {
    return (
      <PageLayout>
        <div className="p-6">
          <EmptyState
            title="Failed to load post"
            description={String((error as any)?.message ?? "An error occurred while fetching the post.")}
            action={<button onClick={() => refetch()} className="btn">Retry</button>}
          />
        </div>
      </PageLayout>
    );
  }

  if (!post) {
    return (
      <PageLayout>
        <div className="p-6">
          <EmptyState title="Post not found" description="We couldn't find that article." />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {post.image_url && <img src={post.image_url} alt={post.title} className="w-full h-64 object-cover rounded mb-6" />}
        <h1 className="text-3xl font-semibold mb-2">{post.title}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}
        </p>
        <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content ?? "" }} />
      </div>
    </PageLayout>
  );
}
