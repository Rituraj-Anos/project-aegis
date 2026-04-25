import 'jest-extended';

// Silence logger during tests
jest.mock('./src/utils/logger', () => ({
  logger: {
    info:  jest.fn(),
    warn:  jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Silence console during tests unless DEBUG_TESTS=true
if (!process.env['DEBUG_TESTS']) {
  global.console = {
    ...console,
    log:   jest.fn() as any,
    info:  jest.fn() as any,
    warn:  jest.fn() as any,
    error: jest.fn() as any,
  };
}
