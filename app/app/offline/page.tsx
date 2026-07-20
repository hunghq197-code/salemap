"use client";

import { CalendarClock, MessageSquareText, RefreshCw, Trash2, WifiOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useOfflineUser } from "@/components/pwa/OfflineUserProvider";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  type OfflineAction,
  readQueue,
  removeOfflineAction,
} from "@/lib/offline/action-queue";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function getActionLabel(type: OfflineAction["type"]) {
  return type === "create_lead_note" ? "Ghi chú lead" : "Follow-up";
}

function getActionIcon(type: OfflineAction["type"]) {
  return type === "create_lead_note" ? MessageSquareText : CalendarClock;
}

function getStatusLabel(action: OfflineAction) {
  if (action.status === "syncing") return "Đang đồng bộ";
  if (action.status === "failed") return "Cần thử lại";
  return "Đang chờ mạng";
}

export default function OfflinePage() {
  const { isOnline } = useNetworkStatus();
  const { isSyncing, refreshQueue, syncNow, userId } = useOfflineUser();
  const [items, setItems] = useState<OfflineAction[]>([]);

  const refreshItems = useCallback(() => {
    setItems(readQueue(userId));
    refreshQueue();
  }, [refreshQueue, userId]);

  useEffect(() => {
    refreshItems();
    const onQueueUpdated = () => refreshItems();

    window.addEventListener("salemap:offline-queue-updated", onQueueUpdated);

    return () => {
      window.removeEventListener("salemap:offline-queue-updated", onQueueUpdated);
    };
  }, [refreshItems]);

  async function sync() {
    await syncNow();
    refreshItems();
  }

  function removeItem(actionId: string) {
    removeOfflineAction(userId, actionId);
    refreshItems();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
        Offline-lite
      </p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Dữ liệu chờ đồng bộ
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
            Khi mất mạng, SaleMap giữ lại ghi chú và follow-up trên thiết bị này. Khi có mạng,
            app sẽ thử gửi lại tự động.
          </p>
        </div>
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!isOnline || isSyncing || items.length === 0}
          onClick={sync}
          type="button"
        >
          <RefreshCw aria-hidden="true" className={`h-5 w-5 ${isSyncing ? "animate-spin" : ""}`} />
          Đồng bộ lại
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Trạng thái mạng</p>
          <p className="mt-2 text-2xl font-bold text-ink">
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Đang chờ</p>
          <p className="mt-2 text-2xl font-bold text-ink">{items.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Đồng bộ</p>
          <p className="mt-2 text-2xl font-bold text-ink">
            {isSyncing ? "Đang chạy" : "Sẵn sàng"}
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-mint/15 text-ocean">
              <WifiOff aria-hidden="true" className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-xl font-bold text-ink">Không có thao tác chờ đồng bộ</h2>
            <p className="mt-2 max-w-md text-base leading-7 text-slate-600">
              Nếu bạn tạo ghi chú hoặc follow-up khi offline, chúng sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const Icon = getActionIcon(item.type);

              return (
                <article
                  className="rounded-lg border border-slate-200 bg-cloud p-4"
                  key={item.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-ocean">
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="text-base font-bold text-ink">
                          {getActionLabel(item.type)}
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          Lưu lúc {formatDateTime(item.createdAt)}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {getStatusLabel(item)}
                          {item.retryCount > 0 ? ` · đã thử ${item.retryCount} lần` : ""}
                        </p>
                        {item.error ? (
                          <p className="mt-2 text-sm font-semibold text-rose-700">{item.error}</p>
                        ) : null}
                      </div>
                    </div>
                    <button
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-700"
                      onClick={() => removeItem(item.id)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                      Xóa
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
