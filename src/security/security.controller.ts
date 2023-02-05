import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { SecurityService } from './security.service';
import { RefreshTokenGuard } from '../api/guards/refresh-token.guard';
import { Request } from 'express';

@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @UseGuards(RefreshTokenGuard)
  @Get('devices')
  getDeviceSessions(@Req() req: Request) {
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
    @Req() req: Request,
  ) {
    const { userId } = req.user;
    await this.securityService.validateOwner(userId, deviceId);
    await this.securityService.deleteSessionById(deviceId, userId);
  }
}
