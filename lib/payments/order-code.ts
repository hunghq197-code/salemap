export function generateOrderCode() {
  const timestampPart = Date.now().toString().slice(-9);
  const randomPart = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return Number(`${timestampPart}${randomPart}`);
}
