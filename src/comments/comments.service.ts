import { QueryRepository } from '../query/query.repository';
import { CommentsRepository } from './comments.repository';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './domain/comment.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private CommentModel: Model<CommentDocument>,
    protected queryRepository: QueryRepository,
    protected commentsRepository: CommentsRepository,
  ) {}
  async createComment(content: string, userId: string, postId: string) {
    const { login } = await this.queryRepository.getUserById(userId);

    const createdComment = new this.CommentModel();
    createdComment.initial(content, userId, login, postId);
    await this.commentsRepository.save(createdComment);
    const comment = await this.commentsRepository.save(createdComment);
    return this.queryRepository.getCommentViewModel(comment);
  }
}
