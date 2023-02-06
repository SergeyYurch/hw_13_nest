import { CommentsRepository } from './comments.repository';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './domain/comment.schema';
import { CommentInputModel } from './dto/commentInputModel';
import { LikeStatusType } from '../common/inputModels/likeInputModel';
import { CommentsQueryRepository } from './comments.query.repository';
import { UsersQueryRepository } from '../users/users.query.repository';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private CommentModel: Model<CommentDocument>,
    protected commentsQueryRepository: CommentsQueryRepository,
    protected usersQueryRepository: UsersQueryRepository,
    protected commentsRepository: CommentsRepository,
  ) {}

  async createComment(content: string, userId: string, postId: string) {
    const { login } = await this.usersQueryRepository.getUserById(userId);
    const createdComment = new this.CommentModel();
    createdComment.initial(content, userId, login, postId);
    await this.commentsRepository.save(createdComment);
    const comment = await this.commentsRepository.save(createdComment);
    return this.commentsQueryRepository.getCommentViewModel(comment);
  }

  async validateOwner(commentId, userId) {
    const comment = await this.CommentModel.findById(commentId);
    if (userId !== comment.userId) {
      throw new ForbiddenException('Forbidden');
    }
  }

  async deleteComment(commentId: string) {
    const result = await this.CommentModel.deleteOne({
      _id: new Types.ObjectId(commentId),
    });
    return result.deletedCount === 1;
  }

  async updateComment(
    commentId: string,
    commentDto: CommentInputModel,
    userId: string,
  ) {
    const comment = await this.CommentModel.findById(commentId);
    if (userId !== comment.userId) {
      throw new ForbiddenException('Forbidden');
    }
    comment.updateContent(commentDto.content);
    return await this.commentsRepository.save(comment);
  }

  async updateLikeStatus(
    commentId: string,
    userId: string,
    likeStatus: LikeStatusType,
  ) {
    const comment = await this.CommentModel.findById(commentId);
    comment.updateLikeStatus(userId, likeStatus);
    await this.commentsRepository.save(comment);
  }
}
