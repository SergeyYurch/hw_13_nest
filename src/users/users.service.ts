import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersRepository } from './users.repository';
import { User, UserDocument } from './domain/user.schema';
import { UserInputModel } from './dto/userInputModel';
import { QueryRepository } from '../query/query.repository';
import { UserViewModel } from '../query/viewModels/userViewModel';
import { MailService } from '../infrastructure/mail.service/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    private readonly userRepository: UsersRepository,
    private readonly queryRepository: QueryRepository,
    private readonly mailService: MailService,
  ) {}

  async createNewUser(
    userDto: UserInputModel,
    isConfirmed?: boolean,
  ): Promise<UserViewModel | null> {
    const createdUser = new this.UserModel();
    await createdUser.initialize(userDto, isConfirmed);
    const user = await this.userRepository.save(createdUser);
    if (!user) return null;
    if (!isConfirmed) {
      const resultSendEmail = await this.mailService.sendConfirmationEmail(
        user.accountData.email,
        user.emailConfirmation.confirmationCode,
      );
      if (!resultSendEmail) console.log('email did not send');
    }
    console.log(`${new Date()}user ${userDto.login} is register`);
    return this.queryRepository.getUserViewModel(user);
  }

  async deleteUser(userId: string): Promise<boolean> {
    const result = await this.UserModel.deleteOne({
      _id: new Types.ObjectId(userId),
    });
    return result.deletedCount === 1;
  }
}
