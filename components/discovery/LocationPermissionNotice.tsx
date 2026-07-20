import { MapPinOff } from "lucide-react";

type LocationPermissionNoticeProps = {
  message?: string | null;
};

export function LocationPermissionNotice({ message }: LocationPermissionNoticeProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
      <MapPinOff aria-hidden="true" className="mt-0.5 h-5 w-5 flex-none" />
      <p>{message}</p>
    </div>
  );
}
