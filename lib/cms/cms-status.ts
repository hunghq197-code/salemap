export const cmsContentTypeValues = ["page", "post"] as const;
export const cmsPostStatusValues = [
  "archived",
  "draft",
  "published",
  "review",
  "scheduled",
] as const;

export type CmsContentType = (typeof cmsContentTypeValues)[number];
export type CmsPostStatus = (typeof cmsPostStatusValues)[number];

export function isPublishedStatus(status?: string | null): status is "published" {
  return status === "published";
}
