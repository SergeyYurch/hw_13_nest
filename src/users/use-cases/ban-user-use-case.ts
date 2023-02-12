import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../users.repository';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BanUserInputModel } from '../dto/ban -user-input-model.dto';
import { BanCommentCommand } from '../../comments/use-cases/ban-comment-use-case';
import { BanCommentLikesCommand } from '../../comments/use-cases/ban-comment-likes-use-case';
import { BanPostLikesCommand } from '../../posts/use-cases/ban-post-likes-use-case';
import { BanPostsCommand } from '../../posts/use-cases/ban-posts-use-case';

export class BanUserCommand {
  constructor(
    public userId: string,
    public banUserInputModel: BanUserInputModel,
  ) {}
}

@Injectable()
@CommandHandler(BanUserCommand)
export class BanUserUseCase implements ICommandHandler<BanUserCommand> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private commandBus: CommandBus,
  ) {}
  async execute(command: BanUserCommand) {
    const { userId, banUserInputModel } = command;
    const { isBanned, banReason } = banUserInputModel;
    await this.commandBus.execute(new BanCommentCommand(userId, isBanned));
    await this.commandBus.execute(new BanCommentLikesCommand(userId, isBanned));
    await this.commandBus.execute(new BanPostsCommand(userId, isBanned));
    await this.commandBus.execute(new BanPostLikesCommand(userId, isBanned));
    const userModel = await this.usersRepository.getUserModel(userId);
    await userModel.ban(isBanned, banReason, 'saId');
    return await this.usersRepository.save(userModel);
  }
}
