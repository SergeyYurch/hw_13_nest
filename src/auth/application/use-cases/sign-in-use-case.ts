import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../users/users.repository';
import { Types } from 'mongoose';
import { AuthService } from '../auth.service';

export class SignInCommand {
  constructor(
    public loginOrEmail: string,
    public password: string,
    public ip = '0.0.0.0',
    public title = 'no data',
  ) {}
}

@CommandHandler(SignInCommand)
export class SignInUseCase implements ICommandHandler<SignInCommand> {
  constructor(
    private authService: AuthService,
    private userRepository: UsersRepository,
  ) {}

  async execute(command: SignInCommand) {
    const { title, password, loginOrEmail, ip } = command;
    const userModel = await this.authService.validateUser(
      loginOrEmail,
      password,
    );
    const deviceId = new Types.ObjectId().toString();
    const { accessToken, refreshToken, expiresDate, lastActiveDate } =
      await this.authService.getTokens(userModel._id.toString(), deviceId);
    await userModel.signIn(deviceId, ip, title, expiresDate, lastActiveDate);
    await this.userRepository.save(userModel);
    return { accessToken, refreshToken, expiresDate };
  }
}
