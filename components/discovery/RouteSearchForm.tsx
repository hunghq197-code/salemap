"use client";

import { FormEvent, useState } from "react";
import { MapPinned, Route, Search } from "lucide-react";
import { RouteEndpointAutocompleteInput } from "@/components/discovery/RouteEndpointAutocompleteInput";

const routeBufferOptions = [
  { label: "500m", value: 500 },
  { label: "1km", value: 1000 },
  { label: "2km", value: 2000 },
  { label: "3km", value: 3000 },
] as const;

type RouteSearchMode = "street" | "point_to_point";

export type RouteSearchFormInput =
  | {
      bufferMeters: number;
      keyword: string;
      searchMode: "street";
      streetText: string;
    }
  | {
      bufferMeters: number;
      destinationText: string;
      keyword: string;
      originText: string;
      searchMode: "point_to_point";
    };

type RouteSearchFormProps = {
  initialKeyword?: string;
  loading: boolean;
  onSubmit: (input: RouteSearchFormInput) => void;
};

export function RouteSearchForm({
  initialKeyword = "",
  loading,
  onSubmit,
}: RouteSearchFormProps) {
  const [bufferMeters, setBufferMeters] = useState(500);
  const [destinationText, setDestinationText] = useState("");
  const [keyword, setKeyword] = useState(initialKeyword);
  const [originText, setOriginText] = useState("");
  const [searchMode, setSearchMode] = useState<RouteSearchMode>("street");
  const [streetText, setStreetText] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (searchMode === "street") {
      onSubmit({
        bufferMeters,
        keyword: keyword.trim(),
        searchMode,
        streetText: streetText.trim(),
      });
      return;
    }

    onSubmit({
      bufferMeters,
      destinationText: destinationText.trim(),
      keyword: keyword.trim(),
      originText: originText.trim(),
      searchMode,
    });
  }

  const loadingText =
    searchMode === "street"
      ? "Đang quét tuyến đường..."
      : "Đang tìm dọc đoạn đường...";
  const submitText =
    searchMode === "street" ? "Quét tuyến đường này" : "Tìm dọc đoạn đường";

  return (
    <form
      className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5"
      onSubmit={handleSubmit}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          Dọc tuyến
        </p>
        <h2 className="mt-2 text-xl font-bold text-text-primary">
          Tìm khách theo tuyến sale sẽ đi
        </h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Nhập tên đường hoặc khu vực cụ thể. SaleMap sẽ dựng tuyến ước tính, hiển thị độ dài trên bản đồ và quét khách hàng nằm gần tuyến đó.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-control bg-surface-muted p-1">
        {[
          { label: "Theo tên đường", value: "street" },
          { label: "Điểm đầu/cuối", value: "point_to_point" },
        ].map((mode) => {
          const isActive = searchMode === mode.value;

          return (
            <button
              className={[
                "min-h-10 rounded-control px-3 py-2 text-sm font-bold transition",
                isActive
                  ? "bg-sidebar text-white"
                  : "text-text-secondary hover:bg-surface hover:text-text-primary",
              ].join(" ")}
              key={mode.value}
              onClick={() => setSearchMode(mode.value as RouteSearchMode)}
              type="button"
            >
              {mode.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-control border border-warning/25 bg-warning-soft px-4 py-3 text-sm font-semibold leading-6 text-amber-700">
        Ví dụ tốt: Đường Hiền Vương, Phú Thạnh hoặc Nguyễn Trãi, Quận 5. Nếu kết quả chưa đúng tuyến, hãy chọn một gợi ý Google Maps cụ thể hơn.
      </div>

      <div className="mt-5 grid gap-4">
        {searchMode === "street" ? (
          <RouteEndpointAutocompleteInput
            label="Tên đường hoặc tuyến cần quét"
            onChange={setStreetText}
            placeholder="Ví dụ: Đường Hiền Vương, Phú Thạnh hoặc Nguyễn Trãi, Quận 5"
            value={streetText}
          />
        ) : (
          <>
            <RouteEndpointAutocompleteInput
              label="Điểm bắt đầu cụ thể"
              onChange={setOriginText}
              placeholder="Ví dụ: Ngã tư Hàng Xanh hoặc 25 Nguyễn Huệ"
              value={originText}
            />

            <RouteEndpointAutocompleteInput
              label="Điểm kết thúc cụ thể"
              onChange={setDestinationText}
              placeholder="Ví dụ: Cầu Sài Gòn hoặc 120 Điện Biên Phủ"
              value={destinationText}
            />
          </>
        )}

        <label className="block text-sm font-bold text-text-primary">
          Ngành khách cần tìm dọc tuyến này
          <input
            className="mt-2 min-h-12 w-full rounded-control border border-border-soft bg-surface px-3 py-2 text-base text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            maxLength={100}
            minLength={2}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Ví dụ: nhà thuốc, dầu nhớt, đại lý vật liệu xây dựng..."
            required
            value={keyword}
          />
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-bold text-text-primary">Độ lệch khỏi tuyến</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
          {routeBufferOptions.map((option) => (
            <label
              className={[
                "flex min-h-11 cursor-pointer items-center justify-center rounded-control border px-3 py-2 text-sm font-bold transition",
                bufferMeters === option.value
                  ? "border-primary bg-primary text-white"
                  : "border-border-soft bg-surface text-text-secondary hover:border-primary/40",
              ].join(" ")}
              key={option.value}
            >
              <input
                checked={bufferMeters === option.value}
                className="sr-only"
                name="bufferMeters"
                onChange={() => setBufferMeters(option.value)}
                type="radio"
                value={option.value}
              />
              {option.label}
            </label>
          ))}
        </div>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          500m giúp kết quả bám sát mặt đường. Tăng lên 1-3km khi tuyến có hẻm, đường song hành hoặc nhiều điểm bán nằm sâu hai bên đường.
        </p>
      </fieldset>

      <button
        aria-busy={loading || undefined}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-primary px-5 py-3 text-base font-bold text-white shadow-soft transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
        disabled={loading}
        type="submit"
      >
        {loading ? (
          <>
            <Route aria-hidden="true" className="h-5 w-5 animate-pulse" />
            {loadingText}
          </>
        ) : (
          <>
            <Search aria-hidden="true" className="h-5 w-5" />
            {submitText}
          </>
        )}
      </button>

      <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-text-muted">
        <MapPinned
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 flex-none text-primary"
        />
        Khi không rõ điểm cuối, chỉ cần nhập tên đường rồi chọn gợi ý gần đúng nhất. Chế độ điểm đầu/cuối dùng cho tuyến giao hàng đã biết chính xác.
      </p>
    </form>
  );
}
