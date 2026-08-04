export const VIETNAM_PROVINCES = [
  { name: "Hà Nội", type: "city" },
  { name: "Hải Phòng", type: "city" },
  { name: "Huế", type: "city" },
  { name: "Đà Nẵng", type: "city" },
  { name: "Cần Thơ", type: "city" },
  { name: "Thành phố Hồ Chí Minh", type: "city" },
  { name: "Lai Châu", type: "province" },
  { name: "Điện Biên", type: "province" },
  { name: "Sơn La", type: "province" },
  { name: "Lạng Sơn", type: "province" },
  { name: "Cao Bằng", type: "province" },
  { name: "Tuyên Quang", type: "province" },
  { name: "Lào Cai", type: "province" },
  { name: "Thái Nguyên", type: "province" },
  { name: "Phú Thọ", type: "province" },
  { name: "Bắc Ninh", type: "province" },
  { name: "Hưng Yên", type: "province" },
  { name: "Ninh Bình", type: "province" },
  { name: "Quảng Ninh", type: "province" },
  { name: "Thanh Hóa", type: "province" },
  { name: "Nghệ An", type: "province" },
  { name: "Hà Tĩnh", type: "province" },
  { name: "Quảng Trị", type: "province" },
  { name: "Quảng Ngãi", type: "province" },
  { name: "Gia Lai", type: "province" },
  { name: "Khánh Hòa", type: "province" },
  { name: "Lâm Đồng", type: "province" },
  { name: "Đắk Lắk", type: "province" },
  { name: "Đồng Nai", type: "province" },
  { name: "Tây Ninh", type: "province" },
  { name: "Vĩnh Long", type: "province" },
  { name: "Đồng Tháp", type: "province" },
  { name: "Cà Mau", type: "province" },
  { name: "An Giang", type: "province" },
] as const;

export type VietnamProvinceName = (typeof VIETNAM_PROVINCES)[number]["name"];

export const VIETNAM_PROVINCE_NAMES = VIETNAM_PROVINCES.map(
  (province) => province.name,
);

export function isVietnamProvinceName(value: unknown): value is VietnamProvinceName {
  return (
    typeof value === "string" &&
    VIETNAM_PROVINCE_NAMES.includes(value as VietnamProvinceName)
  );
}
