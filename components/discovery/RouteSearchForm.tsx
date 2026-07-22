"use client";

import { FormEvent, useState } from "react";
import { MapPinned, Route, Search } from "lucide-react";

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
  const [bufferMeters, setBufferMeters] = useState(1000);
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
          Tìm khách dọc tuyến đường
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Nhập điểm đầu, điểm cuối và ngành khách cần tìm. SaleMap sẽ hiển thị các địa điểm phù hợp dọc tuyến.
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="block text-sm font-bold text-ink">
          Điểm đầu
          <input
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            maxLength={200}
            minLength={2}
            onChange={(event) => setOriginText(event.target.value)}
            placeholder="Điểm đầu, ví dụ: Quận 1, TP.HCM"
            required
            value={originText}
          />
        </label>

        <label className="block text-sm font-bold text-ink">
          Điểm cuối
          <input
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            maxLength={200}
            minLength={2}
            onChange={(event) => setDestinationText(event.target.value)}
            placeholder="Điểm cuối, ví dụ: Biên Hòa, Đồng Nai"
            required
            value={destinationText}
          />
        </label>

        <label className="block text-sm font-bold text-ink">
          Keyword cần tìm
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
        <legend className="text-sm font-bold text-ink">Khoảng cách lệch tuyến</legend>
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
      </fieldset>

      <button
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={loading}
        type="submit"
      >
        {loading ? (
          <>
            <Route aria-hidden="true" className="h-5 w-5 animate-pulse" />
            Đang tìm dọc tuyến...
          </>
        ) : (
          <>
            <Search aria-hidden="true" className="h-5 w-5" />
            Tìm dọc tuyến
          </>
        )}
      </button>

      <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-slate-500">
        <MapPinned
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 flex-none text-ocean"
        />
        Nên nhập địa chỉ hoặc quận/huyện cụ thể để kết quả tuyến chính xác hơn.
      </p>
    </form>
  );
}
