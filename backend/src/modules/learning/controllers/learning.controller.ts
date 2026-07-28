import { Request, Response } from "express";
import learningService from "../services/learning.service";
import { RecordProgressDTO } from "../validators/learning.validator";

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

  async recordEvaluation(req: Request<{}, {}, RecordProgressDTO>, res: Response) {
    const user = (req as any).user;
    const result = await learningService.recordEvaluationResult(
      req.body.conceptId,
      user._id,
      req.body.masteryScore,
    );

    return res.status(200).json({
      success: true,
      message: "Mastery evaluated and graph state updated successfully",
      data: result,
    });
  }
}

export default new LearningController();