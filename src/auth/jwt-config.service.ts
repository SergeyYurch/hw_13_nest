import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';

class JwtConfigService implements JwtOptionsFactory {
  createJwtOptions(): JwtModuleOptions {
    return {
      secret: 'hard!to-guess_secret',
    };
  }
}
