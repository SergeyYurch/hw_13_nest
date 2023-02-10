import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../users/users.repository';
import { MailService } from '../../../common/mail.service/mail.service';
import { BadRequestException } from '@nestjs/common';
import { PASSWORD_RECOVERY_MESSAGE } from '../../auth.constant';
export class PasswordRecoveryCommand {
  constructor(public email: string) {}
}
@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase
  implements ICommandHandler<PasswordRecoveryCommand>
{
  constructor(
    private userRepository: UsersRepository,
    private readonly mailService: MailService,
  ) {}

  async execute(command: PasswordRecoveryCommand) {
    const { email } = command;
    const userModel = await this.userRepository.findUserByLoginOrEmail(email);
    if (!userModel) {
      throw new BadRequestException([
        { message: PASSWORD_RECOVERY_MESSAGE, field: 'email' },
      ]);
    }
    const recoveryCode = userModel.generateNewPasswordRecoveryCode();
    await this.userRepository.save(userModel);
    const resultSendEmail = await this.mailService.sendPasswordRecoveryEmail(
      email,
      recoveryCode,
    );
    if (!resultSendEmail) console.log('email did not send');
    return resultSendEmail;
  }
}
