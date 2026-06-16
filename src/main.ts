// --- Polyfill (must be first) ---
import 'reflect-metadata';

// --- Framework ---
import { ValidationPipe } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

// --- Config ---
import { appConfig } from '@/config/app.config';

// --- App ---
import { AppModule } from './app.module';

/**
 * Bootstrap the kitchen: build the app, install the door policy (validation),
 * read the typed app config, and open the pass.
 */
const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Typed config access — no `process.env.PORT` reaching into the bootstrap.
  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  await app.listen(config.port);
};

void bootstrap();
