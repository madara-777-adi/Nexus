import { z } from "zod";
import { RelationshipType } from "../models/relationship.model";

export const createRelationshipSchema = z.object({
  sourceConceptId: z.string().min(1, "Source concept ID is required"),
  targetConceptId: z.string().min(1, "Target concept ID is required"),
  type: z.nativeEnum(RelationshipType).optional(),
  description: z.string().max(300, "Description cannot exceed 300 characters").optional(),
});

export const workspaceParamsSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export const conceptParamsSchema = z.object({
  conceptId: z.string().min(1, "Concept ID is required"),
});

export const relationshipParamsSchema = z.object({
  relationshipId: z.string().min(1, "Relationship ID is required"),
});

export type CreateRelationshipDTO = z.infer<typeof createRelationshipSchema>;