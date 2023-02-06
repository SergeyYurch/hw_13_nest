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
import { LoginInputModel } from './dto/loginInputModel';
import { AuthService } from './application/auth.service';
import { Response, Request } from 'express';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { UserInputModel } from '../users/dto/userInputModel';
import { RegistrationConfirmationCodeInputModel } from './dto/registrationConfirmationCodeInputModel';
import { RegistrationEmailResendingInputModel } from './dto/registrationEmailResendingInputModel';
import { PasswordRecoveryInputModel } from './dto/passwordRecoveryInputModel';
import { NewPasswordRecoveryInputModel } from './dto/newPasswordRecoveryInputModel';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUserJwtInfo } from '../common/decorators/current-user.param.decorator';
import { JwtPayloadType } from './types/jwt-payload.type';
import { CommandBus } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../users/users.query.repository';
import { CreateNewUserCommand } from '../users/use-cases/create-new-user-use-case';

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
    const { accessToken, refreshToken, expiresDate } =
      await this.authService.signIn(
        loginDto.loginOrEmail,
        loginDto.password,
        ip,
        title,
      );

    this.getCookiesWithToken(res, refreshToken, expiresDate);
    return res.json({ accessToken: accessToken });
  }

  @SkipThrottle()
  @UseGuards(RefreshTokenGuard)
  @HttpCode(200)
  @Post('/logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const { userId, deviceId } = req.user;
    await this.authService.logout(userId, deviceId);
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
      await this.authService.refreshTokens(userId, deviceId);
    this.getCookiesWithToken(res, refreshToken, expiresDate);
    return res.status(200).json({ accessToken: accessToken });
  }

  @HttpCode(204)
  @Post('/registration')
  async registration(@Body() userInputDto: UserInputModel) {
    await this.commandBus.execute(new CreateNewUserCommand(userInputDto));
  }

  @HttpCode(204)
  @Post('/registration-confirmation')
  async registrationConfirmation(
    @Body() codeDto: RegistrationConfirmationCodeInputModel,
  ) {
    await this.authService.registrationConfirmation(codeDto.code);
  }

  @HttpCode(204)
  @Post('/registration-email-resending')
  async registrationEmailResending(
    @Body() emailResendingDto: RegistrationEmailResendingInputModel,
  ) {
    await this.authService.registrationEmailResending(emailResendingDto.email);
  }

  @HttpCode(204)
  @Post('/password-recovery')
  async passwordRecovery(
    @Body() passwordRecoveryDto: PasswordRecoveryInputModel,
  ) {
    await this.authService.passwordRecovery(passwordRecoveryDto.email);
  }

  @HttpCode(204)
  @Post('/new-password')
  async newPassword(@Body() newPasswordDto: NewPasswordRecoveryInputModel) {
    await this.authService.setNewPassword(
      newPasswordDto.recoveryCode,
      newPasswordDto.newPassword,
    );
  }

  getCookiesWithToken(res: Response, refreshToken: string, expiresDate) {
    res.cookie('refreshToken', refreshToken, {
      expires: new Date(expiresDate),
      // secure: true,
      httpOnly: true,
    });
  }
}
