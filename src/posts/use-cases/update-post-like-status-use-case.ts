import { UsersQueryRepository } from '../../users/users.query.repository';
import { PostsRepository } from '../posts.repository';
import { LikeStatusType } from '../../common/inputModels/likeInputModel';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
export class UpdatePostLikeStatusCommand {
  constructor(
    public postId: string,
    public userId: string,
    public likeStatus: LikeStatusType,
  ) {}
}

@CommandHandler(UpdatePostLikeStatusCommand)
export class UpdatePostLikeStatusUseCase
  implements ICommandHandler<UpdatePostLikeStatusCommand>
{
  constructor(
    private usersQueryRepository: UsersQueryRepository,
    private postRepository: PostsRepository,
  ) {}

  async execute(command: UpdatePostLikeStatusCommand) {
    const { postId, userId, likeStatus } = command;
    const postModel = await this.postRepository.getPostModelById(postId);
    const { login } = await this.usersQueryRepository.getUserById(userId);
    postModel.updateLikeStatus(userId, login, likeStatus);
    return !!(await this.postRepository.save(postModel));
  }
}
