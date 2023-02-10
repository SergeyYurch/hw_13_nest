import { AuthService } from '../auth.service';
import { UsersRepository } from '../../../users/users.repository';

export class RefreshTokenCommand {
  constructor(public userId: string, public deviceId: string) {}
}

export class RefreshTokenUseCases {
  constructor(
    private authService: AuthService,
    private usersRepository: UsersRepository,
  ) {}

  async execute(command: RefreshTokenCommand) {
    const { userId, deviceId } = command;
    const { accessToken, refreshToken, expiresDate, lastActiveDate } =
      await this.authService.getTokens(userId, deviceId);
    const userModel = await this.usersRepository.getUserModel(userId);
    userModel.refreshTokens(deviceId, expiresDate, lastActiveDate);
    await this.usersRepository.save(userModel);
    return { accessToken, refreshToken, expiresDate };
  }
}
