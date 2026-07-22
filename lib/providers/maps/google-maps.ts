import type {
  MapPlaceDetails,
  MapPlaceResult,
  MapRouteResult,
  RoutePlaceResult,
} from "@/lib/providers/maps/types";

const GOOGLE_MAPS_LEGACY_BASE_URL = "https://maps.googleapis.com/maps/api";
const GOOGLE_PLACES_TEXT_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchText";
const GOOGLE_PLACES_BASE_URL = "https://places.googleapis.com/v1/places";
const MAX_RESULTS = 20;
const MAX_ROUTE_RESULTS = 30;
const MAX_ROUTE_SAMPLE_POINTS = 6;
const GOOGLE_REQUEST_TIMEOUT_MS = 15_000;
const MIN_INFERRED_STREET_SPAN_DEGREES = 0.008;
const MAX_INFERRED_STREET_SPAN_DEGREES = 0.08;
const PLACE_SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.primaryType",
  "places.types",
  "places.businessStatus",
  "places.googleMapsUri",
].join(",");
const PLACE_DETAILS_FIELD_MASK = [
  "id",
  "googleMapsUri",
  "nationalPhoneNumber",
  "rating",
  "userRatingCount",
  "websiteUri",
].join(",");

type LatLng = {
  latitude: number;
  longitude: number;
};

type GeoViewport = {
  northeast: LatLng;
  southwest: LatLng;
};

type GeocodedArea = LatLng & {
  formattedAddress?: string;
  viewport?: GeoViewport;
};

type GoogleMapsStatus = {
  error_message?: string;
  status: string;
};

type GooglePlacesError = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

type GoogleTextPlace = {
  businessStatus?: string;
  displayName?: {
    languageCode?: string;
    text?: string;
  };
  formattedAddress?: string;
  googleMapsUri?: string;
  id?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  nationalPhoneNumber?: string;
  primaryType?: string;
  rating?: number;
  types?: string[];
  userRatingCount?: number;
  websiteUri?: string;
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

export class MapProviderError extends Error {
  code: string;

  constructor(
    message = "Không thể tìm dữ liệu bản đồ lúc này.",
    code = "MAP_PROVIDER_ERROR",
  ) {
    super(message);
    this.code = code;
    this.name = "MapProviderError";
  }
}

function getApiKey() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();

  if (!apiKey) {
    throw new MapProviderError(
      "Tính năng tìm khách chưa được kết nối Google Places. Vui lòng cấu hình GOOGLE_MAPS_API_KEY và bật Places API (New).",
      "MAP_PROVIDER_NOT_CONFIGURED",
    );
  }

  return apiKey;
}

function getProviderError(status: number, payload?: GooglePlacesError) {
  const googleStatus = payload?.error?.status;

  if (status === 401 || status === 403 || googleStatus === "PERMISSION_DENIED") {
    return new MapProviderError(
      "Google Places từ chối API key. Hãy kiểm tra key, giới hạn API và chắc chắn Places API (New) đã được bật.",
      "MAP_PROVIDER_AUTH_ERROR",
    );
  }

  if (status === 429 || googleStatus === "RESOURCE_EXHAUSTED") {
    return new MapProviderError(
      "Google Places đã chạm giới hạn sử dụng. Vui lòng thử lại sau.",
      "MAP_PROVIDER_QUOTA_ERROR",
    );
  }

  if (status >= 500) {
    return new MapProviderError(
      "Google Places đang tạm thời không phản hồi. Vui lòng thử lại sau.",
      "MAP_PROVIDER_UNAVAILABLE",
    );
  }

  return new MapProviderError(
    payload?.error?.message || "Google Places không thể xử lý yêu cầu tìm kiếm này.",
  );
}

async function fetchPlacesByText(input: {
  keyword: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}) {
  let response: Response;

  try {
    response = await fetch(GOOGLE_PLACES_TEXT_SEARCH_URL, {
      body: JSON.stringify({
        includePureServiceAreaBusinesses: false,
        languageCode: "vi",
        locationBias: {
          circle: {
            center: {
              latitude: input.latitude,
              longitude: input.longitude,
            },
            radius: input.radiusMeters,
          },
        },
        pageSize: MAX_RESULTS,
        regionCode: "VN",
        textQuery: input.keyword.trim(),
      }),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": getApiKey(),
        "X-Goog-FieldMask": PLACE_SEARCH_FIELD_MASK,
      },
      method: "POST",
      signal: AbortSignal.timeout(GOOGLE_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof MapProviderError) {
      throw error;
    }

    throw new MapProviderError(
      "Không thể kết nối Google Places. Vui lòng kiểm tra mạng và thử lại.",
      "MAP_PROVIDER_UNAVAILABLE",
    );
  }

  const payload = (await response.json().catch(() => ({}))) as GooglePlacesError & {
    places?: GoogleTextPlace[];
  };

  if (!response.ok) {
    throw getProviderError(response.status, payload);
  }

  return payload.places ?? [];
}

export async function getPlaceDetails(placeId: string): Promise<MapPlaceDetails> {
  let response: Response;

  try {
    const url = new URL(`${GOOGLE_PLACES_BASE_URL}/${encodeURIComponent(placeId)}`);
    url.searchParams.set("languageCode", "vi");
    url.searchParams.set("regionCode", "VN");

    response = await fetch(url, {
      cache: "no-store",
      headers: {
        "X-Goog-Api-Key": getApiKey(),
        "X-Goog-FieldMask": PLACE_DETAILS_FIELD_MASK,
      },
      signal: AbortSignal.timeout(GOOGLE_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof MapProviderError) {
      throw error;
    }

    throw new MapProviderError(
      "Không thể tải thông tin liên hệ của địa điểm. Vui lòng thử lại.",
      "MAP_PROVIDER_UNAVAILABLE",
    );
  }

  const payload = (await response.json().catch(() => ({}))) as GooglePlacesError &
    GoogleTextPlace;

  if (!response.ok) {
    throw getProviderError(response.status, payload);
  }

  return {
    detailsLoaded: true,
    googleMapsUrl: payload.googleMapsUri,
    phone: payload.nationalPhoneNumber,
    rating: payload.rating,
    userRatingsTotal: payload.userRatingCount,
    website: payload.websiteUri,
  };
}

function assertLegacyGoogleStatus(payload: GoogleMapsStatus) {
  if (payload.status === "OK" || payload.status === "ZERO_RESULTS") {
    return;
  }

  if (payload.status === "REQUEST_DENIED") {
    if (payload.error_message?.toLowerCase().includes("billing")) {
      throw new MapProviderError(
        "Google Maps chưa nhận diện Billing cho project chứa API key.",
        "MAP_PROVIDER_BILLING_ERROR",
      );
    }

    throw new MapProviderError(
      "Google Maps từ chối API key. Hãy kiểm tra key và các API Geocoding/Directions đã được bật.",
      "MAP_PROVIDER_AUTH_ERROR",
    );
  }

  if (payload.status === "OVER_QUERY_LIMIT") {
    throw new MapProviderError(
      "Google Maps đã chạm giới hạn sử dụng. Vui lòng thử lại sau.",
      "MAP_PROVIDER_QUOTA_ERROR",
    );
  }

  throw new MapProviderError(
    payload.error_message || `Google Maps trả về trạng thái ${payload.status}.`,
  );
}

async function fetchLegacyGoogle<T extends GoogleMapsStatus>(
  path: string,
  params: URLSearchParams,
) {
  params.set("key", getApiKey());

  let response: Response;

  try {
    response = await fetch(
      `${GOOGLE_MAPS_LEGACY_BASE_URL}${path}?${params.toString()}`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(GOOGLE_REQUEST_TIMEOUT_MS),
      },
    );
  } catch {
    throw new MapProviderError(
      "Không thể kết nối Google Maps. Vui lòng kiểm tra mạng và thử lại.",
      "MAP_PROVIDER_UNAVAILABLE",
    );
  }

  if (!response.ok) {
    throw getProviderError(response.status);
  }

  const payload = (await response.json()) as T;
  assertLegacyGoogleStatus(payload);

  return payload;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(origin?: LatLng, destination?: Partial<LatLng>) {
  if (!origin || destination?.latitude == null || destination.longitude == null) {
    return undefined;
  }

  const earthRadius = 6_371_000;
  const latDelta = toRadians(destination.latitude - origin.latitude);
  const lngDelta = toRadians(destination.longitude - origin.longitude);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRadians(origin.latitude)) *
      Math.cos(toRadians(destination.latitude)) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);

  return Math.round(
    earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
  );
}

function getClosestRouteDistanceMeters(
  routePoints: LatLng[],
  place: Partial<LatLng>,
) {
  const distances = routePoints
    .map((point) => getDistanceMeters(point, place))
    .filter((value): value is number => typeof value === "number");

  return distances.length > 0 ? Math.min(...distances) : undefined;
}

function normalizeTextPlace(
  place: GoogleTextPlace,
  origin: LatLng,
): MapPlaceResult | null {
  const placeId = place.id;
  const name = place.displayName?.text;
  const latitude = place.location?.latitude;
  const longitude = place.location?.longitude;

  if (!placeId || !name || latitude == null || longitude == null) {
    return null;
  }

  const distanceMeters = getDistanceMeters(origin, { latitude, longitude });

  return {
    address: place.formattedAddress,
    category: place.primaryType || place.types?.[0],
    detailsLoaded: false,
    distanceMeters,
    googleMapsUrl:
      place.googleMapsUri ||
      `https://www.google.com/maps/place/?q=place_id:${placeId}`,
    latitude,
    longitude,
    name,
    placeId,
    raw: {
      businessStatus: place.businessStatus,
      languageCode: place.displayName?.languageCode,
      provider: "google_places_new",
      types: place.types,
    },
  } satisfies MapPlaceResult;
}

function normalizePlacesWithinRadius(
  places: GoogleTextPlace[],
  origin: LatLng,
  radiusMeters: number,
) {
  return places
    .filter((place) => place.businessStatus !== "CLOSED_PERMANENTLY")
    .map((place) => normalizeTextPlace(place, origin))
    .filter((place): place is MapPlaceResult => Boolean(place))
    .filter(
      (place) =>
        typeof place.distanceMeters !== "number" ||
        place.distanceMeters <= radiusMeters,
    );
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

function encodePolyline(points: LatLng[]) {
  let previousLatitude = 0;
  let previousLongitude = 0;

  return points
    .map((point) => {
      const latitude = Math.round(point.latitude * 1e5);
      const longitude = Math.round(point.longitude * 1e5);
      const encoded =
        encodePolylineValue(latitude - previousLatitude) +
        encodePolylineValue(longitude - previousLongitude);

      previousLatitude = latitude;
      previousLongitude = longitude;

      return encoded;
    })
    .join("");
}

function encodePolylineValue(value: number) {
  let coordinate = value < 0 ? ~(value << 1) : value << 1;
  let output = "";

  while (coordinate >= 0x20) {
    output += String.fromCharCode((0x20 | (coordinate & 0x1f)) + 63);
    coordinate >>= 5;
  }

  return output + String.fromCharCode(coordinate + 63);
}

function sampleRoutePoints(points: LatLng[]) {
  if (points.length <= MAX_ROUTE_SAMPLE_POINTS) {
    return points;
  }

  const sampled = new Map<string, LatLng>();

  for (let index = 0; index < MAX_ROUTE_SAMPLE_POINTS; index += 1) {
    const sourceIndex = Math.round(
      (index * (points.length - 1)) / (MAX_ROUTE_SAMPLE_POINTS - 1),
    );
    const point = points[sourceIndex];

    if (point) {
      sampled.set(
        `${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`,
        point,
      );
    }
  }

  return Array.from(sampled.values());
}

function clampStreetSpan(value: number) {
  return Math.min(
    MAX_INFERRED_STREET_SPAN_DEGREES,
    Math.max(MIN_INFERRED_STREET_SPAN_DEGREES, value),
  );
}

function formatLatLngText(point: LatLng) {
  return `${point.latitude},${point.longitude}`;
}

function getEndpointPairFromViewport(center: LatLng, viewport?: GeoViewport) {
  const latSpan = clampStreetSpan(
    viewport
      ? Math.abs(viewport.northeast.latitude - viewport.southwest.latitude)
      : MIN_INFERRED_STREET_SPAN_DEGREES,
  );
  const lngSpan = clampStreetSpan(
    viewport
      ? Math.abs(viewport.northeast.longitude - viewport.southwest.longitude)
      : MIN_INFERRED_STREET_SPAN_DEGREES,
  );

  if (lngSpan >= latSpan) {
    return {
      destination: {
        latitude: center.latitude,
        longitude: center.longitude + lngSpan / 2,
      },
      origin: {
        latitude: center.latitude,
        longitude: center.longitude - lngSpan / 2,
      },
    };
  }

  return {
    destination: {
      latitude: center.latitude + latSpan / 2,
      longitude: center.longitude,
    },
    origin: {
      latitude: center.latitude - latSpan / 2,
      longitude: center.longitude,
    },
  };
}

function buildInferredStreetRoute(input: {
  area: GeocodedArea;
  destination: LatLng;
  origin: LatLng;
  streetText: string;
}): MapRouteResult {
  return {
    destination: {
      ...input.destination,
      text: "Cuối tuyến ước tính",
    },
    distanceMeters: getDistanceMeters(input.origin, input.destination),
    origin: {
      ...input.origin,
      text: input.area.formattedAddress || input.streetText,
    },
    polyline: encodePolyline([input.origin, input.destination]),
    raw: {
      formattedAddress: input.area.formattedAddress,
      provider: "google_geocode_viewport",
      streetText: input.streetText,
    },
  };
}

function getRouteCoordinatePoints(route: MapRouteResult) {
  const decodedPoints = route.polyline ? decodePolyline(route.polyline) : [];

  if (decodedPoints.length > 0) {
    return decodedPoints;
  }

  return [route.origin, route.destination]
    .map((point) =>
      point.latitude != null && point.longitude != null
        ? { latitude: point.latitude, longitude: point.longitude }
        : null,
    )
    .filter((point): point is LatLng => Boolean(point));
}

async function searchPlacesNearRouteSamples(input: {
  bufferMeters: number;
  keyword: string;
  route: MapRouteResult;
}) {
  const samplePoints = sampleRoutePoints(getRouteCoordinatePoints(input.route));

  if (samplePoints.length === 0) {
    throw new MapProviderError(
      "Không tìm được tọa độ của tuyến đường này.",
      "ROUTE_NOT_FOUND",
    );
  }

  const routeOrigin =
    input.route.origin.latitude != null && input.route.origin.longitude != null
      ? {
          latitude: input.route.origin.latitude,
          longitude: input.route.origin.longitude,
        }
      : samplePoints[0];
  const placesById = new Map<
    string,
    { orderIndex: number; place: MapPlaceResult }
  >();

  await Promise.all(
    samplePoints.map(async (point, orderIndex) => {
      const places = await searchNearbyPlaces({
        keyword: input.keyword,
        latitude: point.latitude,
        longitude: point.longitude,
        radiusMeters: input.bufferMeters,
      });

      places.forEach((place) => {
        if (!placesById.has(place.placeId)) {
          placesById.set(place.placeId, { orderIndex, place });
        }
      });
    }),
  );

  const results: RoutePlaceResult[] = Array.from(placesById.values()).map(
    ({ orderIndex, place }) => ({
      ...place,
      distanceFromOriginMeters: getDistanceMeters(routeOrigin, place),
      distanceFromRouteMeters: getClosestRouteDistanceMeters(
        samplePoints,
        place,
      ),
      orderIndex,
    }),
  );

  results.sort((a, b) => {
    const routeDistanceDifference =
      (a.distanceFromRouteMeters ?? Number.MAX_SAFE_INTEGER) -
      (b.distanceFromRouteMeters ?? Number.MAX_SAFE_INTEGER);

    if (routeDistanceDifference !== 0) {
      return routeDistanceDifference;
    }

    if ((a.orderIndex ?? 0) !== (b.orderIndex ?? 0)) {
      return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
    }

    return (
      (a.distanceFromOriginMeters ?? Number.MAX_SAFE_INTEGER) -
      (b.distanceFromOriginMeters ?? Number.MAX_SAFE_INTEGER)
    );
  });

  return results.slice(0, MAX_ROUTE_RESULTS);
}

async function geocodeAreaWithViewport(areaText: string): Promise<GeocodedArea> {
  const payload = await fetchLegacyGoogle<
    GoogleMapsStatus & {
      results?: Array<{
        formatted_address?: string;
        geometry?: {
          location?: {
            lat?: number;
            lng?: number;
          };
          viewport?: {
            northeast?: {
              lat?: number;
              lng?: number;
            };
            southwest?: {
              lat?: number;
              lng?: number;
            };
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
  const viewport = firstResult?.geometry?.viewport;

  if (!firstResult || location?.lat == null || location.lng == null) {
    throw new MapProviderError(
      "Không tìm thấy khu vực này. Hãy nhập rõ phường/quận và tỉnh hoặc thành phố.",
      "AREA_NOT_FOUND",
    );
  }

  return {
    formattedAddress: firstResult.formatted_address,
    latitude: location.lat,
    longitude: location.lng,
    viewport:
      viewport?.northeast?.lat != null &&
      viewport.northeast.lng != null &&
      viewport.southwest?.lat != null &&
      viewport.southwest.lng != null
        ? {
            northeast: {
              latitude: viewport.northeast.lat,
              longitude: viewport.northeast.lng,
            },
            southwest: {
              latitude: viewport.southwest.lat,
              longitude: viewport.southwest.lng,
            },
          }
        : undefined,
  };
}

export async function geocodeArea(areaText: string) {
  const area = await geocodeAreaWithViewport(areaText);

  return {
    formattedAddress: area.formattedAddress,
    latitude: area.latitude,
    longitude: area.longitude,
  };
}

export async function getRoute(input: {
  destinationText: string;
  originText: string;
}): Promise<MapRouteResult> {
  const payload = await fetchLegacyGoogle<
    GoogleMapsStatus & { routes?: DirectionsRoute[] }
  >(
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
      "Không tìm được tuyến đường phù hợp. Vui lòng kiểm tra điểm đi và điểm đến.",
      "ROUTE_NOT_FOUND",
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
      provider: "google_directions",
      summary: route.summary,
      warnings: route.warnings,
    },
  };
}

export async function searchNearbyPlaces(input: {
  keyword: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}): Promise<MapPlaceResult[]> {
  const origin = {
    latitude: input.latitude,
    longitude: input.longitude,
  };
  const places = await fetchPlacesByText(input);

  // Text Search uses a circular bias, so enforce the user's chosen radius here.
  return normalizePlacesWithinRadius(places, origin, input.radiusMeters);
}

export async function searchAreaPlaces(input: {
  areaText: string;
  keyword: string;
  radiusMeters?: number;
}): Promise<{
  center: { latitude: number; longitude: number };
  results: MapPlaceResult[];
}> {
  const area = await geocodeArea(input.areaText);
  const center = {
    latitude: area.latitude,
    longitude: area.longitude,
  };
  const results = await searchNearbyPlaces({
    keyword: input.keyword,
    latitude: center.latitude,
    longitude: center.longitude,
    radiusMeters: input.radiusMeters || 3_000,
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
  const route = await getRoute({
    destinationText: input.destinationText,
    originText: input.originText,
  });
  const results = await searchPlacesNearRouteSamples({
    bufferMeters: input.bufferMeters,
    keyword: input.keyword,
    route,
  });

  return {
    results,
    route,
  };
}

export async function searchPlacesAlongStreet(input: {
  bufferMeters: number;
  keyword: string;
  streetText: string;
}): Promise<{
  results: RoutePlaceResult[];
  route: MapRouteResult;
}> {
  const area = await geocodeAreaWithViewport(input.streetText);
  const center = {
    latitude: area.latitude,
    longitude: area.longitude,
  };
  const endpoints = getEndpointPairFromViewport(center, area.viewport);
  const fallbackRoute = buildInferredStreetRoute({
    area,
    destination: endpoints.destination,
    origin: endpoints.origin,
    streetText: input.streetText,
  });
  let route = fallbackRoute;

  try {
    route = await getRoute({
      destinationText: formatLatLngText(endpoints.destination),
      originText: formatLatLngText(endpoints.origin),
    });
  } catch {
    route = fallbackRoute;
  }

  const results = await searchPlacesNearRouteSamples({
    bufferMeters: input.bufferMeters,
    keyword: input.keyword,
    route,
  });

  return {
    results,
    route,
  };
}
