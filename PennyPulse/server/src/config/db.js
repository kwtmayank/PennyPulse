const mongoose = require('mongoose');
const env = require('./env');

let connectionPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (connectionPromise) {
    return connectionPromise;
  }
  mongoose.set('strictQuery', true);
  connectionPromise = mongoose.connect(env.mongodbUri);
  await connectionPromise;
  return mongoose.connection;
}

module.exports = { connectDB };
