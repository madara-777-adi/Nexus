import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import workspaceService from "../services/workspace.service";
import {
  CreateWorkspaceDTO,
  UpdateWorkspaceDTO,
} from "../validators/workspace.validator";

class WorkspaceController {
  async create(req: Request<{}, {}, CreateWorkspaceDTO>, res: Response) {
    const user = (req as any).user;
    const workspace = await workspaceService.createWorkspace(
      user._id,
      req.body,
    );

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Workspace created successfully",
      data: workspace,
    });
  }

  async getAll(req: Request, res: Response) {
    const user = (req as any).user;
    const workspaces = await workspaceService.getUserWorkspaces(user._id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Workspaces retrieved successfully",
      data: workspaces,
    });
  }

  async getOne(req: Request<{ id: string }>, res: Response) {
    const user = (req as any).user;
    const workspace = await workspaceService.getWorkspaceById(
      req.params.id,
      user._id,
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Workspace retrieved successfully",
      data: workspace,
    });
  }

  async update(
    req: Request<{ id: string }, {}, UpdateWorkspaceDTO>,
    res: Response,
  ) {
    const user = (req as any).user;
    const workspace = await workspaceService.updateWorkspace(
      req.params.id,
      user._id,
      req.body,
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Workspace updated successfully",
      data: workspace,
    });
  }

  async delete(req: Request<{ id: string }>, res: Response) {
    const user = (req as any).user;
    await workspaceService.deleteWorkspace(req.params.id, user._id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Workspace deleted successfully",
      data: null,
    });
  }
}

export default new WorkspaceController();
