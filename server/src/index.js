const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');

async function bootstrap() {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`PennyPulse server listening on port ${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
