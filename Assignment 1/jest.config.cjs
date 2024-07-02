module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  globals: {
    "process.env.MONGO_URI": process.env.MONGO_URI,
  },
  testTimeout: 30000,
};
