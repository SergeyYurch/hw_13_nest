import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../blogs.repository';
import { UsersQueryRepository } from '../../../users/providers/users.query.repository';

export class BindBlogWithUserCommand {
  constructor(public blogId: string, public userId: string) {}
}

@CommandHandler(BindBlogWithUserCommand)
export class BindBlogWithUserUseCase
  implements ICommandHandler<BindBlogWithUserCommand>
{
  constructor(
    private blogRepository: BlogsRepository,
    private userQueryRepository: UsersQueryRepository,
  ) {}

  async execute(command: BindBlogWithUserCommand) {
    const { userId, blogId } = command;
    const user = await this.userQueryRepository.getUserById(userId);
    const editBlog = await this.blogRepository.getBlogModel(blogId);
    editBlog.bindUser(userId, user.login);
    return !!(await this.blogRepository.save(editBlog));
  }
}
