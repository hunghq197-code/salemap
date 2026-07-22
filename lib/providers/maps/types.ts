export type MapPlaceResult = {
  address?: string;
  category?: string;
  detailsLoaded?: boolean;
  distanceMeters?: number;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
  name: string;
  phone?: string;
  placeId: string;
  rating?: number;
  raw?: unknown;
  userRatingsTotal?: number;
  website?: string;
};

export type MapPlaceDetails = Pick<
  MapPlaceResult,
  | "googleMapsUrl"
  | "phone"
  | "rating"
  | "userRatingsTotal"
  | "website"
> & {
  detailsLoaded: true;
};

export type MapRouteResult = {
  destination: {
    latitude?: number;
    longitude?: number;
    text: string;
  };
  distanceMeters?: number;
  durationSeconds?: number;
  origin: {
    latitude?: number;
    longitude?: number;
    text: string;
  };
  polyline?: string;
  raw?: unknown;
};

export type RoutePlaceResult = MapPlaceResult & {
  distanceFromOriginMeters?: number;
  distanceFromRouteMeters?: number;
  orderIndex?: number;
};

export type DiscoveryPlaceResult = MapPlaceResult & {
  distanceFromOriginMeters?: number;
  distanceFromRouteMeters?: number;
  isSaved: boolean;
  orderIndex?: number;
  routeStopId?: string;
  savedLeadId?: string;
};

export type DiscoveryRouteResult = {
  destinationText: string;
  distanceMeters?: number;
  durationSeconds?: number;
  id?: string;
  originText: string;
  polyline?: string;
};

export type DiscoveryQuota = {
  actionType: string;
  limit: number;
  remaining: number;
  used: number;
};

export type DiscoverySource = "map_area" | "map_near_me" | "route_search";
