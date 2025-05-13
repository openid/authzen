import { z } from "zod";

export const resourceResponse = z.object({
  results: z.array(z.object({ type: z.string(), id: z.string() })),
});

export const subjectResponse = z.object({
  results: z.array(z.object({ type: z.string(), id: z.string() })),
});

export const actionResponse = z.object({
  results: z.array(z.object({ name: z.string() })),
});

export const metadataResponse = z.object({
  policy_decision_point: z.string(),
  access_evaluation_endpoint: z.string().optional(),
  access_evaluations_endpoint: z.string().optional(),
  search_subject_endpoint: z.string().optional(),
  search_resource_endpoint: z.string().optional(),
  search_action_endpoint: z.string().optional(),
});
