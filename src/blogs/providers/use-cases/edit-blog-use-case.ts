import { BlogsRepository } from '../blogs.repository';
import { BlogInputModel } from '../../dto/input-models/blog.input.model';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsService } from '../blogs.service';
import { BlogEditDto } from '../../dto/blog-edit.dto';

export class EditBlogCommand {
  constructor(
    public userId: string,
    public blogId: string,
    public inputDate: BlogInputModel,
  ) {}
}

@CommandHandler(EditBlogCommand)
export class EditBlogUseCase implements ICommandHandler<EditBlogCommand> {
  constructor(
    private readonly blogRepository: BlogsRepository,
    private readonly blogsService: BlogsService,
  ) {}

  async execute(command: EditBlogCommand) {
    const { userId, blogId, inputDate } = command;
    const changes: BlogEditDto = {
      name: inputDate.name,
      websiteUrl: inputDate.websiteUrl,
      description: inputDate.description,
    };
    await this.blogsService.checkBlogOwner(blogId, userId);
    const editBlog = await this.blogRepository.getBlogModel(blogId);
    editBlog.blogUpdate(changes);
    return !!(await this.blogRepository.save(editBlog));
  }
}
