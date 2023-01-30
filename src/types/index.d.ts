import { JwtPayloadType } from '../auth/types/jwt-payload.type';

declare global {
  declare namespace Express {
    export interface User {
      userId: string;
      deviceId: string;
      iat: number;
      exp: number;
    }
    export interface Request {
      jwtPayload: JwtPayloadType;
    }
  }
}
