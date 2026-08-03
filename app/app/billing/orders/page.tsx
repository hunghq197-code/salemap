import { FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getOrdersForUser } from "@/lib/orders/orders";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(value ?? 0));
}

export default async function BillingOrdersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Card>
        <p className="text-sm font-semibold text-text-secondary">
          Vui lòng đăng nhập để xem order.
        </p>
      </Card>
    );
  }

  const orders = await getOrdersForUser(user.id);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
            <FileText aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Billing orders
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
              Lịch sử order
            </h1>
          </div>
        </div>
        <Button href="/app/billing/add-ons" variant="outline">
          Mua add-on
        </Button>
      </div>

      {!orders.schemaReady ? (
        <Card>
          <p className="text-sm font-semibold text-amber-700">
            Order schema chưa sẵn sàng. Hãy chạy
            `supabase/orders-product-catalog.sql`.
          </p>
        </Card>
      ) : null}

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-soft text-left text-sm">
            <thead>
              <tr>
                {["Ngày", "Order", "Amount", "Status", "Payment", "Fulfillment"].map(
                  (header) => (
                    <th
                      className="whitespace-nowrap px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-text-muted"
                      key={header}
                      scope="col"
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {orders.items.map((order) => (
                <tr key={order.id}>
                  <td className="whitespace-nowrap px-3 py-3 text-text-secondary">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-bold text-text-primary">
                    {order.orderCode}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-text-secondary">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-text-secondary">
                    {order.status}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-text-secondary">
                    {order.paymentStatus}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-text-secondary">
                    {order.fulfillmentStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.items.length === 0 ? (
            <p className="py-8 text-center text-sm font-semibold text-text-muted">
              Chưa có order.
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
