import { BlogsRepository } from '../blogs.repository';
import { BlogsQueryRepository } from '../blogs.query.repository';
import { BlogInputModel } from '../../dto/input-models/blog.input.model';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../users/providers/users.query.repository';

export class CreateNewBlogCommand {
  constructor(public inputBlogDto: BlogInputModel, public userId?: string) {}
}

@CommandHandler(CreateNewBlogCommand)
export class CreateNewBlogUseCase
  implements ICommandHandler<CreateNewBlogCommand>
{
  constructor(
    private blogRepository: BlogsRepository,
    private blogsQueryRepository: BlogsQueryRepository,
    private usersQueryRepository: UsersQueryRepository,
  ) {}

  async execute(command: CreateNewBlogCommand) {
    const { inputBlogDto, userId } = command;
    let login: string;
    if (userId)
      login = (await this.usersQueryRepository.getUserById(userId)).login;
    const createdBlog = await this.blogRepository.createBlogModel();
    createdBlog.initial(inputBlogDto, userId, login);
    return await this.blogRepository.save(createdBlog);
  }
}