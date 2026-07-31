import { Request, Response } from "express";
import learningService from "../services/learning.service";
import { RecordProgressDTO } from "../validators/learning.validator";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";

class LearningController {
  async initializeProgress(req: Request<{ workspaceId: string }>, res: Response) {
    const user = (req as any).user;
    const progress = await learningService.initializeWorkspaceProgress(
      req.params.workspaceId,
      user._id,
    );

    return res.status(200).json({
      success: true,
      message: "Workspace learning graph initialized successfully",
      data: progress,
    });
  }

  async getWorkspaceProgress(req: Request<{ workspaceId: string }>, res: Response) {
    const user = (req as any).user;
    const progress = await learningService.getWorkspaceProgress(
      req.params.workspaceId,
      user._id,
    );

    return res.status(200).json({
      success: true,
      message: "Workspace learning progression retrieved successfully",
      data: progress,
    });
  }

  // RC-003 Security Fix: Block direct client updates to mastery scores
  async recordEvaluation(_req: Request<{}, {}, RecordProgressDTO>, _res: Response) {
    throw new ForbiddenError(
      "Direct mastery score updates are disabled. Submissions must be processed through the server-side AI evaluation pipeline."
    );
  }
}

export default new LearningController();