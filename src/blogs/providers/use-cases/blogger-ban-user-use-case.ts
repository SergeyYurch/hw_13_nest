import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../blogs.repository';
import { UsersQueryRepository } from '../../../users/providers/users.query.repository';
import { BanUserForBlogDto } from '../../dto/ban-user-for-blog.dto';
import { BanBlogCommentByCommentatorIdCommand } from '../../../comments/providers/use-cases/ban-blog--comments-by-user-id--use-case';

export class BloggerBanUserCommand {
  constructor(public banInfo: BanUserForBlogDto) {}
}

@CommandHandler(BloggerBanUserCommand)
export class BloggerBanUserUseCase
  implements ICommandHandler<BloggerBanUserCommand>
{
  constructor(
    private blogRepository: BlogsRepository,
    private userQueryRepository: UsersQueryRepository,
    private commandBus: CommandBus,
  ) {}

  async execute(command: BloggerBanUserCommand) {
    const { userId, blogId, banReason, isBanned } = command.banInfo;
    const { login } = await this.userQueryRepository.getUserById(userId);
    await this.commandBus.execute(
      new BanBlogCommentByCommentatorIdCommand(userId, blogId, isBanned),
    );
    const editBlog = await this.blogRepository.getBlogModel(blogId);
    editBlog.banUser(userId, login, banReason, isBanned);
    return !!(await this.blogRepository.save(editBlog));
  }
}
