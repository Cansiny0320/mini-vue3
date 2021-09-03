module.exports = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: {
        target: 'esnext',
        sourceMap: true,
      },
    },
  },
  coverageReporters: ['html', 'lcov', 'text'],

  watchPathIgnorePatterns: ['/node_modules/', '/dist/', '/.git/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  rootDir: __dirname,
  testMatch: ['<rootDir>/packages/**/__tests__/**/*spec.[jt]s?(x)'],
  testPathIgnorePatterns: process.env.SKIP_E2E
    ? // ignore example tests on netlify builds since they don't contribute
      // to coverage and can cause netlify builds to fail
      ['/node_modules/', '/examples/__tests__']
    : ['/node_modules/'],
}
