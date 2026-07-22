type MapsDestination = {
  address?: string | null;
  googleMapsUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
};

export function getGoogleMapsDirectionsUrl(destination: MapsDestination) {
  const hasCoordinates =
    destination.latitude != null && destination.longitude != null;
  const destinationValue = hasCoordinates
    ? `${destination.latitude},${destination.longitude}`
    : destination.address?.trim();

  if (!destinationValue) {
    return destination.googleMapsUrl || null;
  }

  const params = new URLSearchParams({
    api: "1",
    destination: destinationValue,
    travelmode: "driving",
  });

  if (destination.placeId) {
    params.set("destination_place_id", destination.placeId);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
