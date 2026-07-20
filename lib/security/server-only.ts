export function assertServerOnly(moduleName: string) {
  if (typeof window !== "undefined") {
    throw new Error(`${moduleName} chỉ được dùng ở server.`);
  }
}
