import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { appConfig } from '@/config/app.config';
import { usersConfig } from '@/config/users.config';
import { validateEnv } from '@/config/env.validation';

import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ConfigService + namespaces injectable everywhere
      load: [appConfig, usersConfig], // register the typed namespaces
      validate: validateEnv, // fail fast on a malformed environment
      envFilePath: ['.env'], // load local .env if present
      cache: true, // memoise process.env reads
    }),
    UsersModule,
  ],
})
export class AppModule {}
