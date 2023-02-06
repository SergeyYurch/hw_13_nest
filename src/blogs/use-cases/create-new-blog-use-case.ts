import { BlogsRepository } from '../blogs.repository';
import { BlogsQueryRepository } from '../blogs.query.repository';
import { BlogInputModel } from '../dto/blogInputModel';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../users/users.query.repository';

export class CreateNewBlogCommand {
  constructor(public inputBlogDto: BlogInputModel, public userId: string) {}
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
    const login = (await this.usersQueryRepository.getUserById(userId)).login;
    const createdBlog = await this.blogRepository.createBlogModel();
    createdBlog.initial(inputBlogDto, userId, login);
    const newBlog = await this.blogRepository.save(createdBlog);
    return this.blogsQueryRepository.getBlogById(newBlog._id.toString());
  }
}
