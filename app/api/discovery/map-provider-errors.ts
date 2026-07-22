const DEFAULT_MAPS_CONFIG_MESSAGE =
  "Chưa cấu hình Google Maps API key trên server. Vui lòng kiểm tra biến GOOGLE_MAPS_API_KEY.";

const DEFAULT_MAPS_ACCESS_MESSAGE =
  "Google Maps API key chưa được cấp quyền, sai giới hạn truy cập, hoặc chưa bật API/billing cần thiết.";

const DEFAULT_MAPS_BILLING_MESSAGE =
  "Google Maps chưa nhận diện Billing cho project chứa API key. Vui lòng kiểm tra Billing và thử lại sau.";

const DEFAULT_MAPS_QUOTA_MESSAGE =
  "Google Maps đang vượt quota hoặc giới hạn truy cập. Vui lòng thử lại sau.";

const DEFAULT_MAPS_UNAVAILABLE_MESSAGE =
  "Google Maps đang tạm thời không phản hồi. Vui lòng thử lại sau.";

export function getMapProviderApiError(
  code: string,
  messages: {
    fallback: string;
    quotaExceeded: string;
  },
) {
  if (code === "QUOTA_EXCEEDED") {
    return {
      message: messages.quotaExceeded,
      status: 429,
    };
  }

  if (code === "MAP_PROVIDER_NOT_CONFIGURED") {
    return {
      message: DEFAULT_MAPS_CONFIG_MESSAGE,
      status: 503,
    };
  }

  if (
    code === "MAP_PROVIDER_ACCESS_DENIED" ||
    code === "MAP_PROVIDER_AUTH_ERROR"
  ) {
    return {
      message: DEFAULT_MAPS_ACCESS_MESSAGE,
      status: 503,
    };
  }

  if (code === "MAP_PROVIDER_BILLING_ERROR") {
    return {
      message: DEFAULT_MAPS_BILLING_MESSAGE,
      status: 503,
    };
  }

  if (
    code === "MAP_PROVIDER_QUOTA_EXCEEDED" ||
    code === "MAP_PROVIDER_QUOTA_ERROR"
  ) {
    return {
      message: DEFAULT_MAPS_QUOTA_MESSAGE,
      status: 429,
    };
  }

  if (code === "MAP_PROVIDER_UNAVAILABLE") {
    return {
      message: DEFAULT_MAPS_UNAVAILABLE_MESSAGE,
      status: 503,
    };
  }

  return {
    message: messages.fallback,
    status: 502,
  };
}
