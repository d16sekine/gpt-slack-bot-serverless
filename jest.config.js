/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // A preset that is used as a base for Jest's configuration
  preset: 'ts-jest',

  // The root directory that Jest should scan for tests and modules within
  rootDir: '__tests__',

  // A list of paths to directories that Jest should use to search for files in
  // roots: [
  //   "<rootDir>"
  // ],

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // Default 5000 ms
  testTimeout: 15000,

  // The paths to modules that run some code to configure or set up the testing environment before each test
  // setupFiles: ['dotenv/config'],
}
