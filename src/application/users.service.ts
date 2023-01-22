import { PostViewModel } from '../infrastructure/viewModels/postViewModel';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersRepository } from '../infrastructure/repositories/users.repository';
import { User, UserDocument } from '../domain/schemas/user.schema';
import { UserInputModel } from './inputModels/userInputModel';
import {
  generateHashSalt,
  generatePassHash,
  getConfirmationCode,
  getConfirmationEmailExpirationDate,
} from '../infrastructure/helpers/helpers';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    private userRepository: UsersRepository,
  ) {}

  async createNewUser(
    userDto: UserInputModel,
    isConfirmed?: boolean,
  ): Promise<PostViewModel | null> {
    const { password, email, login } = userDto;
    const passwordSalt = await generateHashSalt();
    const passwordHash = await generatePassHash(password, passwordSalt);
    const createdUser = new this.UserModel();
    createdUser.accountData = {
      login,
      email,
      passwordSalt,
      passwordHash,
      createdAt: new Date(),
    };

    createdUser.emailConfirmation = {
      confirmationCode: getConfirmationCode(),
      expirationDate: getConfirmationEmailExpirationDate(),
      isConfirmed: !!isConfirmed,
      dateSendingConfirmEmail: [new Date()],
    };
    const result = await this.userRepository.save(createdUser);
    if (!result) return null;
    return result.getViewModel();
  }

  async deleteUser(userId: string): Promise<boolean> {
    const result = await this.UserModel.deleteOne({
      _id: new Types.ObjectId(userId),
    });
    return result.deletedCount === 1;
  }
}
