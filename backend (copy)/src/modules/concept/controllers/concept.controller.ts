import { Request, Response } from "express";
import conceptService from "../services/concept.service";
import { CreateConceptDTO, UpdateConceptDTO } from "../validators/concept.validator";

class ConceptController {
  async create(req: Request<{ workspaceId: string }, {}, CreateConceptDTO>, res: Response) {
    const user = (req as any).user;
    const concept = await conceptService.createConcept(req.params.workspaceId, user._id, req.body);

    return res.status(201).json({
      success: true,
      message: "Concept created successfully",
      data: concept,
    });
  }

  async getAllInWorkspace(req: Request<{ workspaceId: string }>, res: Response) {
    const user = (req as any).user;
    const concepts = await conceptService.getConceptsByWorkspace(req.params.workspaceId, user._id);

    return res.status(200).json({
      success: true,
      message: "Concepts retrieved successfully",
      data: concepts,
    });
  }

  async getOne(req: Request<{ conceptId: string }>, res: Response) {
    const user = (req as any).user;
    const concept = await conceptService.getConceptById(req.params.conceptId, user._id);

    return res.status(200).json({
      success: true,
      message: "Concept retrieved successfully",
      data: concept,
    });
  }

  async update(req: Request<{ conceptId: string }, {}, UpdateConceptDTO>, res: Response) {
    const user = (req as any).user;
    const concept = await conceptService.updateConcept(req.params.conceptId, user._id, req.body);

    return res.status(200).json({
      success: true,
      message: "Concept updated successfully",
      data: concept,
    });
  }

  async delete(req: Request<{ conceptId: string }>, res: Response) {
    const user = (req as any).user;
    await conceptService.deleteConcept(req.params.conceptId, user._id);

    return res.status(200).json({
      success: true,
      message: "Concept deleted successfully",
      data: null,
    });
  }
}

export default new ConceptController();