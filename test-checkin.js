require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const Attendance = require('./backend/src/models/Attendance');

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kyro');
  const user = { _id: new mongoose.Types.ObjectId() };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let record = await Attendance.findOne({ userId: user._id, date: today });
  console.log("Existing:", record);
  
  const now = new Date();
  
  record = await Attendance.create({
    userId: user._id,
    date: today,
    checkIn: now,
    status: 'present',
    aiFlag: 'normal',
    locationMethod: 'gps',
    locationVerified: true,
    checkInLocation: { lat: 40.7, lng: -74 }
  });
  console.log("Created:", record);
  
  process.exit(0);
}
test().catch(console.error);
