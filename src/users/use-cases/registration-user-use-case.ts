import { Injectable } from '@nestjs/common';
import { UsersQueryRepository } from '../users.query.repository';
import { MailService } from '../../common/mail.service/mail.service';
import { UserInputModel } from '../dto/userInputModel';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateNewUserCommand } from './create-new-user-use-case';

export class RegistrationUserCommand {
  constructor(public userInputModel: UserInputModel) {}
}

@Injectable()
@CommandHandler(RegistrationUserCommand)
export class RegistrationUserUseCase
  implements ICommandHandler<RegistrationUserCommand>
{
  constructor(
    private commandBus: CommandBus,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly mailService: MailService,
  ) {}
  async execute(command: RegistrationUserCommand) {
    const { userInputModel } = command;
    const userId = await this.commandBus.execute(
      new CreateNewUserCommand(userInputModel),
    );

    if (!userId) return null;
    const { email, confirmationCode } =
      await this.usersQueryRepository.getEmailConfirmationData(userId);
    await this.mailService.sendConfirmationEmail(email, confirmationCode);
    return this.usersQueryRepository.getUserById(userId);
  }
}
