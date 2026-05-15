import { beforeEach, describe, expect, it, vi } from 'vitest';

const findActiveByEmail = vi.fn();

vi.mock('../src/modules/identity/infrastructure/prisma/prisma-user.repository.js', () => ({
  prismaUserRepository: {
    findActiveByEmail,
    findActiveById: vi.fn(),
    createPasswordUser: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns account not found for a missing email', async () => {
    findActiveByEmail.mockResolvedValue(null);

    const { authService } = await import('../src/modules/identity/application/auth.service.js');

    await expect(
      authService.login({
        email: 'missing@example.com',
        password: 'password',
      }),
    ).rejects.toMatchObject({
      code: 'AUTH_ACCOUNT_NOT_FOUND',
      statusCode: 404,
    });
  }, 15000);

  it('returns invalid password when the account exists but password is wrong', async () => {
    findActiveByEmail.mockResolvedValue({
      id: '17793c55-84e4-4a21-b7f5-41bbc51c0ac9',
      email: 'user@example.com',
      name: null,
      imageUrl: null,
      passwordHash:
        '$argon2id$v=19$m=65536,t=3,p=4$KmS7ZlsxRyTRDdV6o4uQng$gKLAFHhrdjwX03FrClZxGaXmKe0UMko0INuxy68mdOw',
      emailVerified: true,
      createdAt: new Date(),
      deletedAt: null,
    });

    const { authService } = await import('../src/modules/identity/application/auth.service.js');

    await expect(
      authService.login({
        email: 'user@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toMatchObject({
      code: 'AUTH_INVALID_PASSWORD',
      statusCode: 401,
    });
  });
});
