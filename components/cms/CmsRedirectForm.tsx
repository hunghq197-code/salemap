import { createCmsRedirectAction } from "@/app/admin/cms/actions";

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

export function CmsRedirectForm() {
  return (
    <form action={createCmsRedirectAction} className="grid gap-4 md:grid-cols-4">
      <label className="block text-sm font-bold text-ink">
        Source path
        <input className={inputClass} name="sourcePath" placeholder="/old-url" required />
      </label>
      <label className="block text-sm font-bold text-ink">
        Destination path
        <input className={inputClass} name="destinationPath" placeholder="/blog/new-url" required />
      </label>
      <label className="block text-sm font-bold text-ink">
        Status code
        <select className={inputClass} defaultValue="301" name="statusCode">
          <option value="301">301</option>
          <option value="302">302</option>
        </select>
      </label>
      <div className="flex items-end">
        <label className="flex min-h-11 items-center gap-2 text-sm font-bold text-ink">
          <input defaultChecked name="isActive" type="checkbox" />
          Active
        </label>
      </div>
      <div className="md:col-span-4">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ocean px-4 py-2 text-sm font-bold text-white"
          type="submit"
        >
          Lưu redirect
        </button>
      </div>
    </form>
  );
}
