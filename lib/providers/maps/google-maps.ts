import type {
  MapPlaceResult,
  MapRouteResult,
  RoutePlaceResult,
} from "@/lib/providers/maps/types";

const GOOGLE_MAPS_BASE_URL = "https://maps.googleapis.com/maps/api";
const MAX_RESULTS = 20;
const MAX_ROUTE_RESULTS = 30;
const MAX_ROUTE_SAMPLE_POINTS = 8;

type LatLng = {
  latitude: number;
  longitude: number;
};

type GoogleMapsStatus = {
  error_message?: string;
  status: string;
};

type NearbyResult = {
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
  name?: string;
  place_id?: string;
  rating?: number;
  types?: string[];
  user_ratings_total?: number;
  vicinity?: string;
};

type PlaceDetails = {
  formatted_address?: string;
  formatted_phone_number?: string;
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
  name?: string;
  opening_hours?: unknown;
  place_id?: string;
  rating?: number;
  types?: string[];
  url?: string;
  user_ratings_total?: number;
  website?: string;
};

type DirectionsRoute = {
  legs?: Array<{
    distance?: { value?: number };
    duration?: { value?: number };
    end_address?: string;
    end_location?: { lat?: number; lng?: number };
    start_address?: string;
    start_location?: { lat?: number; lng?: number };
  }>;
  overview_polyline?: {
    points?: string;
  };
  summary?: string;
  warnings?: string[];
};

const demoOffsets = [
  { latitude: 0.0018, longitude: 0.0012 },
  { latitude: -0.0014, longitude: 0.0021 },
  { latitude: 0.0026, longitude: -0.0017 },
  { latitude: -0.0022, longitude: -0.0011 },
  { latitude: 0.0034, longitude: 0.0008 },
  { latitude: -0.0031, longitude: 0.0019 },
  { latitude: 0.0009, longitude: -0.0034 },
  { latitude: -0.001, longitude: -0.003 },
] as const;

const demoPlaces = [
  {
    category: "pharmacy",
    name: "Nhà thuốc Minh An",
    phone: "090 123 4567",
    rating: 4.7,
    userRatingsTotal: 64,
  },
  {
    category: "grocery_or_supermarket",
    name: "Tạp hóa Cô Lan",
    phone: "091 222 3344",
    rating: 4.4,
    userRatingsTotal: 38,
  },
  {
    category: "hardware_store",
    name: "Đại lý Hòa Phát",
    phone: "028 3777 8899",
    rating: 4.5,
    userRatingsTotal: 52,
  },
  {
    category: "beauty_salon",
    name: "Spa An Nhiên",
    phone: "093 555 7788",
    rating: 4.8,
    userRatingsTotal: 91,
  },
  {
    category: "restaurant",
    name: "Quán ăn Bếp Nhà",
    phone: "094 667 8899",
    rating: 4.3,
    userRatingsTotal: 47,
  },
  {
    category: "store",
    name: "Showroom Gia Phát",
    phone: "096 778 9900",
    rating: 4.6,
    userRatingsTotal: 73,
  },
  {
    category: "doctor",
    name: "Phòng khám Tâm Đức",
    phone: "028 3999 1020",
    rating: 4.2,
    userRatingsTotal: 29,
  },
  {
    category: "electronics_store",
    name: "Cửa hàng Thiết bị Nam Việt",
    phone: "097 222 4455",
    rating: 4.5,
    userRatingsTotal: 58,
  },
] as const;

const demoAreaCenters = [
  { latitude: 10.7379, longitude: 106.7218, matcher: "quan 7" },
  { latitude: 10.7769, longitude: 106.7009, matcher: "quan 1" },
  { latitude: 10.8014, longitude: 106.7148, matcher: "binh thanh" },
  { latitude: 10.8411, longitude: 106.8098, matcher: "thu duc" },
  { latitude: 21.0278, longitude: 105.8342, matcher: "ha noi" },
  { latitude: 16.0544, longitude: 108.2022, matcher: "da nang" },
] as const;

export class MapProviderError extends Error {
  code = "MAP_PROVIDER_ERROR";

  constructor(message = "Không thể tìm dữ liệu bản đồ lúc này.") {
    super(message);
    this.name = "MapProviderError";
  }
}

function hasGoogleMapsApiKey() {
  return Boolean(process.env.GOOGLE_MAPS_API_KEY?.trim());
}

function getApiKey() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new MapProviderError("Thiếu GOOGLE_MAPS_API_KEY.");
  }

  return apiKey;
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugify(value: string) {
  return normalizeSearchText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function getDemoCenter(areaText: string): LatLng & { formattedAddress?: string } {
  const normalized = normalizeSearchText(areaText);
  const matched = demoAreaCenters.find((center) => normalized.includes(center.matcher));

  if (matched) {
    return {
      formattedAddress: areaText,
      latitude: matched.latitude,
      longitude: matched.longitude,
    };
  }

  return {
    formattedAddress: areaText,
    latitude: 10.7769,
    longitude: 106.7009,
  };
}

function getDemoAddress(areaText: string, index: number) {
  const cleanArea = areaText.trim() || "khu vực đang chọn";
  return `${12 + index * 7} đường Demo ${index + 1}, ${cleanArea}`;
}

function buildDemoPlaces(input: {
  areaText?: string;
  keyword: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}): MapPlaceResult[] {
  const origin = {
    latitude: input.latitude,
    longitude: input.longitude,
  };
  const keywordSlug = slugify(input.keyword || "khach-hang") || "khach-hang";
  const areaText = input.areaText || "gần vị trí hiện tại";

  return demoPlaces.map((place, index) => {
    const offset = demoOffsets[index % demoOffsets.length];
    const latitude = input.latitude + offset.latitude;
    const longitude = input.longitude + offset.longitude;
    const demoPlace = {
      address: getDemoAddress(areaText, index),
      category: place.category,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      latitude,
      longitude,
      name:
        input.keyword.trim().length > 0 && index > 1
          ? `${place.name} - ${input.keyword.trim()}`
          : place.name,
      phone: place.phone,
      placeId: `demo-${keywordSlug}-${index + 1}`,
      rating: place.rating,
      raw: {
        demo: true,
        provider: "salemap-demo",
        reason: "missing_google_maps_api_key",
      },
      userRatingsTotal: place.userRatingsTotal,
      website: "https://salemap.vn",
    };

    return {
      ...demoPlace,
      distanceMeters: getDistanceMeters(origin, demoPlace),
    };
  });
}

function getDemoRoute(input: {
  destinationText: string;
  originText: string;
}): MapRouteResult {
  const origin = getDemoCenter(input.originText);
  const destinationCenter = getDemoCenter(input.destinationText);
  const destination =
    destinationCenter.latitude === origin.latitude && destinationCenter.longitude === origin.longitude
      ? {
          latitude: origin.latitude + 0.035,
          longitude: origin.longitude + 0.04,
        }
      : destinationCenter;
  const distanceMeters = Math.round(
    (getDistanceMeters(origin, destination) || 5200) * 1.25,
  );

  return {
    destination: {
      latitude: destination.latitude,
      longitude: destination.longitude,
      text: input.destinationText,
    },
    distanceMeters,
    durationSeconds: Math.max(600, Math.round(distanceMeters / 7.5)),
    origin: {
      latitude: origin.latitude,
      longitude: origin.longitude,
      text: input.originText,
    },
    raw: {
      demo: true,
      provider: "salemap-demo",
      reason: "missing_google_maps_api_key",
    },
  };
}

function searchDemoPlacesAlongRoute(input: {
  bufferMeters: number;
  destinationText: string;
  keyword: string;
  originText: string;
}): {
  results: RoutePlaceResult[];
  route: MapRouteResult;
} {
  const route = getDemoRoute(input);
  const origin =
    route.origin.latitude != null && route.origin.longitude != null
      ? { latitude: route.origin.latitude, longitude: route.origin.longitude }
      : getDemoCenter(input.originText);
  const destination =
    route.destination.latitude != null && route.destination.longitude != null
      ? { latitude: route.destination.latitude, longitude: route.destination.longitude }
      : getDemoCenter(input.destinationText);
  const midpoint = {
    latitude: (origin.latitude + destination.latitude) / 2,
    longitude: (origin.longitude + destination.longitude) / 2,
  };
  const basePlaces = buildDemoPlaces({
    areaText: `${input.originText} - ${input.destinationText}`,
    keyword: input.keyword,
    latitude: midpoint.latitude,
    longitude: midpoint.longitude,
    radiusMeters: input.bufferMeters,
  });
  const routePoints = [origin, midpoint, destination];

  return {
    results: basePlaces.map((place, index) => ({
      ...place,
      distanceFromOriginMeters: getDistanceMeters(origin, place),
      distanceFromRouteMeters: getClosestRouteDistanceMeters(routePoints, place),
      orderIndex: index,
    })),
    route,
  };
}

function assertGoogleStatus(payload: GoogleMapsStatus) {
  if (payload.status === "OK" || payload.status === "ZERO_RESULTS") {
    return;
  }

  throw new MapProviderError(payload.error_message || `Google Maps error: ${payload.status}`);
}

async function fetchGoogle<T extends GoogleMapsStatus>(path: string, params: URLSearchParams) {
  params.set("key", getApiKey());

  const response = await fetch(`${GOOGLE_MAPS_BASE_URL}${path}?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new MapProviderError(`Google Maps HTTP ${response.status}`);
  }

  const payload = (await response.json()) as T;
  assertGoogleStatus(payload);

  return payload;
}

function getCategory(types?: string[]) {
  return types?.find((type) => type !== "point_of_interest" && type !== "establishment");
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(origin?: LatLng, destination?: Partial<LatLng>) {
  if (!origin || destination?.latitude == null || destination.longitude == null) {
    return undefined;
  }

  const earthRadius = 6371000;
  const latDelta = toRadians(destination.latitude - origin.latitude);
  const lngDelta = toRadians(destination.longitude - origin.longitude);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRadians(origin.latitude)) *
      Math.cos(toRadians(destination.latitude)) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);

  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getClosestRouteDistanceMeters(routePoints: LatLng[], place: Partial<LatLng>) {
  const distances = routePoints
    .map((point) => getDistanceMeters(point, place))
    .filter((value): value is number => typeof value === "number");

  return distances.length > 0 ? Math.min(...distances) : undefined;
}

function decodePolyline(polyline: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < polyline.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    latitude += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitude += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({
      latitude: latitude / 1e5,
      longitude: longitude / 1e5,
    });
  }

  return points;
}

function sampleRoutePoints(points: LatLng[]) {
  if (points.length <= MAX_ROUTE_SAMPLE_POINTS) {
    return points;
  }

  const sampleCount = MAX_ROUTE_SAMPLE_POINTS;
  const sampled = new Map<string, LatLng>();

  for (let index = 0; index < sampleCount; index += 1) {
    const sourceIndex = Math.round((index * (points.length - 1)) / (sampleCount - 1));
    const point = points[sourceIndex];

    if (point) {
      sampled.set(`${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`, point);
    }
  }

  return Array.from(sampled.values());
}

async function getPlaceDetails(placeId: string) {
  const fields = [
    "place_id",
    "name",
    "formatted_address",
    "formatted_phone_number",
    "website",
    "geometry",
    "rating",
    "user_ratings_total",
    "url",
    "types",
    "opening_hours",
  ].join(",");

  const payload = await fetchGoogle<GoogleMapsStatus & { result?: PlaceDetails }>(
    "/place/details/json",
    new URLSearchParams({
      fields,
      language: "vi",
      place_id: placeId,
    }),
  );

  return payload.result;
}

function normalizePlace(
  nearby: NearbyResult,
  details?: PlaceDetails,
  origin?: LatLng,
): MapPlaceResult | null {
  const placeId = details?.place_id || nearby.place_id;
  const name = details?.name || nearby.name;
  const location = details?.geometry?.location || nearby.geometry?.location;

  if (!placeId || !name) {
    return null;
  }

  const latitude = location?.lat;
  const longitude = location?.lng;

  return {
    address: details?.formatted_address || nearby.vicinity,
    category: getCategory(details?.types || nearby.types),
    distanceMeters: getDistanceMeters(origin, { latitude, longitude }),
    googleMapsUrl: details?.url || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
    latitude,
    longitude,
    name,
    phone: details?.formatted_phone_number,
    placeId,
    rating: details?.rating ?? nearby.rating,
    raw: {
      opening_hours: details?.opening_hours,
      place_id: placeId,
      types: details?.types || nearby.types,
    },
    userRatingsTotal: details?.user_ratings_total ?? nearby.user_ratings_total,
    website: details?.website,
  };
}

async function enrichPlaces(
  results: NearbyResult[],
  origin?: LatLng,
  limit = MAX_RESULTS,
) {
  const limitedResults = results.slice(0, limit);
  const enriched = await Promise.all(
    limitedResults.map(async (result) => {
      try {
        const details = result.place_id ? await getPlaceDetails(result.place_id) : undefined;
        return normalizePlace(result, details, origin);
      } catch {
        return normalizePlace(result, undefined, origin);
      }
    }),
  );

  return enriched.filter((place): place is MapPlaceResult => Boolean(place));
}

async function fetchNearbyPlaces(input: {
  keyword: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}) {
  const payload = await fetchGoogle<GoogleMapsStatus & { results?: NearbyResult[] }>(
    "/place/nearbysearch/json",
    new URLSearchParams({
      keyword: input.keyword,
      language: "vi",
      location: `${input.latitude},${input.longitude}`,
      radius: String(input.radiusMeters),
    }),
  );

  return payload.results ?? [];
}

export async function geocodeArea(areaText: string) {
  if (!hasGoogleMapsApiKey()) {
    const center = getDemoCenter(areaText);

    return {
      formattedAddress: center.formattedAddress,
      latitude: center.latitude,
      longitude: center.longitude,
    };
  }

  try {
    const payload = await fetchGoogle<
      GoogleMapsStatus & {
        results?: Array<{
          formatted_address?: string;
          geometry?: {
            location?: {
              lat?: number;
              lng?: number;
            };
          };
        }>;
      }
    >(
      "/geocode/json",
      new URLSearchParams({
        address: areaText,
        language: "vi",
        region: "vn",
      }),
    );

    const firstResult = payload.results?.[0];
    const location = firstResult?.geometry?.location;

    if (!firstResult || location?.lat == null || location.lng == null) {
      throw new MapProviderError("Không tìm thấy khu vực phù hợp.");
    }

    return {
      formattedAddress: firstResult.formatted_address,
      latitude: location.lat,
      longitude: location.lng,
    };
  } catch (error) {
    if (error instanceof MapProviderError) {
      throw error;
    }

    throw new MapProviderError();
  }
}

export async function getRoute(input: {
  destinationText: string;
  originText: string;
}): Promise<MapRouteResult> {
  if (!hasGoogleMapsApiKey()) {
    return getDemoRoute(input);
  }

  try {
    const payload = await fetchGoogle<GoogleMapsStatus & { routes?: DirectionsRoute[] }>(
      "/directions/json",
      new URLSearchParams({
        destination: input.destinationText,
        language: "vi",
        mode: "driving",
        origin: input.originText,
        region: "vn",
      }),
    );

    const route = payload.routes?.[0];
    const leg = route?.legs?.[0];

    if (!route || !leg) {
      throw new MapProviderError(
        "Không tìm được tuyến đường phù hợp. Vui lòng thử lại với điểm đi/điểm đến khác.",
      );
    }

    return {
      destination: {
        latitude: leg.end_location?.lat,
        longitude: leg.end_location?.lng,
        text: leg.end_address || input.destinationText,
      },
      distanceMeters: leg.distance?.value,
      durationSeconds: leg.duration?.value,
      origin: {
        latitude: leg.start_location?.lat,
        longitude: leg.start_location?.lng,
        text: leg.start_address || input.originText,
      },
      polyline: route.overview_polyline?.points,
      raw: {
        summary: route.summary,
        warnings: route.warnings,
      },
    };
  } catch (error) {
    if (error instanceof MapProviderError) {
      throw error;
    }

    throw new MapProviderError("Không thể tìm dữ liệu tuyến đường lúc này.");
  }
}

export async function searchNearbyPlaces(input: {
  keyword: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}): Promise<MapPlaceResult[]> {
  if (!hasGoogleMapsApiKey()) {
    return buildDemoPlaces(input);
  }

  try {
    const origin = {
      latitude: input.latitude,
      longitude: input.longitude,
    };
    const results = await fetchNearbyPlaces(input);

    return enrichPlaces(results, origin);
  } catch (error) {
    if (error instanceof MapProviderError) {
      throw error;
    }

    throw new MapProviderError();
  }
}

export async function searchAreaPlaces(input: {
  areaText: string;
  keyword: string;
  radiusMeters?: number;
}): Promise<{
  center: { latitude: number; longitude: number };
  results: MapPlaceResult[];
}> {
  if (!hasGoogleMapsApiKey()) {
    const area = getDemoCenter(input.areaText);
    const center = {
      latitude: area.latitude,
      longitude: area.longitude,
    };
    const results = buildDemoPlaces({
      areaText: input.areaText,
      keyword: input.keyword,
      latitude: center.latitude,
      longitude: center.longitude,
      radiusMeters: input.radiusMeters || 3000,
    });

    return { center, results };
  }

  const area = await geocodeArea(input.areaText);
  const center = {
    latitude: area.latitude,
    longitude: area.longitude,
  };
  const results = await searchNearbyPlaces({
    keyword: input.keyword,
    latitude: center.latitude,
    longitude: center.longitude,
    radiusMeters: input.radiusMeters || 3000,
  });

  return { center, results };
}

export async function searchPlacesAlongRoute(input: {
  bufferMeters: number;
  destinationText: string;
  keyword: string;
  originText: string;
}): Promise<{
  results: RoutePlaceResult[];
  route: MapRouteResult;
}> {
  if (!hasGoogleMapsApiKey()) {
    return searchDemoPlacesAlongRoute(input);
  }

  const route = await getRoute({
    destinationText: input.destinationText,
    originText: input.originText,
  });
  const decodedPoints = route.polyline ? decodePolyline(route.polyline) : [];
  const fallbackPoints = [route.origin, route.destination]
    .map((point) =>
      point.latitude != null && point.longitude != null
        ? { latitude: point.latitude, longitude: point.longitude }
        : null,
    )
    .filter((point): point is LatLng => Boolean(point));
  const samplePoints = sampleRoutePoints(decodedPoints.length > 0 ? decodedPoints : fallbackPoints);

  if (samplePoints.length === 0) {
    throw new MapProviderError(
      "Không tìm được tuyến đường phù hợp. Vui lòng thử lại với điểm đi/điểm đến khác.",
    );
  }

  const placesById = new Map<
    string,
    {
      nearby: NearbyResult;
      orderIndex: number;
    }
  >();

  await Promise.all(
    samplePoints.map(async (point, orderIndex) => {
      const results = await fetchNearbyPlaces({
        keyword: input.keyword,
        latitude: point.latitude,
        longitude: point.longitude,
        radiusMeters: input.bufferMeters,
      });

      results.forEach((result) => {
        if (result.place_id && !placesById.has(result.place_id)) {
          placesById.set(result.place_id, { nearby: result, orderIndex });
        }
      });
    }),
  );

  const routeOrigin =
    route.origin.latitude != null && route.origin.longitude != null
      ? { latitude: route.origin.latitude, longitude: route.origin.longitude }
      : samplePoints[0];
  const uniquePlaces = Array.from(placesById.entries()).slice(0, MAX_ROUTE_RESULTS);
  const enriched = await enrichPlaces(
    uniquePlaces.map(([, value]) => value.nearby),
    routeOrigin,
    MAX_ROUTE_RESULTS,
  );
  const enrichedByPlaceId = new Map(enriched.map((place) => [place.placeId, place]));

  const routeResults: RoutePlaceResult[] = [];

  uniquePlaces.forEach(([placeId, metadata]) => {
    const place = enrichedByPlaceId.get(placeId);

    if (!place) {
      return;
    }

    routeResults.push({
      ...place,
      distanceFromOriginMeters: getDistanceMeters(routeOrigin, place),
      distanceFromRouteMeters: getClosestRouteDistanceMeters(samplePoints, place),
      orderIndex: metadata.orderIndex,
    });
  });

  routeResults.sort((a, b) => {
    const aDistance = a.distanceFromOriginMeters ?? Number.MAX_SAFE_INTEGER;
    const bDistance = b.distanceFromOriginMeters ?? Number.MAX_SAFE_INTEGER;

    if (aDistance !== bDistance) {
      return aDistance - bDistance;
    }

    return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
  });

  return {
    results: routeResults.slice(0, MAX_ROUTE_RESULTS),
    route,
  };
}
