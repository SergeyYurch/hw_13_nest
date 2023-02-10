import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../users/users.repository';
import { BadRequestException } from '@nestjs/common';
import { PASSWORD_RECOVERY_CODE_MESSAGE } from '../../auth.constant';

export class SetNewPasswordCommand {
  constructor(public recoveryCode: string, public newPassword: string) {}
}

@CommandHandler(SetNewPasswordCommand)
export class SetNewPasswordUseCase
  implements ICommandHandler<SetNewPasswordCommand>
{
  constructor(private userRepository: UsersRepository) {}

  async execute(command: SetNewPasswordCommand) {
    const { recoveryCode, newPassword } = command;
    const userModel = await this.userRepository.findUserByPasswordRecoveryCode(
      recoveryCode,
    );
    if (!userModel) {
      throw new BadRequestException([
        { message: PASSWORD_RECOVERY_CODE_MESSAGE, field: 'recoveryCode' },
      ]);
    }
    if (userModel.passwordRecoveryInformation.expirationDate < new Date()) {
      throw new BadRequestException([
        { message: PASSWORD_RECOVERY_CODE_MESSAGE, field: 'recoveryCode' },
      ]);
    }
    if (userModel.passwordRecoveryInformation.recoveryCode !== recoveryCode) {
      throw new BadRequestException([
        { message: PASSWORD_RECOVERY_CODE_MESSAGE, field: 'recoveryCode' },
      ]);
    }
    await userModel.setNewPassword(newPassword);
    return !!(await this.userRepository.save(userModel));
  }
}
