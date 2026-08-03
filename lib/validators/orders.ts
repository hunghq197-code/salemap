import { z } from "zod";
import { orderStatusValues } from "@/lib/orders/order-status";

export const createAddOnOrderSchema = z.object({
  priceId: z.string().uuid(),
});

export const adminOrderTransitionSchema = z.object({
  note: z.string().trim().max(500).optional().or(z.literal("")),
  status: z.enum(orderStatusValues),
});

export type CreateAddOnOrderInput = z.infer<typeof createAddOnOrderSchema>;
