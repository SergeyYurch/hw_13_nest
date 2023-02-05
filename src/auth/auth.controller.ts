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
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { AccessTokenGuard } from '../api/guards/access-token.guard';
import { RefreshTokenGuard } from '../api/guards/refresh-token.guard';
import { UserInputModel } from '../users/dto/userInputModel';
import { RegistrationConfirmationCodeInputModel } from './dto/registrationConfirmationCodeInputModel';
import { RegistrationEmailResendingInputModel } from './dto/registrationEmailResendingInputModel';
import { PasswordRecoveryInputModel } from './dto/passwordRecoveryInputModel';
import { NewPasswordRecoveryInputModel } from './dto/newPasswordRecoveryInputModel';
import { QueryRepository } from '../query/query.repository';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private queryRepository: QueryRepository,
  ) {}

  @SkipThrottle()
  @UseGuards(AccessTokenGuard)
  @Get('me')
  async getAuthInfo(@Req() req: Request) {
    const { userId } = req.user;
    const result = await this.queryRepository.getMeInfo(userId);
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
    @Req() req: Request,
  ) {
    const { userId, deviceId } = req.user as {
      userId: string;
      deviceId: string;
    };
    const { accessToken, refreshToken, expiresDate } =
      await this.authService.refreshTokens(userId, deviceId);
    this.getCookiesWithToken(res, refreshToken, expiresDate);
    return res.status(200).json({ accessToken: accessToken });
  }

  @HttpCode(204)
  @Post('/registration')
  async registration(@Body() userDto: UserInputModel) {
    await this.authService.registration(userDto);
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
      secure: true,
      httpOnly: true,
    });
  }
}
