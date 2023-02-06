import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { MailService } from '../common/mail.service/mail.service';
import { IsUniqLoginOrEmailConstraint } from './common/login-or-emai-uniq-validate';
import { UsersQueryRepository } from './users.query.repository';
import { CreateNewUserUseCase } from './use-cases/create-new-user-use-case';
import { DeleteUserUseCase } from './use-cases/delete-user-use-case';
import { CqrsModule } from '@nestjs/cqrs';

const useCases = [CreateNewUserUseCase, DeleteUserUseCase];

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],

  controllers: [UsersController],

  providers: [
    ...useCases,
    UsersService,
    UsersRepository,
    UsersQueryRepository,
    MailService,
    IsUniqLoginOrEmailConstraint,
  ],
  exports: [
    UsersQueryRepository,
    UsersRepository,
    UsersService,
    CreateNewUserUseCase,
  ],
})
export class UsersModule {}
