import { UsersQueryRepository } from '../../../users/providers/users.query.repository';
import { CommentsRepository } from '../comments.repository';
import { CommentInputModel } from '../../dto/comment-input.model';
import { ForbiddenException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class UpdateCommentCommand {
  constructor(
    public commentId: string,
    public commentDto: CommentInputModel,
    public userId: string,
  ) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase
  implements ICommandHandler<UpdateCommentCommand>
{
  constructor(
    protected usersQueryRepository: UsersQueryRepository,
    protected commentsRepository: CommentsRepository,
  ) {}

  async execute(command: UpdateCommentCommand) {
    const { userId, commentId, commentDto } = command;
    const comment = await this.commentsRepository.getCommentModelById(
      commentId,
    );
    if (userId !== comment.commentatorId) {
      throw new ForbiddenException('Forbidden');
    }
    comment.updateContent(commentDto.content);
    return !!(await this.commentsRepository.save(comment));
  }
}
