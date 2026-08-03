import { getPublishedBlogPosts, absoluteCmsUrl } from "@/lib/cms/posts";

export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const posts = await getPublishedBlogPosts(30);
  const items = posts.items
    .map(
      (post) => `<item>
  <title>${escapeXml(post.title)}</title>
  <link>${absoluteCmsUrl(`/blog/${post.slug}`)}</link>
  <guid>${absoluteCmsUrl(`/blog/${post.slug}`)}</guid>
  <description>${escapeXml(post.excerpt)}</description>
  <pubDate>${new Date(post.publishedAt || post.createdAt || Date.now()).toUTCString()}</pubDate>
</item>`,
    )
    .join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>SaleMap Blog</title>
  <link>${absoluteCmsUrl("/blog")}</link>
  <description>SaleMap SEO content</description>
  ${items}
</channel>
</rss>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
