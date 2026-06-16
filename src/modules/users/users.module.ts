// --- Framework ---
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';

// --- Config ---
import { usersConfig } from '@/config/users.config';

// --- Feature ---
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    /**
     * Configure the HTTP client from the typed 'users' namespace. `forFeature`
     * guarantees the namespace provider is available here; `inject` hands its
     * KEY token to the factory; `config` is then FULLY TYPED — no magic string,
     * no inline default, no cast. Compare with the old:
     *   baseURL: cfg.get<string>('USERS_API_BASE_URL', 'https://dummyjson.com')
     */
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
