import { Types } from "mongoose";
import ConceptModel, { IConcept } from "../models/concept.model";
import Workspace from "../../workspace/models/workspace.model";
import {
  CreateConceptDTO,
  UpdateConceptDTO,
} from "../validators/concept.validator";
import generateUserId from "../../../shared/utils/generateUserId";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";

class ConceptService {
  private async verifyWorkspaceOwnership(
    workspaceId: string,
    userObjectId: Types.ObjectId,
  ) {
    const workspace = await Workspace.findOne({ workspaceId });
    if (!workspace) {
      throw new NotFoundError("Workspace not found.");
    }

    if (!workspace.owner.equals(userObjectId)) {
      throw new ForbiddenError("You do not have access to this workspace.");
    }

    return workspace;
  }

  async createConcept(
    workspaceId: string,
    userObjectId: Types.ObjectId,
    dto: CreateConceptDTO,
  ): Promise<IConcept> {
    const workspace = await this.verifyWorkspaceOwnership(
      workspaceId,
      userObjectId,
    );

    let conceptId: string;
    do {
      conceptId = `cpt_${generateUserId()}`;
    } while (await ConceptModel.exists({ conceptId }));

    return ConceptModel.create({
      conceptId,
      workspace: workspace._id,
      owner: userObjectId,
      title: dto.title,
      description: dto.description || "",
    });
  }

  async getConceptsByWorkspace(
    workspaceId: string,
    userObjectId: Types.ObjectId,
  ): Promise<IConcept[]> {
    const workspace = await this.verifyWorkspaceOwnership(
      workspaceId,
      userObjectId,
    );
    return ConceptModel.find({ workspace: workspace._id }).sort({
      createdAt: -1,
    });
  }

  async getConceptById(
    conceptId: string,
    userObjectId: Types.ObjectId,
  ): Promise<IConcept> {
    const concept = await ConceptModel.findOne({ conceptId });
    if (!concept) {
      throw new NotFoundError("Concept not found.");
    }

    if (!concept.owner.equals(userObjectId)) {
      throw new ForbiddenError(
        "You do not have permission to view this concept.",
      );
    }

    return concept;
  }

  async updateConcept(
    conceptId: string,
    userObjectId: Types.ObjectId,
    dto: UpdateConceptDTO,
  ): Promise<IConcept> {
    const concept = await ConceptModel.findOne({ conceptId });
    if (!concept) {
      throw new NotFoundError("Concept not found.");
    }

    if (!concept.owner.equals(userObjectId)) {
      throw new ForbiddenError("You are not allowed to perform this action.");
    }

    if (dto.title !== undefined) concept.title = dto.title;
    if (dto.description !== undefined) concept.description = dto.description;

    await concept.save();
    return concept;
  }

  async deleteConcept(
    conceptId: string,
    userObjectId: Types.ObjectId,
  ): Promise<void> {
    const concept = await ConceptModel.findOne({ conceptId });
    if (!concept) {
      throw new NotFoundError("Concept not found.");
    }

    if (!concept.owner.equals(userObjectId)) {
      throw new ForbiddenError("You are not allowed to perform this action.");
    }

    await ConceptModel.deleteOne({ _id: concept._id });

    // TODO: Cascade delete connected Relationships and Resources when those modules are built
  }
}

export default new ConceptService();
