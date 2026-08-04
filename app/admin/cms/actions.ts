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
    if (
      error.name === "AbortError" ||
      error.message === "AI_PROVIDER_EMPTY_OUTPUT" ||
      error.message === "AI_PROVIDER_NOT_SUPPORTED" ||
      error.message === "AI_PROVIDER_REQUEST_FAILED"
    ) {
      return "ai_request_failed";
    }

    if (error.message.startsWith("CMS_SEO_AGENT_")) {
      return "invalid_ai_output";
    }
  }

  return "agent_failed";
}

function logCmsAgentError(error: unknown) {
  if (error instanceof Error) {
    const details = error as {
      provider?: unknown;
      providerCode?: unknown;
      providerMessage?: unknown;
      status?: unknown;
    };

    console.error("CMS SEO Agent failed", {
      message: error.message,
      name: error.name,
      provider: typeof details.provider === "string" ? details.provider : undefined,
      providerCode:
        typeof details.providerCode === "string" ? details.providerCode : undefined,
      providerMessage:
        typeof details.providerMessage === "string"
          ? details.providerMessage
          : undefined,
      status: typeof details.status === "number" ? details.status : undefined,
    });
    return;
  }

  console.error("CMS SEO Agent failed", { message: "UNKNOWN_ERROR" });
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
    logCmsAgentError(error);
    redirect(`/admin/cms/ai-agent?error=${cmsAgentErrorCode(error)}`);
  }

  redirect(`/admin/cms/posts/${postId}?updated=ai_draft_created`);
}
