import { z } from "zod";
import {
  ticketPriorityValues,
  ticketStatusValues,
  ticketVisibilityValues,
} from "@/lib/tickets/ticket-status";

export const createSupportTicketSchema = z.object({
  categorySlug: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().min(10).max(4000),
  pagePath: z.string().trim().max(300).optional().or(z.literal("")),
  subject: z.string().trim().min(3).max(160),
});

export const userTicketReplySchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

export const adminTicketUpdateSchema = z.object({
  assignedAdminId: z.string().uuid().optional().nullable().or(z.literal("")),
  priority: z.enum(ticketPriorityValues),
  status: z.enum(ticketStatusValues),
});

export const adminTicketReplySchema = z.object({
  body: z.string().trim().min(1).max(5000),
  visibility: z.enum(ticketVisibilityValues),
});

export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;
export type UserTicketReplyInput = z.infer<typeof userTicketReplySchema>;
export type AdminTicketUpdateInput = z.infer<typeof adminTicketUpdateSchema>;
export type AdminTicketReplyInput = z.infer<typeof adminTicketReplySchema>;
