import { CommentsRepository } from '../comments.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class DeleteCommentCommand {
  constructor(public commentId: string) {}
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentUseCase
  implements ICommandHandler<DeleteCommentCommand>
{
  constructor(protected commentsRepository: CommentsRepository) {}

  async execute(command: DeleteCommentCommand) {
    return await this.commentsRepository.deleteComment(command.commentId);
  }
}
