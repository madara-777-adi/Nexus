import { Request, Response, NextFunction } from "express";
import relationshipService from "../services/relationship.service";
import { CreateRelationshipDTO } from "../validators/relationship.validator";

class RelationshipController {
  async create(
    req: Request<{ workspaceId: string }, {}, CreateRelationshipDTO>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const user = (req as any).user;
      const relationship = await relationshipService.createRelationship(
        req.params.workspaceId,
        user._id,
        req.body,
      );

      return res.status(201).json({
        success: true,
        message: "Relationship edge established successfully",
        data: relationship,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Structured REST JSON endpoint returning the 2-level syllabus graph payload
   */
  async getGraph(
    req: Request<{ workspaceId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const user = (req as any).user;
      const { concepts, relationships } =
        await relationshipService.streamWorkspaceGraph(
          req.params.workspaceId,
          user._id,
        );

      return res.status(200).json({
        success: true,
        message: "Workspace graph retrieved successfully",
        data: {
          concepts,
          relationships,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getNeighborhood(
    req: Request<{ conceptId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const user = (req as any).user;
      const neighborhood = await relationshipService.getConceptNeighborhood(
        req.params.conceptId,
        user._id,
      );

      return res.status(200).json({
        success: true,
        message: "Concept neighborhood retrieved successfully",
        data: neighborhood,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(
    req: Request<{ relationshipId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const user = (req as any).user;
      await relationshipService.deleteRelationship(
        req.params.relationshipId,
        user._id,
      );

      return res.status(200).json({
        success: true,
        message: "Relationship edge deleted successfully",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new RelationshipController();