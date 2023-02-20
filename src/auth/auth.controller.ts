import {
  Body,
  Controller,
  Ip,
  Post,
  Headers,
  Res,
  Get,
  UseGuards,
  Req,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginInputModel } from './dto/login.input.model';
import { AuthService } from './providers/auth.service';
import { Response, Request } from 'express';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { UserInputModel } from '../users/dto/input-models/user-input-model';
import { RegistrationConfirmationCodeInputModel } from './dto/registration-confirmation-code.input.model';
import { RegistrationEmailResendingInputModel } from './dto/registration-email-resending.input.model';
import { PasswordRecoveryInputModel } from './dto/password-recovery.input.model';
import { NewPasswordRecoveryInputModel } from './dto/new-password-recovery.input.model';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUserJwtInfo } from '../common/decorators/current-user.param.decorator';
import { JwtPayloadType } from './types/jwt-payload.type';
import { CommandBus } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../users/providers/users.query.repository';
import { SignInCommand } from './providers/use-cases/sign-in-use-case';
import { LogoutCommand } from './providers/use-cases/logout-use-case';
import { RefreshTokenCommand } from './providers/use-cases/refresh-token-use-cases';
import { RegistrationUserCommand } from '../users/providers/use-cases/registration-user-use-case';
import { RegistrationConfirmationCommand } from './providers/use-cases/registration-confirmation-use-case';
import { RegistrationEmailResendingCommand } from './providers/use-cases/registration-email-resending-use-case';
import { PasswordRecoveryCommand } from './providers/use-cases/password-recovery-use-case';
import { SetNewPasswordCommand } from './providers/use-cases/set-new-password-use-case';

@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersQueryRepository: UsersQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @SkipThrottle()
  @UseGuards(AccessTokenGuard)
  @Get('me')
  async getAuthInfo(@CurrentUserJwtInfo() { userId }: JwtPayloadType) {
    const result = await this.usersQueryRepository.getMeInfo(userId);
    if (!result) {
      throw new UnauthorizedException();
    }
    return result;
  }

  // @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  @Post('/login')
  async signIn(
    @Body() loginDto: LoginInputModel,
    @Ip() ip: string,
    @Headers('X-Forwarded-For') title: string,
    @Res() res: Response,
  ) {
    console.log(
      `POST:auth/login - login:${loginDto.loginOrEmail}, pass:${loginDto.password}, ip:${ip}, title: ${title} `,
    );
    const { accessToken, refreshToken, expiresDate } =
      await this.commandBus.execute(
        new SignInCommand(loginDto.loginOrEmail, loginDto.password, ip, title),
      );
    console.log(
      `POST:auth/login - user:${loginDto.loginOrEmail}: accessToken: ${accessToken}, refreshToken: ${refreshToken}`,
    );
    this.authService.getCookiesWithToken(res, refreshToken, expiresDate);
    return res.json({ accessToken: accessToken });
  }

  @SkipThrottle()
  @UseGuards(RefreshTokenGuard)
  @HttpCode(200)
  @Post('/logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const { userId, deviceId } = req.user;
    await this.commandBus.execute(new LogoutCommand(userId, deviceId));
    res.clearCookie('refreshToken');
    return res.sendStatus(204);
  }

  @SkipThrottle()
  @UseGuards(RefreshTokenGuard)
  @Post('/refresh-token')
  async refreshTokens(
    @Ip() ip: string,
    @Headers('X-Forwarded-For') title: string,
    @Res() res: Response,
    @CurrentUserJwtInfo() { userId, deviceId }: JwtPayloadType,
  ) {
    const { accessToken, refreshToken, expiresDate } =
      await this.commandBus.execute(new RefreshTokenCommand(userId, deviceId));

    this.authService.getCookiesWithToken(res, refreshToken, expiresDate);
    return res.status(200).json({ accessToken: accessToken });
  }

  @HttpCode(204)
  @Post('/registration')
  async registration(@Body() userInputDto: UserInputModel) {
    await this.commandBus.execute(new RegistrationUserCommand(userInputDto));
  }

  @HttpCode(204)
  @Post('/registration-confirmation')
  async registrationConfirmation(
    @Body() codeDto: RegistrationConfirmationCodeInputModel,
  ) {
    await this.commandBus.execute(
      new RegistrationConfirmationCommand(codeDto.code),
    );
  }

  @HttpCode(204)
  @Post('/registration-email-resending')
  async registrationEmailResending(
    @Body() emailResendingDto: RegistrationEmailResendingInputModel,
  ) {
    await this.commandBus.execute(
      new RegistrationEmailResendingCommand(emailResendingDto.email),
    );
  }

  @HttpCode(204)
  @Post('/password-recovery')
  async passwordRecovery(
    @Body() passwordRecoveryDto: PasswordRecoveryInputModel,
  ) {
    await this.commandBus.execute(
      new PasswordRecoveryCommand(passwordRecoveryDto.email),
    );
  }

  @HttpCode(204)
  @Post('/new-password')
  async newPassword(@Body() newPasswordDto: NewPasswordRecoveryInputModel) {
    await this.commandBus.execute(
      new SetNewPasswordCommand(
        newPasswordDto.recoveryCode,
        newPasswordDto.newPassword,
      ),
    );
  }
}
