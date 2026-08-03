/* eslint-disable @next/next/no-img-element -- CMS image URLs can use admin-managed remote domains. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  absoluteCmsUrl,
  getPublishedBlogPostBySlug,
} from "@/lib/cms/posts";
import { splitCmsParagraphs } from "@/lib/cms/sanitize-content";

export const dynamic = "force-dynamic";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatDate(value?: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export async function generateMetadata(props: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Không tìm thấy bài viết",
    };
  }

  const canonical = post.canonicalPath || `/blog/${post.slug}`;
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;

  return {
    alternates: {
      canonical,
    },
    description,
    openGraph: {
      description: post.ogDescription || description,
      images: post.ogImageUrl || post.featuredImageUrl ? [
        {
          alt: post.featuredImageAlt || post.title,
          url: post.ogImageUrl || post.featuredImageUrl || "",
        },
      ] : undefined,
      publishedTime: post.publishedAt || undefined,
      title: post.ogTitle || title,
      type: "article",
    },
    robots: post.noindex
      ? {
          follow: false,
          index: false,
        }
      : undefined,
    title,
    twitter: {
      card: "summary_large_image",
      description,
      title,
    },
  };
}

export default async function BlogPostPage(props: BlogPostPageProps) {
  const { slug } = await props.params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) notFound();

  const articleUrl = absoluteCmsUrl(`/blog/${post.slug}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    dateModified: post.updatedAt || post.publishedAt,
    datePublished: post.publishedAt,
    description: post.seoDescription || post.excerpt,
    headline: post.title,
    image: post.ogImageUrl || post.featuredImageUrl || undefined,
    mainEntityOfPage: articleUrl,
    publisher: {
      "@type": "Organization",
      name: "SaleMap",
    },
    url: articleUrl,
  };

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link className="text-sm font-bold text-primary hover:text-primary-hover" href="/blog">
          Blog
        </Link>
        <p className="mt-6 text-sm font-bold text-primary">{formatDate(post.publishedAt)}</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-text-primary sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-text-secondary">{post.excerpt}</p>
        {post.featuredImageUrl ? (
          <img
            alt={post.featuredImageAlt || post.title}
            className="mt-8 aspect-[16/9] w-full rounded-control object-cover"
            src={post.featuredImageUrl}
          />
        ) : null}
        <div className="mt-8 space-y-5 text-base leading-8 text-text-primary">
          {splitCmsParagraphs(post.contentText).map((paragraph) => (
            <p className="whitespace-pre-wrap" key={paragraph.slice(0, 80)}>
              {paragraph}
            </p>
          ))}
        </div>
      </article>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
    </main>
  );
}
