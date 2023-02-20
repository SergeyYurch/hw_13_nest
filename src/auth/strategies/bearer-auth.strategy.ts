import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadType } from '../types/jwt-payload.type';

@Injectable()
export class BearerAuthStrategy extends PassportStrategy(Strategy, 'bearer') {
  constructor(private jwtService: JwtService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        BearerAuthStrategy.extractJWT,
      ]),
      secretOrKey: process.env.JWT_ACCESS_SECRET,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  private static extractJWT(req: Request): string | null {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      console.log(`[BearerAuthStrategy]/extractJWT: ${token}`);
      return token;
    }
    console.log('[ BearerAuthStrategy]: accessToken not found');
    return null;
  }

  async validate(payload: any) {
    const token = payload.headers.authorization.split(' ')[1];
    console.log(token);
    const jwtPayload: JwtPayloadType = <JwtPayloadType>(
      this.jwtService.decode(token)
    );
    return {
      userId: jwtPayload.userId,
      deviceId: jwtPayload.deviceId,
      iat: jwtPayload.iat,
      exp: jwtPayload.exp,
    };
  }
}
