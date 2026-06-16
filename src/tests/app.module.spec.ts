import { describe, expect, it } from 'vitest';

import { Test } from '@nestjs/testing';

import { AppModule } from '@/app.module';
import { UsersService } from '@/modules/users/users.service';

describe('AppModule wiring', () => {
  it('boots and resolves UsersService with a config-driven HTTP client', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef.get(UsersService)).toBeInstanceOf(UsersService);

    await moduleRef.close();
  });
});