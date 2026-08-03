import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminCatalogProducts } from "@/lib/catalog/products";

export const dynamic = "force-dynamic";

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(value ?? 0));
}

export default async function AdminCatalogPage() {
  const catalog = await getAdminCatalogProducts();

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Product Catalog foundation: products, active prices, product types và entitlement templates."
        title="Catalog"
      />

      {!catalog.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Catalog schema chưa sẵn sàng. Hãy chạy `supabase/orders-product-catalog.sql`.
        </div>
      ) : null}

      <section className="mt-6">
        <AdminTable
          empty={catalog.items.length === 0}
          headers={["Product", "Type", "Price", "Period", "Public", "Active"]}
        >
          {catalog.items.map((product) => (
            <tr key={product.id}>
              <td className="whitespace-nowrap px-4 py-3">
                <p className="font-bold text-ink">{product.name}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">{product.slug}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {product.productType}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">
                {product.activePrice ? formatCurrency(product.activePrice.amount) : "No active price"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {product.activePrice?.billingPeriod || "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge value={product.isPublic ? "public" : "private"} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge value={product.isActive ? "active" : "inactive"} />
              </td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
