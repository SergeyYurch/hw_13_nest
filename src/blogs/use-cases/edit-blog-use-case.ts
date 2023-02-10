import { BlogsRepository } from '../blogs.repository';
import { BlogInputModel } from '../dto/blogInputModel';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsService } from '../blogs.service';

export class EditBlogCommand {
  constructor(
    public userId: string,
    public blogId: string,
    public changes: BlogInputModel,
  ) {}
}

@CommandHandler(EditBlogCommand)
export class EditBlogUseCase implements ICommandHandler<EditBlogCommand> {
  constructor(
    private readonly blogRepository: BlogsRepository,
    private readonly blogsService: BlogsService,
  ) {}

  async execute(command: EditBlogCommand) {
    const { userId, blogId, changes } = command;
    await this.blogsService.checkBlogOwner(blogId, userId);
    const editBlog = await this.blogRepository.getBlogModel(blogId);
    editBlog.blogUpdate(changes);
    return !!(await this.blogRepository.save(editBlog));
  }
}
