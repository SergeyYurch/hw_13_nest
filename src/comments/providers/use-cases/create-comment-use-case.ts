import { UsersQueryRepository } from '../../../users/providers/users.query.repository';
import { CommentsRepository } from '../comments.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreateCommentCommand {
  constructor(
    public content: string,
    public userId: string,
    public postId: string,
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand>
{
  constructor(
    protected usersQueryRepository: UsersQueryRepository,
    protected commentsRepository: CommentsRepository,
  ) {}

  async execute(command: CreateCommentCommand) {
    const { userId, postId, content } = command;
    const blogger = await this.usersQueryRepository.getUserById(userId);
    const commentModel = await this.commentsRepository.createCommentModel();
    commentModel.initial(content, userId, blogger.login, postId);
    await this.commentsRepository.save(commentModel);
    return await this.commentsRepository.save(commentModel);
  }
}
