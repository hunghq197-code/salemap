import type { TaskLeadSummary, TaskRecord } from "@/lib/data/tasks";

export type CadenceTemplate = {
  activeLeadsCount?: number;
  category: string;
  createdAt: string;
  description?: string | null;
  id: string;
  isActive: boolean;
  isArchived: boolean;
  isSystem: boolean;
  name: string;
  steps?: CadenceStep[];
  stepsCount?: number;
  updatedAt: string;
  userId?: string | null;
};

export type CadenceStep = {
  cadenceTemplateId: string;
  dayOffset: number;
  id: string;
  isRequired: boolean;
  priority: string;
  stepOrder: number;
  suggestedLeadStatus?: string | null;
  suggestedMessage?: string | null;
  suggestedNote?: string | null;
  taskType: string;
  title: string;
};

export type LeadCadence = {
  cancelledAt?: string | null;
  completedAt?: string | null;
  completedSteps: number;
  createdAt: string;
  currentStepOrder: number;
  id: string;
  lead?: TaskLeadSummary;
  leadId: string;
  pausedAt?: string | null;
  startedAt: string;
  status: "active" | "cancelled" | "completed" | "paused";
  steps?: LeadCadenceStepProgress[];
  template?: CadenceTemplate;
  cadenceTemplateId: string;
  totalSteps: number;
  updatedAt: string;
  userId: string;
};

export type LeadCadenceStepProgress = CadenceStep & {
  completedAt?: string | null;
  reminderId?: string | null;
  reminderStatus?: string | null;
};

export type CadenceTaskLink = {
  cadenceStepId: string;
  id: string;
  leadCadenceId: string;
  reminderId: string;
  stepOrder: number;
  userId: string;
};

export type TaskCadenceMetadata = {
  leadCadenceId: string;
  status: string;
  stepOrder: number;
  suggestedLeadStatus?: string | null;
  suggestedMessage?: string | null;
  suggestedNote?: string | null;
  templateName: string;
  totalSteps: number;
};

export type TaskRecordWithCadence = TaskRecord & {
  cadence?: TaskCadenceMetadata | null;
};
