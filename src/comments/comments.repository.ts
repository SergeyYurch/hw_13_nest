import { Injectable } from '@nestjs/common';
import { CommentDocument } from './domain/comment.schema';

@Injectable()
export class CommentsRepository {
  async save(createdComment: CommentDocument) {
    return createdComment.save();
  }
}
