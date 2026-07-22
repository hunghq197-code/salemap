import type { DiscoveryPlaceResult } from "@/lib/providers/maps/types";

export function toPublicDiscoveryPlaceResult(
  result: DiscoveryPlaceResult,
): DiscoveryPlaceResult {
  const publicResult = { ...result };
  delete publicResult.raw;

  return publicResult;
}

export function toPublicDiscoveryPlaceResults(
  results: DiscoveryPlaceResult[],
): DiscoveryPlaceResult[] {
  return results.map(toPublicDiscoveryPlaceResult);
}
