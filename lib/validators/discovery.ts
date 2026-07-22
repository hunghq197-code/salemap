import { z } from "zod";

const radiusSchema = z.coerce.number().refine(
  (value) => [500, 1000, 2000, 3000, 5000].includes(value),
  "Bán kính tìm kiếm chưa hợp lệ.",
);

const routeBufferSchema = z.coerce.number().refine(
  (value) => [500, 1000, 2000, 3000].includes(value),
  "Khoảng cách lệch tuyến chưa hợp lệ.",
);

const keywordSchema = z
  .string()
  .trim()
  .min(2, "Vui lòng nhập từ khóa ít nhất 2 ký tự.")
  .max(100, "Từ khóa không được dài quá 100 ký tự.");

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, "Nội dung quá dài.")
    .optional()
    .or(z.literal(""));

const coordinatesSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const nearMeSearchSchema = z.object({
  keyword: keywordSchema,
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusMeters: radiusSchema,
});

export const areaSearchSchema = z
  .object({
    areaText: optionalText(200),
    center: coordinatesSchema.optional(),
    keyword: keywordSchema,
    radiusMeters: radiusSchema,
  })
  .refine(
    (value) =>
      Boolean(value.center || (value.areaText && value.areaText.length >= 2)),
    {
      message: "Vui lòng nhập khu vực hoặc chọn vị trí trên bản đồ.",
      path: ["areaText"],
    },
  );

export const routeSearchSchema = z
  .object({
    bufferMeters: routeBufferSchema,
    destinationText: optionalText(200),
    keyword: keywordSchema,
    originText: optionalText(200),
    searchMode: z.enum(["street", "point_to_point"]).default("point_to_point"),
    streetText: optionalText(200),
  })
  .superRefine((value, context) => {
    if (value.searchMode === "street") {
      if (!value.streetText || value.streetText.length < 2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vui lòng nhập tên đường hoặc tuyến cần quét.",
          path: ["streetText"],
        });
      }
      return;
    }

    if (!value.originText || value.originText.length < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập điểm đi.",
        path: ["originText"],
      });
    }

    if (!value.destinationText || value.destinationText.length < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập điểm đến.",
        path: ["destinationText"],
      });
    }
  });

export const placeDetailsSchema = z.object({
  placeId: z.string().trim().min(2).max(300),
});

export const savePlaceSchema = z.object({
  address: optionalText(300),
  category: optionalText(120),
  googleMapsUrl: optionalText(500),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  name: z.string().trim().min(2).max(160),
  phone: optionalText(40),
  placeId: z.string().trim().min(2).max(300),
  rating: z.coerce.number().min(0).max(5).optional(),
  rawPlaceData: z.unknown().optional(),
  routeId: optionalText(80),
  routeStopId: optionalText(80),
  source: z.enum(["map_near_me", "map_area", "route_search"]),
  userRatingsTotal: z.coerce.number().int().min(0).optional(),
  website: optionalText(300),
});

export type AreaSearchInput = z.infer<typeof areaSearchSchema>;
export type NearMeSearchInput = z.infer<typeof nearMeSearchSchema>;
export type PlaceDetailsInput = z.infer<typeof placeDetailsSchema>;
export type RouteSearchInput = z.infer<typeof routeSearchSchema>;
export type SavePlaceInput = z.infer<typeof savePlaceSchema>;
