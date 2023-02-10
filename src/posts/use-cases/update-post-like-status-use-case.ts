import { UsersQueryRepository } from '../../users/users.query.repository';
import { PostsRepository } from '../posts.repository';
import { LikeStatusType } from '../../common/inputModels/likeInputModel';
export class UpdatePostLikeStatusCommand {
  constructor(
    public postId: string,
    public userId: string,
    public likeStatus: LikeStatusType,
  ) {}
}

export class UpdatePostLikeStatusUseCase {
  constructor(
    private usersQueryRepository: UsersQueryRepository,
    private postRepository: PostsRepository,
  ) {}

  async execute(command: UpdatePostLikeStatusCommand) {
    const { postId, userId, likeStatus } = command;
    const postModel = await this.postRepository.findModel(postId);
    const { login } = await this.usersQueryRepository.getUserById(userId);
    postModel.updateLikeStatus(userId, login, likeStatus);
    return !!(await this.postRepository.save(postModel));
  }
}
