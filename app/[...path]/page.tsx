import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import Link from "next/link";
import { CmsContentRenderer } from "@/components/cms/CmsContentRenderer";
import {
  absoluteCmsUrl,
  getCmsRedirectForPath,
  getPublishedPageBySlug,
} from "@/lib/cms/posts";

export const dynamic = "force-dynamic";

type CmsCatchAllPageProps = {
  params: Promise<{
    path: string[];
  }>;
};

function pathFromSegments(segments: string[]) {
  return `/${segments.join("/")}`;
}

export async function generateMetadata(props: CmsCatchAllPageProps): Promise<Metadata> {
  const { path } = await props.params;
  const page = path.length === 1 ? await getPublishedPageBySlug(path[0] || "") : null;

  if (!page) {
    return {
      title: "Không tìm thấy trang",
    };
  }

  return {
    alternates: {
      canonical: page.canonicalPath || `/${page.slug}`,
    },
    description: page.seoDescription || page.excerpt,
    openGraph: {
      description: page.ogDescription || page.seoDescription || page.excerpt,
      title: page.ogTitle || page.seoTitle || page.title,
      type: "website",
    },
    robots: page.noindex
      ? {
          follow: false,
          index: false,
        }
      : undefined,
    title: page.seoTitle || page.title,
  };
}

export default async function CmsCatchAllPage(props: CmsCatchAllPageProps) {
  const { path } = await props.params;
  const sourcePath = pathFromSegments(path);
  const cmsRedirect = await getCmsRedirectForPath(sourcePath);

  if (cmsRedirect) {
    if (cmsRedirect.statusCode === 301) {
      permanentRedirect(cmsRedirect.destinationPath);
    }

    redirect(cmsRedirect.destinationPath);
  }

  if (path.length !== 1) notFound();

  const page = await getPublishedPageBySlug(path[0] || "");

  if (!page) notFound();

  const pageUrl = absoluteCmsUrl(`/${page.slug}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    description: page.seoDescription || page.excerpt,
    name: page.title,
    url: pageUrl,
  };

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link className="text-sm font-bold text-primary hover:text-primary-hover" href="/">
          SaleMap
        </Link>
        <h1 className="mt-6 text-4xl font-bold leading-tight text-text-primary sm:text-5xl">
          {page.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-text-secondary">{page.excerpt}</p>
        <CmsContentRenderer content={page.contentText} />
      </article>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
    </main>
  );
}
