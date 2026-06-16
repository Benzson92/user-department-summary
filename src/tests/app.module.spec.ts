// --- Test framework ---
import { describe, expect, it } from 'vitest';

// --- Framework ---
import { Test } from '@nestjs/testing';

// --- Subjects under test ---
import { AppModule } from '@/app.module';
import { UsersService } from '@/modules/users/users.service';

/**
 * This boots the FULL module graph offline (no HTTP calls happen at startup).
 * If the typed-config injection in `users.module.ts` were wired wrong — wrong
 * token, missing namespace — `compile()` would fail here. So this test proves
 * the config/env plumbing actually resolves end to end.
 */
describe('AppModule wiring', () => {
  it('boots and resolves UsersService with a config-driven HTTP client', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef.get(UsersService)).toBeInstanceOf(UsersService);

    await moduleRef.close();
  });
});