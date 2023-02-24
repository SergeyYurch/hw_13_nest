import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadType } from '../types/jwt-payload.type';
import { AuthService } from '../providers/auth.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        RefreshTokenStrategy.extractJWT,
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  private static extractJWT(req: Request): string | null {
    if (req.cookies && 'refreshToken' in req.cookies) {
      return req.cookies['refreshToken'];
    }
    return null;
  }

  async validate(payload: any) {
    const jwtPayload: JwtPayloadType = <JwtPayloadType>(
      this.jwtService.decode(payload.cookies['refreshToken'])
    );
    await this.authService.validateUsersDeviceSession(jwtPayload);
    return {
      userId: jwtPayload.userId,
      deviceId: jwtPayload.deviceId,
      iat: jwtPayload.iat,
      exp: jwtPayload.exp,
    };
  }
}
