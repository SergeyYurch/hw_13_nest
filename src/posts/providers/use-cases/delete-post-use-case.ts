import { PostsRepository } from '../posts.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsService } from '../../../blogs/providers/blogs.service';

export class DeletePostCommand {
  constructor(
    public userId: string,
    public blogId: string,
    public postId: string,
  ) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase implements ICommandHandler<DeletePostCommand> {
  constructor(
    private postRepository: PostsRepository,
    private blogsService: BlogsService,
  ) {}

  async execute(command: DeletePostCommand): Promise<boolean> {
    const { userId, blogId, postId } = command;
    await this.blogsService.checkBlogOwner(blogId, userId);
    return this.postRepository.delete(postId);
  }
}
