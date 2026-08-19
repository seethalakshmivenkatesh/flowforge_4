const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('[MongoDB] MONGO_URI is not set. Copy backend/.env.example to backend/.env and fill it in.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error(`[MongoDB] Connection error: ${err.message}`);

    if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
      console.error(
        '\n[MongoDB] This is an Atlas authentication failure, not an app bug. Check:\n' +
          '  1. Database Access -> the username/password in MONGO_URI match an existing Atlas DB user\n' +
          '     (not your Atlas login email/password - a separate DB user).\n' +
          '  2. If the password contains special characters (@, #, %, etc.), URL-encode them\n' +
          '     e.g. "p@ss" -> "p%40ss".\n' +
          '  3. Network Access -> your current IP address is added to the IP Access List\n' +
          '     (or 0.0.0.0/0 for local development).\n'
      );
    }

    if (err.message.includes('ETIMEDOUT') || err.message.includes('ENOTFOUND') || err.message.includes('querySrv')) {
      console.error(
        '\n[MongoDB] Could not reach the Atlas cluster. Check that the cluster is running (not paused)\n' +
          'and that the connection string host in MONGO_URI is correct.\n'
      );
    }

    process.exit(1);
  }
};

module.exports = connectDB;

