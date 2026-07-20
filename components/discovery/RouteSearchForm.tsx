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
      destinationText,
      keyword,
      originText,
    });
  }

  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="mb-5 rounded-lg bg-cloud px-4 py-3 text-sm font-semibold leading-6 text-slate-600">
        SaleMap sẽ tìm các địa điểm phù hợp nằm gần tuyến đường bạn sắp đi.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-bold text-ink">
          Điểm đi
          <input
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            maxLength={200}
            minLength={2}
            onChange={(event) => setOriginText(event.target.value)}
            placeholder="Ví dụ: Quận 1, TP.HCM"
            required
            value={originText}
          />
        </label>

        <label className="block text-sm font-bold text-ink">
          Điểm đến
          <input
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            maxLength={200}
            minLength={2}
            onChange={(event) => setDestinationText(event.target.value)}
            placeholder="Ví dụ: Quận 7, TP.HCM"
            required
            value={destinationText}
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-bold text-ink">
        Từ khóa khách muốn tìm
        <input
          className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
          maxLength={100}
          minLength={2}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Ví dụ: nhà thuốc, quán ăn, spa, đại lý vật liệu xây dựng..."
          required
          value={keyword}
        />
      </label>

      <fieldset className="mt-4">
        <legend className="text-sm font-bold text-ink">Khoảng cách lệch tuyến</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
            Đang tìm khách dọc tuyến đường...
          </>
        ) : (
          <>
            <Search aria-hidden="true" className="h-5 w-5" />
            Tìm khách dọc tuyến
          </>
        )}
      </button>

      <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-slate-500">
        <MapPinned aria-hidden="true" className="mt-0.5 h-4 w-4 flex-none text-ocean" />
        Nên nhập địa chỉ hoặc quận/huyện cụ thể để kết quả tuyến chính xác hơn.
      </p>
    </form>
  );
}
