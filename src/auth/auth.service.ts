import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { QueryRepository } from '../query/query.repository';
import { UNAUTHORIZED_MESSAGE } from './auth.constant';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { UsersRepository } from '../users/users.repository';
import { JwtPayloadType } from './types/jwt-payload.type';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../users/domain/user.schema';
import { UsersService } from '../users/users.service';
import { UserInputModel } from '../users/dto/userInputModel';
import { MailService } from '../infrastructure/mail.service/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    private queryRepository: QueryRepository,
    private userRepository: UsersRepository,
    private usersService: UsersService,
    private readonly jwtService: JwtService,
    private configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async validateUser(loginOrEmail: string, password: string) {
    const user = await this.findUserByLoginOrEmail(loginOrEmail);
    if (!user) return null;
    if (!(await user.validateCredentials(password))) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }
    return user;
  }
  async validateSigInStatus(userId) {
    const user = await this.UserModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }
    if (!user.sigIn) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }
  }

  async findUserByLoginOrEmail(loginOrEmail: string) {
    return await this.UserModel.findOne({
      $or: [
        { 'accountData.email': loginOrEmail },
        { 'accountData.login': loginOrEmail },
      ],
    }).exec();
  }

  async validateUsersDeviceSession(jwtPayload: JwtPayloadType) {
    const user = await this.UserModel.findById(jwtPayload.userId);
    if (!user) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }
    if (
      !user.validateDeviceSession(jwtPayload.deviceId, new Date(jwtPayload.iat))
    ) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }
  }

  async signIn(
    loginOrEmail: string,
    password: string,
    ip = '0.0.0.0',
    title = 'no data',
  ) {
    const user = await this.validateUser(loginOrEmail, password);
    if (!user) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }
    const deviceId = new Types.ObjectId().toString();
    const { accessToken, refreshToken, expiresDate } = await this.getTokens(
      user._id.toString(),
      deviceId,
    );
    const payload = this.jwtService.decode(refreshToken);
    const lastActiveDate = new Date(payload['iat'] * 1000);
    await user.signIn(
      password,
      deviceId,
      ip,
      title,
      expiresDate,
      lastActiveDate,
    );
    await this.userRepository.save(user);
    return { accessToken, refreshToken, expiresDate };
  }

  async getTokens(userId: string, deviceId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          userId,
          deviceId,
        },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
        },
      ),
      this.jwtService.signAsync(
        { userId, deviceId },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
        },
      ),
    ]);
    const expiresDate = new Date(
      this.jwtService.decode(refreshToken)['exp'] * 1000,
    );
    return {
      accessToken,
      refreshToken,
      expiresDate,
    };
  }

  async logout(userId: string, deviceId: string) {
    const user = await this.UserModel.findById(userId);
    user.logout(deviceId);
    await this.userRepository.save(user);
  }

  async refreshTokens(userId: string, deviceId: string) {
    const { accessToken, refreshToken, expiresDate } = await this.getTokens(
      userId,
      deviceId,
    );
    const user = await this.UserModel.findById(userId);
    user.refreshTokens(deviceId, expiresDate);
    await this.userRepository.save(user);
    return { accessToken, refreshToken, expiresDate };
  }

  async registration(userDto: UserInputModel) {
    const emailIsExist = await this.findUserByLoginOrEmail(userDto.email);
    const loginIsExist = await this.findUserByLoginOrEmail(userDto.login);
    if (emailIsExist || loginIsExist) {
      throw new BadRequestException('email or login is already busy');
    }
    return await this.usersService.createNewUser(userDto);
  }

  async registrationConfirmation(code: string) {
    const user = await this.UserModel.findOne({
      'emailConfirmation.confirmationCode': code,
    }).exec();
    if (!user) {
      throw new BadRequestException('Email confirmation code is wrong');
    }
    if (user.emailConfirmation.expirationDate < new Date()) {
      throw new BadRequestException('Email confirmation code is expired');
    }
    if (user.emailConfirmation.isConfirmed) {
      throw new BadRequestException('Email confirmation code is confirmed');
    }
    user.confirmEmail();
    await this.userRepository.save(user);
  }

  async registrationEmailResending(email: string) {
    const user = await this.findUserByLoginOrEmail(email);
    if (!user) {
      throw new BadRequestException('Email is wrong');
    }
    if (user.emailConfirmation.isConfirmed) {
      throw new BadRequestException('Email is wrong or confirmed');
    }
    user.generateNewEmailConfirmationCode();
    await this.userRepository.save(user);
  }

  async passwordRecovery(email: string) {
    const user = await this.findUserByLoginOrEmail(email);
    if (!user) {
      throw new BadRequestException('Email is wrong');
    }
    user.generateNewPasswordRecoveryCode();
    await this.userRepository.save(user);
    const resultSendEmail = this.mailService.sendPasswordRecoveryEmail(
      user.accountData.email,
      user.passwordRecoveryInformation.recoveryCode,
    );
    if (!resultSendEmail) console.log('email did not send');
    return resultSendEmail;
  }

  async setNewPassword(recoveryCode: string, newPassword: string) {
    const user = await this.UserModel.findOne({
      'passwordRecoveryInformation.recoveryCode': recoveryCode,
    }).exec();
    if (!user) {
      throw new BadRequestException('Password recovery code is wrong');
    }
    if (user.passwordRecoveryInformation.expirationDate < new Date()) {
      throw new BadRequestException('Password recovery code is expired');
    }
    if (user.passwordRecoveryInformation.recoveryCode !== recoveryCode) {
      throw new BadRequestException('Password recovery code is expired');
    }
    await user.setNewPassword(newPassword);
    await this.userRepository.save(user);
    return;
  }
}