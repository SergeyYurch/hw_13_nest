import { Injectable } from '@nestjs/common';
import { Comment, CommentDocument } from './domain/comment.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) private CommentModel: Model<CommentDocument>,
  ) {}

  async getCommentModel(id: string) {
    return this.CommentModel.findById(id);
  }

  async createCommentModel() {
    return new this.CommentModel();
  }

  async deleteComment(commentId: string) {
    const result = await this.CommentModel.deleteOne({
      _id: new Types.ObjectId(commentId),
    });
    return result.deletedCount === 1;
  }

  async save(createdComment: CommentDocument) {
    const newComment = await createdComment.save();
    return newComment?._id?.toString();
  }
}
