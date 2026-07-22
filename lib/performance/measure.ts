type MeasureProperties = {
  apiName?: string;
  route?: string;
  routeGroup?: string;
};

function sanitize(properties: MeasureProperties & { durationMs: number }) {
  return {
    apiName: properties.apiName,
    durationMs: Math.max(0, Math.round(properties.durationMs)),
    route: properties.route,
    routeGroup: properties.routeGroup,
  };
}

export async function measureAsync<T>(
  operation: () => Promise<T>,
  properties: MeasureProperties = {},
): Promise<T> {
  const startedAt = Date.now();

  try {
    return await operation();
  } finally {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        "[salemap:perf] api_request_duration",
        sanitize({ ...properties, durationMs: Date.now() - startedAt }),
      );
    }
  }
}
