import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { SecurityService } from './providers/security.service';
import { RefreshTokenGuard } from '../auth/guards/refresh-token.guard';
import { Request } from 'express';
import { CurrentUserJwtInfo } from '../common/decorators/current-user.param.decorator';
import { JwtPayloadType } from '../auth/types/jwt-payload.type';

@UseGuards(RefreshTokenGuard)
@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('devices')
  getDeviceSessions(@Req() req: Request) {
    console.log('get:/devices');
    const userId = req.user.userId;
    return this.securityService.getAllSessionByUserId(userId);
  }

  @HttpCode(204)
  @Delete('devices')
  async deleteOtherDeviceSessions(@Req() req: Request) {
    const { deviceId, userId } = req.user;
    return await this.securityService.deleteAllSessionExcludeCurrent(
      deviceId,
      userId,
    );
  }

  @HttpCode(204)
  @Delete('devices/:deviceId')
  async deleteDeviceSession(
    @Param('deviceId') deviceId: string,
    @CurrentUserJwtInfo() userInfo: JwtPayloadType,
  ) {
    const { userId } = userInfo;
    await this.securityService.deleteSessionById(deviceId, userId);
  }
}
