import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UNAUTHORIZED_MESSAGE } from '../constants/auth.constant';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { UsersRepository } from '../../users/providers/users.repository';
import { JwtPayloadType } from '../types/jwt-payload.type';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../../users/domain/user.schema';
import { UsersService } from '../../users/providers/users.service';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    private userRepository: UsersRepository,
    private usersService: UsersService,
    private readonly jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(loginOrEmail: string, password: string) {
    const user = await this.userRepository.findUserByLoginOrEmail(loginOrEmail);
    let passwordSalt: string;
    let passwordHash: string;
    if (user) {
      passwordSalt = user.accountData.passwordSalt;
      passwordHash = await this.usersService.getPasswordHash(
        password,
        passwordSalt,
      );
    }
    if (
      !user ||
      user.banInfo.isBanned ||
      !(await user.validateCredentials(passwordHash))
    ) {
      throw new UnauthorizedException([
        { message: UNAUTHORIZED_MESSAGE, field: 'loginOrEmail' },
      ]);
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

  async validateUsersDeviceSession(jwtPayload: JwtPayloadType) {
    const user = await this.userRepository.getUserModel(jwtPayload.userId);
    if (!user) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }
    const deviceIdIsValid = await user.validateDeviceSession(
      jwtPayload.deviceId,
      jwtPayload.iat * 1000,
    );
    if (!deviceIdIsValid) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }
  }

  getCookiesWithToken(res: Response, refreshToken: string, expiresDate) {
    res.cookie('refreshToken', refreshToken, {
      expires: new Date(expiresDate),
      // secure: true,
      httpOnly: true,
    });
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
    const jwtPayload = (await this.jwtService.decode(
      refreshToken,
    )) as JwtPayloadType;

    return {
      accessToken,
      refreshToken,
      expiresDate: jwtPayload.exp * 1000,
      lastActiveDate: jwtPayload.iat * 1000,
    };
  }
}
