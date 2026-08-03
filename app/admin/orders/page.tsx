import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminOrders } from "@/lib/orders/orders";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
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

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Theo dõi order add-on/catalog. Payment provider bridge sẽ được nối sau khi state model ổn định."
        title="Đơn hàng"
      />

      {!orders.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Order schema chưa sẵn sàng. Hãy chạy `supabase/orders-product-catalog.sql`.
        </div>
      ) : null}

      <section className="mt-6">
        <AdminTable
          empty={orders.items.length === 0}
          headers={["Ngày", "Order", "User", "Amount", "Status", "Payment", "Fulfillment", "Detail"]}
        >
          {orders.items.map((order) => (
            <tr key={order.id}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDate(order.createdAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">
                {order.orderCode}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                {order.userId}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {formatCurrency(order.totalAmount)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge value={order.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge value={order.paymentStatus} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge value={order.fulfillmentStatus} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <Link className="font-bold text-ocean hover:text-ink" href={`/admin/orders/${order.id}`}>
                  Mở
                </Link>
              </td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
