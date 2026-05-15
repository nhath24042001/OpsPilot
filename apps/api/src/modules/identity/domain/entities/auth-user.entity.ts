export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  passwordHash: string | null;
  emailVerified: boolean;
  createdAt: Date;
  deletedAt: Date | null;
};

export const toPublicUser = (user: AuthUser) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  imageUrl: user.imageUrl,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt,
});
