import { z } from "zod";

export const resourceResponse = z.object({
  results: z.array(z.object({ type: z.string(), id: z.string() })),
});

export const subjectResponse = z.object({
  results: z.array(z.object({ type: z.string(), id: z.string() })),
});

export const actionResponse = z.object({
  results: z.array(z.string()),
});
