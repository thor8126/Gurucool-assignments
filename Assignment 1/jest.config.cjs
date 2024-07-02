module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  setupFilesAfterEnv: ["./jest.setup.js"], // Ensure the correct relative path
  globals: {
    "process.env.MONGO_URI": process.env.MONGO_URI,
  },
  testTimeout: 30000, // Optional: increase timeout if necessary for slower tests
};
