import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { getPublishedBlogPosts } from "@/lib/cms/posts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description: "Bài viết SaleMap về tìm khách hàng, quản lý lead và follow-up.",
  openGraph: {
    description: "Bài viết SaleMap về tìm khách hàng, quản lý lead và follow-up.",
    title: "SaleMap Blog",
    type: "website",
  },
  title: "SaleMap Blog",
};

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts(24);

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <Link className="text-sm font-bold text-primary hover:text-primary-hover" href="/">
          SaleMap
        </Link>
        <h1 className="mt-5 text-4xl font-bold leading-tight text-text-primary sm:text-5xl">
          Blog
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-text-secondary">
          Hướng dẫn thực chiến về tìm khách hàng, quản lý lead, follow-up và vận hành sales.
        </p>

        {!posts.schemaReady ? (
          <Card className="mt-8">
            <p className="text-sm font-semibold text-amber-700">
              CMS schema chưa sẵn sàng. Hãy chạy `supabase/seo-cms.sql`.
            </p>
          </Card>
        ) : null}

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {posts.items.map((post) => (
            <Link
              className="block rounded-card border border-border-soft bg-surface p-5 shadow-sm transition hover:border-primary/40"
              href={`/blog/${post.slug}`}
              key={post.id}
            >
              {post.featuredImageUrl ? (
                <Image
                  alt={post.featuredImageAlt || post.title}
                  className="mb-4 aspect-[16/9] w-full rounded-control object-cover"
                  height={675}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  src={post.featuredImageUrl}
                  unoptimized
                  width={1200}
                />
              ) : null}
              <p className="text-sm font-bold text-primary">
                {formatDate(post.publishedAt)}
              </p>
              <h2 className="mt-2 text-2xl font-bold leading-tight text-text-primary">
                {post.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-text-secondary">{post.excerpt}</p>
            </Link>
          ))}
        </div>

        {posts.items.length === 0 ? (
          <Card className="mt-8">
            <p className="text-center text-sm font-semibold text-text-muted">
              Chưa có bài viết được publish.
            </p>
          </Card>
        ) : null}
      </section>
    </main>
  );
}
