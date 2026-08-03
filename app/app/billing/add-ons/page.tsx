import { PackagePlus } from "lucide-react";
import { createAddOnOrderAction } from "@/app/app/billing/add-ons/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getPublicAddOnCatalog } from "@/lib/catalog/products";

export const dynamic = "force-dynamic";

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(value ?? 0));
}

export default async function BillingAddOnsPage() {
  const catalog = await getPublicAddOnCatalog();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
            <PackagePlus aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Billing add-ons
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
              Mua thêm tính năng
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-8 text-text-secondary">
              Chọn add-on để tạo order. Server luôn lấy giá và entitlement từ
              catalog đang active, không dùng số tiền từ client.
            </p>
          </div>
        </div>
        <Button href="/app/billing/orders" variant="outline">
          Lịch sử order
        </Button>
      </div>

      {!catalog.schemaReady ? (
        <Card>
          <p className="text-sm font-semibold text-amber-700">
            Catalog schema chưa sẵn sàng. Hãy chạy
            `supabase/orders-product-catalog.sql`.
          </p>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {catalog.items.map((product) => (
          <Card key={product.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge tone={product.productType === "quota_pack" ? "primary" : "warning"}>
                  {product.productType}
                </Badge>
                <h2 className="mt-3 text-xl font-bold text-text-primary">
                  {product.name}
                </h2>
              </div>
              <p className="text-right text-lg font-bold text-text-primary">
                {formatCurrency(product.activePrice?.amount)}
              </p>
            </div>
            <p className="mt-3 min-h-14 text-sm leading-6 text-text-secondary">
              {product.description}
            </p>
            {product.activePrice ? (
              <form action={createAddOnOrderAction} className="mt-5">
                <input name="priceId" type="hidden" value={product.activePrice.id} />
                <Button className="w-full" type="submit">
                  Tạo order
                </Button>
              </form>
            ) : (
              <p className="mt-5 rounded-control bg-warning-soft px-3 py-2 text-sm font-semibold text-amber-700">
                Chưa có giá active.
              </p>
            )}
          </Card>
        ))}
      </section>
    </div>
  );
}
