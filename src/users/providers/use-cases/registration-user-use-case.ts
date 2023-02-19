import { Injectable } from '@nestjs/common';
import { UsersQueryRepository } from '../users.query.repository';
import { MailService } from '../../../common/mail.service/mail.service';
import { UserInputModel } from '../../dto/input-models/user-input-model';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateNewUserCommand } from './create-new-user-use-case';
import { UserCreatDto } from '../../dto/user-creat.dto';
import { UsersService } from '../users.service';
import { UsersRepository } from '../users.repository';

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
    private readonly usersRepository: UsersRepository,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}
  async execute(command: RegistrationUserCommand) {
    const { userInputModel } = command;
    const { login, email, password } = userInputModel;
    const passwordSalt = await this.usersService.getPasswordSalt();
    const passwordHash = await this.usersService.getPasswordHash(
      password,
      passwordSalt,
    );
    const user: UserCreatDto = {
      login,
      email,
      passwordSalt,
      passwordHash,
      isConfirmed: false,
    };
    const userModel = await this.usersRepository.createUserModel();
    await userModel.initialize(user);
    const userId = await this.usersRepository.save(userModel);

    if (!userId) return null;
    const { confirmationCode } =
      await this.usersQueryRepository.getEmailConfirmationData(userId);
    await this.mailService.sendConfirmationEmail(email, confirmationCode);
    return this.usersQueryRepository.getUserById(userId);
  }
}
