import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../users.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BanUserInputModel } from '../dto/ban -user-input-model.dto';

export class BanUserCommand {
  constructor(
    public userId: string,
    public banUserInputModel: BanUserInputModel,
  ) {}
}

@Injectable()
@CommandHandler(BanUserCommand)
export class BanUserUseCase implements ICommandHandler<BanUserCommand> {
  constructor(private readonly usersRepository: UsersRepository) {}
  async execute(command: BanUserCommand) {
    const { userId, banUserInputModel } = command;
    const { isBanned, banReason } = banUserInputModel;
    const userModel = await this.usersRepository.getUserModel(userId);
    await userModel.ban(isBanned, banReason, 'saId');
    return await this.usersRepository.save(userModel);
  }
}
