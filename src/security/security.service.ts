import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../users/domain/user.schema';
import { Model } from 'mongoose';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class SecurityService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    private userRepository: UsersRepository,
  ) {}
  async getAllSessionByUserId(userId: string) {
    const user = await this.UserModel.findById(userId);
    return user.getSessions();
  }

  async deleteAllSessionExcludeCurrent(deviceId: string, userId: string) {
    const user = await this.validateOwner(userId, deviceId);
    user.deleteSessionsExclude(deviceId);
    await this.userRepository.save(user);
  }

  async deleteSessionById(deviceId: string, userId: string) {
    const user = await this.validateOwner(userId, deviceId);
    user.deleteSession(deviceId);
    await this.userRepository.save(user);
  }

  async validateOwner(userId: string, deviceId: string) {
    const user = await this.UserModel.findOne({
      'deviceSessions.deviceId': deviceId,
    });
    if (!user) {
      throw new NotFoundException('Invalid deviceId');
    }
    if (user._id.toString() !== userId) {
      throw new ForbiddenException('Forbidden');
    }
    return user;
  }
}
