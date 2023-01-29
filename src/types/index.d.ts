declare global {
  declare namespace Express {
    export interface User {
      userId: string;
      deviceId: string;
      iat: number;
      exp: number;
    }
  }
}
