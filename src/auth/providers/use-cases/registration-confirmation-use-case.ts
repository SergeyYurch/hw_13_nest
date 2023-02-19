import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../users/providers/users.repository';
import { BadRequestException } from '@nestjs/common';
import { EMAIL_CONFIRMATION_MESSAGE } from '../../constants/auth.constant';
export class RegistrationConfirmationCommand {
  constructor(public code: string) {}
}
@CommandHandler(RegistrationConfirmationCommand)
export class RegistrationConfirmationUseCase
  implements ICommandHandler<RegistrationConfirmationCommand>
{
  constructor(private userRepository: UsersRepository) {}

  async execute(command: RegistrationConfirmationCommand) {
    const { code } = command;
    const userModel = await this.userRepository.findUserByEmailConfirmationCode(
      code,
    );
    if (!userModel) {
      throw new BadRequestException([
        { message: EMAIL_CONFIRMATION_MESSAGE, field: 'code' },
      ]);
    }
    if (userModel.emailConfirmation.expirationDate < new Date()) {
      throw new BadRequestException([
        { message: EMAIL_CONFIRMATION_MESSAGE, field: 'code' },
      ]);
    }
    if (userModel.emailConfirmation.isConfirmed) {
      throw new BadRequestException([
        { message: EMAIL_CONFIRMATION_MESSAGE, field: 'code' },
      ]);
    }
    userModel.confirmEmail();
    return !!(await this.userRepository.save(userModel));
  }
}
