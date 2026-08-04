"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createCmsPost, createCmsRedirect, updateCmsPost } from "@/lib/cms/posts";
import { createSeoCmsDraftPost } from "@/lib/cms/seo-agent";
import { AIConfigError } from "@/lib/providers/ai/default-provider";

function cmsAgentErrorCode(error: unknown) {
  if (error instanceof AIConfigError) {
    return "ai_not_configured";
  }

  if (error instanceof z.ZodError) {
    return "invalid_input";
  }

  if (error instanceof Error) {
    if (error.message === "AI_PROVIDER_REQUEST_FAILED") {
      return "ai_request_failed";
    }

    if (error.message.startsWith("CMS_SEO_AGENT_")) {
      return "invalid_ai_output";
    }
  }

  return "agent_failed";
}

export async function createCmsPostAction(formData: FormData) {
  let postId = "";

  try {
    const post = await createCmsPost({ formData });
    postId = post.id;
    revalidatePath("/admin/cms");
    revalidatePath("/admin/cms/posts");
    revalidatePath("/admin/cms/pages");
    revalidatePath("/blog");
  } catch {
    redirect("/admin/cms/posts/new?error=save_failed");
  }

  redirect(`/admin/cms/posts/${postId}?updated=saved`);
}

export async function updateCmsPostAction(postId: string, formData: FormData) {
  try {
    await updateCmsPost({ formData, postId });
    revalidatePath("/admin/cms");
    revalidatePath("/admin/cms/posts");
    revalidatePath("/admin/cms/pages");
    revalidatePath(`/admin/cms/posts/${postId}`);
    revalidatePath("/blog");
  } catch {
    redirect(`/admin/cms/posts/${postId}?error=save_failed`);
  }

  redirect(`/admin/cms/posts/${postId}?updated=saved`);
}

export async function createCmsRedirectAction(formData: FormData) {
  try {
    await createCmsRedirect({ formData });
    revalidatePath("/admin/cms/redirects");
  } catch {
    redirect("/admin/cms/redirects?error=redirect_failed");
  }

  redirect("/admin/cms/redirects?updated=redirect_saved");
}

export async function createSeoCmsDraftAction(formData: FormData) {
  let postId = "";

  try {
    const post = await createSeoCmsDraftPost({ formData });
    postId = post.id;
    revalidatePath("/admin/cms");
    revalidatePath("/admin/cms/posts");
    revalidatePath("/blog");
  } catch (error) {
    redirect(`/admin/cms/ai-agent?error=${cmsAgentErrorCode(error)}`);
  }

  redirect(`/admin/cms/posts/${postId}?updated=ai_draft_created`);
}
