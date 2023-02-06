import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../domain/user.schema';
import { Model } from 'mongoose';
import { UsersRepository } from '../users.repository';
import { UsersQueryRepository } from '../users.query.repository';
import { MailService } from '../../common/mail.service/mail.service';
import { UserInputModel } from '../dto/userInputModel';
import { UserViewModel } from '../view-models/userViewModel';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreateNewUserCommand {
  constructor(public userDto: UserInputModel, public isConfirmed?: boolean) {}
}

@CommandHandler(CreateNewUserCommand)
export class CreateNewUserUseCase
  implements ICommandHandler<CreateNewUserCommand>
{
  constructor(
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    private readonly userRepository: UsersRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly mailService: MailService,
  ) {}
  async execute(command: CreateNewUserCommand): Promise<UserViewModel | null> {
    const createdUser = new this.UserModel();
    await createdUser.initialize(command.userDto, command.isConfirmed);
    const user = await this.userRepository.save(createdUser);
    if (!user) return null;
    if (!command.isConfirmed) {
      await this.mailService.sendConfirmationEmail(
        user.accountData.email,
        user.emailConfirmation.confirmationCode,
      );
    }
    return this.usersQueryRepository.getUserViewModel(user);
  }
}
