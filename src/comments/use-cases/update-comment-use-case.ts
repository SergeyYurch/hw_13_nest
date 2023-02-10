import { UsersQueryRepository } from '../../users/users.query.repository';
import { CommentsRepository } from '../comments.repository';
import { CommentInputModel } from '../dto/commentInputModel';
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
    const comment = await this.commentsRepository.getCommentModel(commentId);
    if (userId !== comment.userId) {
      throw new ForbiddenException('Forbidden');
    }
    comment.updateContent(commentDto.content);
    return !!(await this.commentsRepository.save(comment));
  }
}
