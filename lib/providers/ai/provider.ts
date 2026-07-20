import { DefaultAIProvider } from "@/lib/providers/ai/default-provider";
import type { AIProvider } from "@/lib/providers/ai/types";

export function getAIProvider(): AIProvider {
  return new DefaultAIProvider();
}
