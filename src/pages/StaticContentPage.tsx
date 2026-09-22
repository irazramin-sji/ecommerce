import React from "react";
import { useParams } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import EmptyState from "@/components/layout/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

type StaticContent = {
  id: string;
  slug: string;
  title?: string | null;
  content?: string | null;
  type?: string | null;
  file_url?: string | null;
  embed_url?: string | null;
};

export default function StaticContentPage(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, isError, error, refetch } = useQuery<StaticContent | null>({
    queryKey: ["static_content", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("static_content")
        .select("id, slug, title, content, type, file_url, embed_url")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as StaticContent | null;
    },
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="p-6">
          <Skeleton className="h-8 w-1/3 mb-4" />
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
            title="Failed to load content"
            description={String((error as any)?.message ?? "An error occurred while fetching content.")}
            action={<button onClick={() => refetch()} className="btn">Retry</button>}
          />
        </div>
      </PageLayout>
    );
  }

  if (!data) {
    return (
      <PageLayout>
        <div className="p-6">
          <EmptyState title="Not found" description="The requested page could not be found." />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">{data.title}</h1>

        {data.type === "video" && data.embed_url ? (
          <div className="mb-6">
            <iframe title={data.title ?? "Embedded content"} src={data.embed_url} className="w-full h-64" />
          </div>
        ) : null}

        {data.file_url ? (
          <div className="mb-6">
            <a href={data.file_url} target="_blank" rel="noreferrer" className="text-primary underline">
              Download
            </a>
          </div>
        ) : null}

        <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: data.content ?? "" }} />
      </div>
    </PageLayout>
  );
}
