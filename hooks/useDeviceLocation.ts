"use client";

import { useCallback, useEffect, useState } from "react";

type DeviceLocation = {
  accuracy: number | null;
  error: string | null;
  latitude: number | null;
  loading: boolean;
  longitude: number | null;
  permissionState: PermissionState | "unsupported" | "unknown";
  requestLocation: () => Promise<void>;
  resetLocation: () => void;
};

const POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 60_000,
  timeout: 10_000,
};

function getLocationErrorMessage(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error
      ? Number((error as { code?: unknown }).code)
      : 0;

  if (code === 1) {
    return "Bạn đã từ chối quyền vị trí. Hãy bật lại quyền vị trí trong trình duyệt hoặc nhập khu vực thủ công.";
  }

  if (code === 3) {
    return "Không lấy được vị trí hiện tại. Vui lòng thử lại hoặc nhập khu vực thủ công.";
  }

  return "Không lấy được vị trí hiện tại. Vui lòng thử lại hoặc nhập khu vực thủ công.";
}

function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, POSITION_OPTIONS);
  });
}

export function useDeviceLocation(): DeviceLocation {
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [permissionState, setPermissionState] = useState<
    DeviceLocation["permissionState"]
  >("unknown");

  useEffect(() => {
    let active = true;

    async function readPermissionState() {
      if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
        setPermissionState("unsupported");
        return;
      }

      if (!navigator.permissions?.query) {
        setPermissionState("unknown");
        return;
      }

      try {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });

        if (!active) return;

        setPermissionState(permission.state);
        permission.onchange = () => setPermissionState(permission.state);
      } catch {
        if (active) setPermissionState("unknown");
      }
    }

    void readPermissionState();

    return () => {
      active = false;
    };
  }, []);

  const requestLocation = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermissionState("unsupported");
      setError(
        "Trình duyệt này không hỗ trợ định vị. Hãy nhập khu vực thủ công.",
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await getCurrentPosition();

      setAccuracy(position.coords.accuracy);
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
      setPermissionState("granted");
    } catch (locationError) {
      setError(getLocationErrorMessage(locationError));
      if (
        locationError &&
        typeof locationError === "object" &&
        "code" in locationError &&
        Number((locationError as { code?: unknown }).code) === 1
      ) {
        setPermissionState("denied");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const resetLocation = useCallback(() => {
    setAccuracy(null);
    setError(null);
    setLatitude(null);
    setLongitude(null);
  }, []);

  return {
    accuracy,
    error,
    latitude,
    loading,
    longitude,
    permissionState,
    requestLocation,
    resetLocation,
  };
}
