import { BlogsRepository } from '../blogs.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsService } from '../blogs.service';

export class DeleteBlogCommand {
  constructor(public userId, public blogId: string) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase implements ICommandHandler<DeleteBlogCommand> {
  constructor(
    private blogRepository: BlogsRepository,
    private blogsService: BlogsService,
  ) {}

  async execute(command: DeleteBlogCommand) {
    const { userId, blogId } = command;
    await this.blogsService.checkBlogOwner(blogId, userId);
    return await this.blogRepository.deleteBlog(command.blogId);
  }
}
