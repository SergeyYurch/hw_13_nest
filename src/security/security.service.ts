import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../users/domain/user.schema';
import { Model } from 'mongoose';
import { UsersRepository } from '../users/users.repository';
import { UNAUTHORIZED_MESSAGE } from '../auth/auth.constant';

@Injectable()
export class SecurityService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    private userRepository: UsersRepository,
  ) {}
  async getAllSessionByUserId(userId: string) {
    const user = await this.UserModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }
    return user.getSessions();
  }

  async deleteAllSessionExcludeCurrent(deviceId: string, userId: string) {
    const user = await this.UserModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }
    user.deleteSessionsExclude(deviceId);
    await this.userRepository.save(user);
  }

  async deleteSessionById(deviceId: string, userId: string) {
    const user = await this.UserModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }
    user.deleteSession(deviceId);
    await this.userRepository.save(user);
  }

  async validateOwner(userId: string, deviceId: string) {
    const user = await this.UserModel.findById(userId);
    const result = user.deviceSessions.find((d) => d.deviceId === deviceId);
    if (!result) {
      throw new ForbiddenException('Forbidden');
    }
  }
}
