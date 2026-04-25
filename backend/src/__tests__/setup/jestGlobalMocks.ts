// ═══════════════════════════════════════════════════════════════
// IMPORTANT: jest.mock() calls are HOISTED to the top of the file
// by ts-jest/babel. Any variables referenced in factory functions
// must be defined INSIDE the factory — not above the jest.mock call.
// ═══════════════════════════════════════════════════════════════

// Mock node-cron so alert jobs don't auto-start
jest.mock('node-cron', () => ({
  schedule: jest.fn().mockReturnValue({ start: jest.fn(), stop: jest.fn() }),
}));

// Mock sharp (heavy native dep)
jest.mock('sharp', () => {
  const instance = {
    rotate:   jest.fn().mockReturnThis(),
    resize:   jest.fn().mockReturnThis(),
    jpeg:     jest.fn().mockReturnThis(),
    png:      jest.fn().mockReturnThis(),
    webp:     jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-image')),
    metadata: jest.fn().mockResolvedValue({ width: 800, height: 600, format: 'jpeg' }),
  };
  return jest.fn().mockReturnValue(instance);
});

// Mock tesseract.js
jest.mock('tesseract.js', () => ({
  recognize: jest.fn().mockResolvedValue({
    data: { text: 'TEST MERCHANT\n$25.99\n03/15/2024', confidence: 85 },
  }),
}));

// Mock ioredis — factory must be self-contained (hoisting)
jest.mock('ioredis', () => {
  const mock = {
    get:         jest.fn().mockResolvedValue(null),
    set:         jest.fn().mockResolvedValue('OK'),
    del:         jest.fn().mockResolvedValue(1),
    call:        jest.fn().mockResolvedValue(null),
    scan:        jest.fn().mockResolvedValue(['0', []]),
    sendCommand: jest.fn().mockResolvedValue(null),
    on:          jest.fn().mockReturnThis(),
    quit:        jest.fn().mockResolvedValue('OK'),
    connect:     jest.fn().mockResolvedValue(undefined),
    status:      'ready',
  };
  return jest.fn().mockImplementation(() => mock);
});

// Mock rate-limit-redis store
jest.mock('rate-limit-redis', () => ({
  RedisStore: jest.fn().mockImplementation(() => ({
    init:      jest.fn(),
    increment: jest.fn().mockResolvedValue({ totalHits: 1, resetTime: new Date() }),
    decrement: jest.fn().mockResolvedValue(undefined),
    resetKey:  jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock rateLimiter middleware — pass-through
jest.mock('../../middleware/rateLimiter', () => ({
  globalLimiter: jest.fn((_req: any, _res: any, next: any) => next()),
  authLimiter:   jest.fn((_req: any, _res: any, next: any) => next()),
  coachLimiter:  jest.fn((_req: any, _res: any, next: any) => next()),
  reportLimiter: jest.fn((_req: any, _res: any, next: any) => next()),
  uploadLimiter: jest.fn((_req: any, _res: any, next: any) => next()),
}));

// Mock redis config module — factory must be self-contained (hoisting)
jest.mock('../../config/redis', () => {
  const redisMock = {
    get:         jest.fn().mockResolvedValue(null),
    set:         jest.fn().mockResolvedValue('OK'),
    del:         jest.fn().mockResolvedValue(1),
    call:        jest.fn().mockResolvedValue(null),
    scan:        jest.fn().mockResolvedValue(['0', []]),
    sendCommand: jest.fn().mockResolvedValue(null),
    on:          jest.fn().mockReturnThis(),
    quit:        jest.fn().mockResolvedValue('OK'),
    connect:     jest.fn().mockResolvedValue(undefined),
    status:      'ready',
  };
  return {
    __esModule: true,
    default:         redisMock,
    connectRedis:    jest.fn().mockResolvedValue(undefined),
    disconnectRedis: jest.fn().mockResolvedValue(undefined),
    cacheGet:        jest.fn().mockResolvedValue(null),
    cacheSet:        jest.fn().mockResolvedValue(undefined),
    cacheDel:        jest.fn().mockResolvedValue(undefined),
    withCache:       jest.fn((_key: any, _ttl: any, fetcher: any) => fetcher()),
  };
});

// Mock brute force middleware
jest.mock('../../middleware/bruteForce', () => ({
  bruteForceGuard: jest.fn((_req: any, _res: any, next: any) => next()),
}));
