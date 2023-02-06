import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './application/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/domain/user.schema';
import { LocalStrategy } from './strategies/local.strategy';
import { MailService } from '../common/mail.service/mail.service';
import { BasicStrategy } from './strategies/auth-basic.strategy';
import { ThrottlerModule } from '@nestjs/throttler';
import { CommandBus, CqrsModule } from '@nestjs/cqrs';
import { UsersModule } from '../users/users.module';
import { CreateNewUserUseCase } from '../users/use-cases/create-new-user-use-case';

@Module({
  imports: [
    CqrsModule,
    ThrottlerModule.forRoot({
      ttl: 10,
      limit: 5,
    }),
    UsersModule,
    ConfigModule,
    PassportModule,
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    MailService,
    ConfigService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    LocalStrategy,
    BasicStrategy,
    CommandBus,
  ],
})
export class AuthModule {}
