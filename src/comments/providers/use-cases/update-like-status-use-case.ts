import { UsersQueryRepository } from '../../../users/providers/users.query.repository';
import { CommentsRepository } from '../comments.repository';
import { LikeStatusType } from '../../../common/dto/input-models/like.input.model';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class UpdateLikeStatusCommand {
  constructor(
    public commentId: string,
    public userId: string,
    public likeStatus: LikeStatusType,
  ) {}
}

@CommandHandler(UpdateLikeStatusCommand)
export class UpdateLikeStatusUseCase
  implements ICommandHandler<UpdateLikeStatusCommand>
{
  constructor(
    protected usersQueryRepository: UsersQueryRepository,
    protected commentsRepository: CommentsRepository,
  ) {}

  async execute(command: UpdateLikeStatusCommand) {
    const { userId, likeStatus, commentId } = command;
    const commentModel = await this.commentsRepository.getCommentModelById(
      commentId,
    );
    commentModel.updateLikeStatus(userId, likeStatus);
    await this.commentsRepository.save(commentModel);
  }
}
