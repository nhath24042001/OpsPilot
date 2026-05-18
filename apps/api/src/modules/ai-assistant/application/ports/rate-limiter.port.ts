export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

export interface RateLimiterPort {
  consume(input: {
    key: string;
    limit: number;
    windowSeconds: number;
  }): Promise<RateLimitResult>;
}
