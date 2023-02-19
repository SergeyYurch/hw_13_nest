import { PostsRepository } from '../posts.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class BanPostsCommand {
  constructor(public userId: string, public isBanned: boolean) {}
}

@CommandHandler(BanPostsCommand)
export class BanPostsUseCase implements ICommandHandler<BanPostsCommand> {
  constructor(private postRepository: PostsRepository) {}

  async execute(command: BanPostsCommand): Promise<boolean> {
    const { userId, isBanned } = command;
    const posts = await this.postRepository.getPostsModelsByUserId(userId);
    for (const postModel of posts) {
      postModel.banPost(isBanned);
      const result = await this.postRepository.save(postModel);
      if (!result) return false;
    }
    return true;
  }
}
