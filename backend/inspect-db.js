require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Payroll = require('./src/models/Payroll');

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const emp = await User.findOne({ email: 'employee@hiring.com' });
    console.log('Employee:', emp.name, 'Salary:', emp.salary, 'Role:', emp.role);
    
    const payrolls = await Payroll.find({ userId: emp._id });
    console.log('Payrolls for employee:', payrolls.length);
    if(payrolls.length > 0) {
      console.log('Sample payroll month:', payrolls[0].month);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
inspect();
