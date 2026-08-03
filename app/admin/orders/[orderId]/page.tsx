import Link from "next/link";
import { markOrderPaidAndProvisionAction } from "@/app/admin/orders/actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminOrderDetail } from "@/lib/orders/orders";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type AdminOrderPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(value ?? 0));
}

export default async function AdminOrderDetailPage(props: AdminOrderPageProps) {
  const { orderId } = await props.params;
  const order = await getAdminOrderDetail(orderId);

  if (!order) notFound();

  const provisionAction = markOrderPaidAndProvisionAction.bind(null, order.id);

  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader
        description="Order detail và provisioning thủ công cho add-on entitlement grants."
        title={order.orderCode}
      />

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <AdminStatusBadge value={order.status} />
              <AdminStatusBadge value={order.paymentStatus} />
              <AdminStatusBadge value={order.fulfillmentStatus} />
            </div>
            <p className="mt-4 text-2xl font-bold text-ink">
              {formatCurrency(order.totalAmount)}
            </p>
            <p className="mt-2 font-mono text-xs text-slate-500">{order.userId}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
              href="/admin/orders"
            >
              Về orders
            </Link>
            {order.status !== "completed" ? (
              <form action={provisionAction}>
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
                  type="submit"
                >
                  Mark paid & provision
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <AdminTable empty={order.items.length === 0} headers={["Product", "Type", "Qty", "Subtotal"]}>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">
                {item.productName}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {item.productType}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {item.quantity}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {formatCurrency(item.subtotalAmount)}
              </td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
