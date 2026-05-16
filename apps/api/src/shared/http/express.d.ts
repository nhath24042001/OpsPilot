declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
      };
      orgContext?: {
        organizationId: string;
        memberId: string;
      };
    }
  }
}

export {};
