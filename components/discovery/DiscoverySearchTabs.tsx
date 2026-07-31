"use client";

import { LocateFixed, MapPinned, Route } from "lucide-react";

type ActiveTab = "area" | "near-me" | "route";

type DiscoverySearchTabsProps = {
  activeTab: ActiveTab;
  onChange: (tab: ActiveTab) => void;
  routeSearchEnabled: boolean;
};

const tabs = [
  {
    description: "Vị trí thiết bị",
    icon: LocateFixed,
    label: "Quanh tôi",
    value: "near-me",
  },
  {
    description: "Tỉnh/thành, quận, địa chỉ",
    icon: MapPinned,
    label: "Theo khu vực",
    value: "area",
  },
  {
    description: "Tuyến sale sẽ đi",
    icon: Route,
    label: "Dọc tuyến",
    value: "route",
  },
] as const;

export function DiscoverySearchTabs({
  activeTab,
  onChange,
  routeSearchEnabled,
}: DiscoverySearchTabsProps) {
  return (
    <div
      aria-label="Chế độ tìm kiếm Map Discovery"
      className="grid grid-cols-3 gap-1 rounded-card border border-border-soft bg-surface p-1.5 shadow-card"
      role="tablist"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const disabled = tab.value === "route" && !routeSearchEnabled;
        const isActive = activeTab === tab.value;

        return (
          <button
            aria-selected={isActive}
            className={[
              "min-h-14 rounded-control px-2 py-2 text-left transition duration-150",
              disabled
                ? "cursor-not-allowed text-text-muted opacity-60"
                : isActive
                  ? "bg-primary text-white shadow-soft"
                  : "text-text-secondary hover:bg-primary-soft hover:text-primary",
            ].join(" ")}
            disabled={disabled}
            key={tab.value}
            onClick={() => onChange(tab.value)}
            role="tab"
            type="button"
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <Icon aria-hidden="true" className="h-4 w-4 flex-none" />
              <span className="truncate">{tab.label}</span>
            </span>
            <span className="mt-1 hidden text-xs font-semibold opacity-80 sm:block">
              {tab.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
