import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { QueryModule } from '../query/query.module';
import { MailService } from '../infrastructure/mail.service/mail.service';
import { IsUniqLoginOrEmailConstraint } from './common/login-or-emai-uniq-validate';

@Module({
  imports: [
    QueryModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],

  controllers: [UsersController],

  providers: [
    UsersService,
    UsersRepository,
    MailService,
    IsUniqLoginOrEmailConstraint,
  ],
})
export class UsersModule {}
