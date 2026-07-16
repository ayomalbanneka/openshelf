// jest.config.cjs — stays CJS because Jest reads this before ESM is active
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
};
