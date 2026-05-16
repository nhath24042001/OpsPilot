export interface EmailPort {
  sendVerificationEmail(input: {
    to: string;
    name?: string | null;
    token: string;
  }): Promise<void>;

  sendPasswordResetEmail(input: {
    to: string;
    name?: string | null;
    token: string;
  }): Promise<void>;
}
