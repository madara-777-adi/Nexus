import { Types } from "mongoose";
import ResourceModel, {
  IResource,
  ResourceSource,
} from "../models/resource.model";
import ConceptModel from "../../concept/models/concept.model";
import {
  CreateResourceDTO,
  UpdateResourceDTO,
} from "../validators/resource.validator";
import generateUserId from "../../../shared/utils/generateUserId";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";

class ResourceService {
  private async verifyConceptOwnership(
    conceptId: string,
    userObjectId: Types.ObjectId,
  ) {
    const concept = await ConceptModel.findOne({ conceptId });
    if (!concept) {
      throw new NotFoundError("Target concept not found.");
    }

    if (!concept.owner.equals(userObjectId)) {
      throw new ForbiddenError(
        "You do not have access to modify resources for this concept.",
      );
    }

    return { concept, workspaceId: concept.workspace };
  }

  async createResource(
    conceptId: string,
    userObjectId: Types.ObjectId,
    dto: CreateResourceDTO,
  ): Promise<IResource> {
    const { concept, workspaceId } = await this.verifyConceptOwnership(
      conceptId,
      userObjectId,
    );

    let resourceId: string;
    do {
      resourceId = `res_${generateUserId()}`;
    } while (await ResourceModel.exists({ resourceId }));

    return ResourceModel.create({
      resourceId,
      workspace: workspaceId,
      concept: concept._id,
      owner: userObjectId,
      title: dto.title,
      source: dto.source || ResourceSource.MANUAL,
      content: dto.content,
    });
  }

  async getResourcesByConcept(
    conceptId: string,
    userObjectId: Types.ObjectId,
  ): Promise<IResource[]> {
    const { concept, workspaceId } = await this.verifyConceptOwnership(
      conceptId,
      userObjectId,
    );
    return ResourceModel.find({
      workspace: workspaceId,
      concept: concept._id,
    }).sort({ createdAt: -1 });
  }

  async getResourceById(
    resourceId: string,
    userObjectId: Types.ObjectId,
  ): Promise<IResource> {
    const resource = await ResourceModel.findOne({ resourceId });
    if (!resource) {
      throw new NotFoundError("Resource not found.");
    }

    if (!resource.owner.equals(userObjectId)) {
      throw new ForbiddenError(
        "You do not have permission to view this resource.",
      );
    }

    return resource;
  }

  async updateResource(
    resourceId: string,
    userObjectId: Types.ObjectId,
    dto: UpdateResourceDTO,
  ): Promise<IResource> {
    const resource = await ResourceModel.findOne({ resourceId });
    if (!resource) {
      throw new NotFoundError("Resource not found.");
    }

    if (!resource.owner.equals(userObjectId)) {
      throw new ForbiddenError("You are not allowed to modify this resource.");
    }

    if (dto.title !== undefined) resource.title = dto.title;
    if (dto.source !== undefined) resource.source = dto.source;

    // Safely merge subdocument using parent document's .toObject()
    if (dto.content !== undefined) {
      const plainContent = resource.toObject().content || {};
      resource.set("content", {
        ...plainContent,
        ...dto.content,
      });
    }

    await resource.save();
    return resource;
  }

  async deleteResource(
    resourceId: string,
    userObjectId: Types.ObjectId,
  ): Promise<void> {
    const resource = await ResourceModel.findOne({ resourceId });
    if (!resource) {
      throw new NotFoundError("Resource not found.");
    }

    if (!resource.owner.equals(userObjectId)) {
      throw new ForbiddenError("You are not allowed to delete this resource.");
    }

    await ResourceModel.deleteOne({ _id: resource._id });
  }
}

export default new ResourceService();
