import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';

import { usersConfig } from '@/config/users.config';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule.forFeature(usersConfig)],
      inject: [usersConfig.KEY],
      useFactory: (config: ConfigType<typeof usersConfig>) => ({
        baseURL: config.apiBaseUrl,
        timeout: config.http.timeoutMs,
        maxRedirects: config.http.maxRedirects,
        maxContentLength: config.http.maxContentLength,
        maxBodyLength: config.http.maxBodyLength,
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
