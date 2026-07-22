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

type RouteSearchFormProps = {
  loading: boolean;
  onSubmit: (input: {
    bufferMeters: number;
    destinationText: string;
    keyword: string;
    originText: string;
  }) => void;
};

export function RouteSearchForm({ loading, onSubmit }: RouteSearchFormProps) {
  const [bufferMeters, setBufferMeters] = useState(500);
  const [destinationText, setDestinationText] = useState("");
  const [keyword, setKeyword] = useState("");
  const [originText, setOriginText] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      bufferMeters,
      destinationText: destinationText.trim(),
      keyword: keyword.trim(),
      originText: originText.trim(),
    });
  }

  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      onSubmit={handleSubmit}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-ocean">
          Dọc tuyến
        </p>
        <h2 className="mt-2 text-xl font-bold text-ink">
          Tìm khách theo đoạn đường sale sẽ đi
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Nhập hai mốc cụ thể trên tuyến di chuyển, như số nhà, giao lộ, cửa hàng, bến xe hoặc địa danh. Tránh nhập quận/huyện quá rộng nếu bạn chỉ đi một đoạn đường.
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
        Ví dụ tốt: Ngã tư Hàng Xanh đến Cầu Sài Gòn. Ví dụ chưa tốt: Quận 1 đến Biên Hòa nếu sale chỉ chạy một tuyến cụ thể.
      </div>

      <div className="mt-5 grid gap-4">
        <RouteEndpointAutocompleteInput
          label="Điểm bắt đầu cụ thể"
          onChange={setOriginText}
          placeholder="Ví dụ: 25 Nguyễn Huệ, P. Bến Nghé hoặc Ngã tư Hàng Xanh"
          value={originText}
        />

        <RouteEndpointAutocompleteInput
          label="Điểm kết thúc cụ thể"
          onChange={setDestinationText}
          placeholder="Ví dụ: Cầu Sài Gòn, Xa lộ Hà Nội hoặc 120 Điện Biên Phủ"
          value={destinationText}
        />

        <label className="block text-sm font-bold text-ink">
          Ngành khách cần tìm dọc đoạn này
          <input
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            maxLength={100}
            minLength={2}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Ví dụ: nhà thuốc, đại lý vật liệu xây dựng, quán ăn..."
            required
            value={keyword}
          />
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-bold text-ink">Độ lệch khỏi tuyến</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
          {routeBufferOptions.map((option) => (
            <label
              className={[
                "flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-bold transition",
                bufferMeters === option.value
                  ? "border-ocean bg-ocean text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-ocean",
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
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Mặc định 500m để kết quả bám sát tuyến đường sale thực sự đi qua. Tăng lên 1-3km khi muốn mở rộng khu vực hai bên tuyến.
        </p>
      </fieldset>

      <button
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={loading}
        type="submit"
      >
        {loading ? (
          <>
            <Route aria-hidden="true" className="h-5 w-5 animate-pulse" />
            Đang tìm dọc đoạn đường...
          </>
        ) : (
          <>
            <Search aria-hidden="true" className="h-5 w-5" />
            Tìm dọc đoạn đường
          </>
        )}
      </button>

      <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-slate-500">
        <MapPinned
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 flex-none text-ocean"
        />
        Nếu sale đi theo một con đường cụ thể, hãy dùng hai giao lộ hoặc hai địa chỉ nằm trên con đường đó làm điểm đầu và điểm cuối.
      </p>
    </form>
  );
}
