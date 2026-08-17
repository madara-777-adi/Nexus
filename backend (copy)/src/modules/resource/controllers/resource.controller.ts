import { Request, Response } from "express";
import resourceService from "../services/resource.service";
import { CreateResourceDTO, UpdateResourceDTO } from "../validators/resource.validator";

class ResourceController {
  async create(req: Request<{ conceptId: string }, {}, CreateResourceDTO>, res: Response) {
    const user = (req as any).user;
    const resource = await resourceService.createResource(req.params.conceptId, user._id, req.body);

    return res.status(201).json({
      success: true,
      message: "Structured text resource attached successfully",
      data: resource,
    });
  }

  async getAllForConcept(req: Request<{ conceptId: string }>, res: Response) {
    const user = (req as any).user;
    const resources = await resourceService.getResourcesByConcept(req.params.conceptId, user._id);

    return res.status(200).json({
      success: true,
      message: "Resources retrieved successfully",
      data: resources,
    });
  }

  async getOne(req: Request<{ resourceId: string }>, res: Response) {
    const user = (req as any).user;
    const resource = await resourceService.getResourceById(req.params.resourceId, user._id);

    return res.status(200).json({
      success: true,
      message: "Resource retrieved successfully",
      data: resource,
    });
  }

  async update(req: Request<{ resourceId: string }, {}, UpdateResourceDTO>, res: Response) {
    const user = (req as any).user;
    const resource = await resourceService.updateResource(req.params.resourceId, user._id, req.body);

    return res.status(200).json({
      success: true,
      message: "Resource updated successfully",
      data: resource,
    });
  }

  async delete(req: Request<{ resourceId: string }>, res: Response) {
    const user = (req as any).user;
    await resourceService.deleteResource(req.params.resourceId, user._id);

    return res.status(200).json({
      success: true,
      message: "Resource removed successfully",
      data: null,
    });
  }
}

export default new ResourceController();