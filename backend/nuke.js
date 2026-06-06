require('dotenv').config();
const mongoose = require('mongoose');

async function nuke() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const db = mongoose.connection.db;
    const result = await db.collection('attendances').deleteMany({});
    
    console.log(`NUKED ${result.deletedCount} attendance records from the entire database.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
nuke();
