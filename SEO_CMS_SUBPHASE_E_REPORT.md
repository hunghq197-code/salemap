# Phase 2E2 Subphase E - SEO CMS Foundation

Date: 2026-08-03, Asia/Saigon.

## Scope Delivered

- Added WordPress-like CMS database foundation:
  - `cms_categories`
  - `cms_tags`
  - `cms_media`
  - `cms_posts`
  - `cms_post_tags`
  - `cms_revisions`
  - `cms_redirects`
  - `cms_events`
- Added seeded public content categories:
  - Huong dan sales
  - Ban do khach hang
  - Quan ly lead
- Added admin CMS routes:
  - `/admin/cms`
  - `/admin/cms/posts`
  - `/admin/cms/posts/new`
  - `/admin/cms/posts/[postId]`
  - `/admin/cms/pages`
  - `/admin/cms/categories`
  - `/admin/cms/tags`
  - `/admin/cms/media`
  - `/admin/cms/redirects`
- Added public content routes:
  - `/blog`
  - `/blog/[slug]`
  - `/{page-slug}` for published CMS pages
  - `/rss.xml`
- Added scheduled publishing cron:
  - `POST /api/cron/cms-publish`
- Integrated published, indexable CMS content into `/sitemap.xml`.
- Added internal redirect handling for CMS page/post slug changes and manual redirects.
- Added content sanitizer, CMS validators, CMS domain helpers, admin permissions, and admin navigation.
- Added smoke coverage for `/blog`, `/rss.xml`, and unauthorized CMS cron access.
- Updated `SUPABASE_SQL_SETUP.md` with `supabase/seo-cms.sql` as step 31.

## Security And SEO Decisions

- Public readers can only select published CMS posts/pages whose `published_at` is due.
- Sitemap and `/blog` list exclude `noindex` posts/pages.
- Admin/support role access is split:
  - Admin/super admin can manage CMS content.
  - Support does not receive CMS permissions.
- Raw CMS body content is not written into admin audit logs; logs store ids, status, revision number, content type, and content length only.
- CMS content rendering escapes text paragraphs and does not render stored HTML as trusted markup.
- CMS media metadata rejects SVG and non-image MIME types at the schema level.
- CMS redirect paths must be internal paths; external redirect destinations are rejected.
- Cron publish requires `Authorization: Bearer $CRON_SECRET`.

## Deferred To Later Subphases

- Rich block editor with structured blocks.
- Media upload/storage bucket integration and image transformations.
- Category/tag create-edit forms.
- Draft preview token flow.
- Full revision restore workflow.
- XML image sitemap and more granular robots controls.
- SEO score analysis, content briefs, and AI-assisted content generation.

## Validation

```powershell
npm run typecheck
npm run lint
npm run security:scan
npm run build
npm run smoke
```

Results:

- Typecheck passed.
- Lint passed with 0 warnings and 0 errors.
- Security scan passed.
- Production build passed.
- Smoke test passed 47/47 checks.

## Deployment Note

Run this SQL file in Supabase after the existing setup files:

```text
supabase/seo-cms.sql
```

The app intentionally shows schema readiness warnings on CMS pages until this SQL is applied.
