"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCmsPost, createCmsRedirect, updateCmsPost } from "@/lib/cms/posts";

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
