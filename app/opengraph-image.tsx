import { ImageResponse } from "next/og";

export const alt = "SaleMap - Tìm khách, lưu lead và nhắc follow-up";
export const contentType = "image/png";
export const size = {
  height: 630,
  width: 1200,
};

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f8fafc",
          color: "#102033",
          display: "flex",
          fontFamily: "Arial, sans-serif",
          height: "100%",
          justifyContent: "space-between",
          padding: "64px 72px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 660 }}>
          <div
            style={{
              color: "#0877a9",
              display: "flex",
              fontSize: 25,
              fontWeight: 700,
              letterSpacing: 5,
            }}
          >
            SALEMAP
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 65,
              fontWeight: 800,
              lineHeight: 1.08,
              marginTop: 25,
            }}
          >
            Tìm khách. Lưu lead. Follow-up đúng lúc.
          </div>
          <div
            style={{
              color: "#526276",
              display: "flex",
              fontSize: 27,
              lineHeight: 1.45,
              marginTop: 28,
            }}
          >
            Công cụ bán hàng gọn nhẹ cho sale thị trường, sale B2B và người tự kinh doanh.
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "2px solid #dce5ec",
            borderRadius: 8,
            boxShadow: "0 24px 60px rgba(16, 32, 51, 0.12)",
            display: "flex",
            flexDirection: "column",
            padding: 28,
            width: 340,
          }}
        >
          <div style={{ display: "flex", fontSize: 21, fontWeight: 700 }}>
            Tổng quan hôm nay
          </div>
          <div
            style={{
              background: "#eef7ff",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              marginTop: 20,
              padding: "18px 20px",
            }}
          >
            <div style={{ color: "#0877a9", display: "flex", fontSize: 17 }}>
              Khách phù hợp
            </div>
            <div style={{ display: "flex", fontSize: 31, fontWeight: 800, marginTop: 6 }}>
              24 khách
            </div>
          </div>
          <div
            style={{
              background: "#e8faf3",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              marginTop: 14,
              padding: "18px 20px",
            }}
          >
            <div style={{ color: "#16785a", display: "flex", fontSize: 17 }}>
              Follow-up hôm nay
            </div>
            <div style={{ display: "flex", fontSize: 31, fontWeight: 800, marginTop: 6 }}>
              7 việc
            </div>
          </div>
          <div
            style={{
              background: "#102033",
              borderRadius: 8,
              color: "#ffffff",
              display: "flex",
              fontSize: 18,
              fontWeight: 700,
              justifyContent: "center",
              marginTop: 18,
              padding: "16px 18px",
            }}
          >
            Mở SaleMap
          </div>
        </div>
      </div>
    ),
    size,
  );
}
