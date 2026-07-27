import { Request, Response } from "express";
import aiGeneratorService from "../services/ai-generator.service";
import { GenerateResourceDTO } from "../validators/ai.validator";

class AIController {
  async generateResource(
    req: Request<{ conceptId: string }, {}, GenerateResourceDTO>,
    res: Response,
  ) {
    const user = (req as any).user;
    const resource = await aiGeneratorService.generateConceptResource(
      req.params.conceptId,
      user._id,
      req.body.userInstructions,
    );

    return res.status(201).json({
      success: true,
      message: "AI knowledge resource generated successfully",
      data: resource,
    });
  }
}

export default new AIController();