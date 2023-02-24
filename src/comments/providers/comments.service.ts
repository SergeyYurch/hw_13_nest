import { ForbiddenException, Injectable } from '@nestjs/common';
import { UsersQueryRepository } from '../../users/providers/users.query.repository';
import { CommentsRepository } from './comments.repository';

@Injectable()
export class CommentsService {
  constructor(
    protected usersQueryRepository: UsersQueryRepository,
    protected commentsRepository: CommentsRepository,
  ) {}

  async validateOwner(commentId, userId) {
    const comment = await this.commentsRepository.getCommentModelById(
      commentId,
    );
    if (userId !== comment.commentatorId) {
      throw new ForbiddenException('Forbidden');
    }
  }
}
