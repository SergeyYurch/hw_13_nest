import { BlogsRepository } from '../blogs.repository';
import { BlogInputModel } from '../dto/blogInputModel';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class EditBlogCommand {
  constructor(public blogId: string, public changes: BlogInputModel) {}
}

@CommandHandler(EditBlogCommand)
export class EditBlogUseCase implements ICommandHandler<EditBlogCommand> {
  constructor(private blogRepository: BlogsRepository) {}

  async execute(command: EditBlogCommand) {
    const { blogId, changes } = command;
    const editBlog = await this.blogRepository.getBlogModel(blogId);
    editBlog.blogUpdate(changes);
    return !!(await this.blogRepository.save(editBlog));
  }
}
