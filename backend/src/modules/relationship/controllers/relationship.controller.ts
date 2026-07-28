import { Request, Response } from "express";
import relationshipService from "../services/relationship.service";
import { CreateRelationshipDTO } from "../validators/relationship.validator";

class RelationshipController {
  async create(req: Request<{ workspaceId: string }, {}, CreateRelationshipDTO>, res: Response) {
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
  }

  // Efficient Data Stream endpoint using NDJSON (Newline Delimited JSON)
  async streamGraph(req: Request<{ workspaceId: string }>, res: Response) {
    const user = (req as any).user;
    const cursor = await relationshipService.streamWorkspaceGraph(req.params.workspaceId, user._id);

    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Transfer-Encoding", "chunked");

    // Handle early client disconnect to clean up DB cursor
    req.on("close", () => {
      cursor.close().catch(() => {});
    });

    try {
      for await (const edge of cursor) {
        res.write(JSON.stringify(edge) + "\n");
      }
      res.end();
    } catch (error) {
      cursor.close().catch(() => {});
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Stream failed unexpectedly" });
      } else {
        res.end();
      }
    }
  }

  async getNeighborhood(req: Request<{ conceptId: string }>, res: Response) {
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
  }

  async delete(req: Request<{ relationshipId: string }>, res: Response) {
    const user = (req as any).user;
    await relationshipService.deleteRelationship(req.params.relationshipId, user._id);

    return res.status(200).json({
      success: true,
      message: "Relationship edge deleted successfully",
      data: null,
    });
  }
}

export default new RelationshipController();