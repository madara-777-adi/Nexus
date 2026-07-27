import { Types } from "mongoose";
import RelationshipModel, {
  IRelationship,
  RelationshipType,
} from "../models/relationship.model";
import ConceptModel from "../../concept/models/concept.model";
import Workspace from "../../workspace/models/workspace.model";
import { CreateRelationshipDTO } from "../validators/relationship.validator";
import generateUserId from "../../../shared/utils/generateUserId";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { BadRequestError } from "../../../shared/errors/BadRequestError";

class RelationshipService {
  private async verifyWorkspaceOwnership(
    workspaceId: string,
    userObjectId: Types.ObjectId,
  ) {
    const workspace = await Workspace.findOne({ workspaceId });
    if (!workspace) throw new NotFoundError("Workspace not found.");
    if (!workspace.owner.equals(userObjectId)) {
      throw new ForbiddenError("You do not have access to this workspace.");
    }
    return workspace;
  }

  async createRelationship(
    workspaceId: string,
    userObjectId: Types.ObjectId,
    dto: CreateRelationshipDTO,
  ): Promise<IRelationship> {
    const workspace = await this.verifyWorkspaceOwnership(
      workspaceId,
      userObjectId,
    );

    if (dto.sourceConceptId === dto.targetConceptId) {
      throw new BadRequestError(
        "A concept cannot create a self-referential relationship.",
      );
    }

    // Resolve both concepts and verify graph isolation within workspace
    const [source, target] = await Promise.all([
      ConceptModel.findOne({
        conceptId: dto.sourceConceptId,
        workspace: workspace._id,
      }),
      ConceptModel.findOne({
        conceptId: dto.targetConceptId,
        workspace: workspace._id,
      }),
    ]);

    if (!source || !target) {
      throw new NotFoundError(
        "One or both concepts do not exist within this workspace graph.",
      );
    }

    let relationshipId: string;
    do {
      relationshipId = `rel_${generateUserId()}`;
    } while (await RelationshipModel.exists({ relationshipId }));

    return RelationshipModel.create({
      relationshipId,
      workspace: workspace._id,
      sourceConcept: source._id,
      targetConcept: target._id,
      type: dto.type || RelationshipType.RELATED_TO,
      description: dto.description || "",
      owner: userObjectId,
    });
  }

  // Stream-ready query for workspace edges (returns Mongoose Cursor for high-throughput streaming)
  async streamWorkspaceGraph(
    workspaceId: string,
    userObjectId: Types.ObjectId,
  ) {
    const workspace = await this.verifyWorkspaceOwnership(
      workspaceId,
      userObjectId,
    );
    return RelationshipModel.find({ workspace: workspace._id })
      .populate("sourceConcept", "conceptId title")
      .populate("targetConcept", "conceptId title")
      .cursor();
  }

  // Instant bidirectional graph neighborhood for a single concept
  async getConceptNeighborhood(
    conceptId: string,
    userObjectId: Types.ObjectId,
  ) {
    const concept = await ConceptModel.findOne({ conceptId });
    if (!concept) throw new NotFoundError("Concept not found.");
    if (!concept.owner.equals(userObjectId)) {
      throw new ForbiddenError("Access denied.");
    }

    const [outgoing, incoming] = await Promise.all([
      RelationshipModel.find({ sourceConcept: concept._id }).populate(
        "targetConcept",
        "conceptId title",
      ),
      RelationshipModel.find({ targetConcept: concept._id }).populate(
        "sourceConcept",
        "conceptId title",
      ),
    ]);

    return { conceptId, outgoing, incoming };
  }

  async deleteRelationship(
    relationshipId: string,
    userObjectId: Types.ObjectId,
  ): Promise<void> {
    const relationship = await RelationshipModel.findOne({ relationshipId });
    if (!relationship) throw new NotFoundError("Relationship edge not found.");
    if (!relationship.owner.equals(userObjectId)) {
      throw new ForbiddenError("Access denied.");
    }

    await RelationshipModel.deleteOne({ _id: relationship._id });
  }
}

export default new RelationshipService();
