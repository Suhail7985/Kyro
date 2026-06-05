const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Job = require('../models/Job');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');

const DEMO_RECRUITER_EMAIL = process.env.DEMO_RECRUITER_EMAIL || 'recruiter@hiring.com';
const DEMO_RECRUITER_PASSWORD = process.env.DEMO_RECRUITER_PASSWORD || 'Recruiter123!';
const DEMO_MANAGER_EMAIL = process.env.DEMO_MANAGER_EMAIL || 'manager@hiring.com';
const DEMO_MANAGER_PASSWORD = process.env.DEMO_MANAGER_PASSWORD || 'Manager123!';
const DEMO_EMPLOYEE_EMAIL = process.env.DEMO_EMPLOYEE_EMAIL || 'employee@hiring.com';
const DEMO_EMPLOYEE_PASSWORD = process.env.DEMO_EMPLOYEE_PASSWORD || 'Employee123!';

const SAMPLE_JOBS = [
  {
    title: 'Machine Learning Engineer',
    description:
      'Build and deploy ML models for our hiring intelligence platform. Work with Python, TensorFlow, and cloud infrastructure.',
    requiredSkills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL'],
    location: 'Remote',
    salary: '$120k – $160k',
  },
  {
    title: 'Full Stack Developer (React + Node)',
    description:
      'Develop features for our SaaS hiring platform using React, Node.js, Express, and MongoDB.',
    requiredSkills: ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript'],
    location: 'Hybrid – Bangalore',
    salary: '$90k – $130k',
  },
  {
    title: 'Data Scientist',
    description:
      'Analyze candidate pipelines, build scoring models, and create dashboards for recruiting teams.',
    requiredSkills: ['Python', 'Pandas', 'Scikit-learn', 'SQL', 'Statistics'],
    location: 'Remote',
    salary: '$110k – $150k',
  },
  {
    title: 'DevOps Engineer',
    description:
      'Maintain CI/CD pipelines, Heroku/Vercel deployments, and monitoring for production APIs.',
    requiredSkills: ['Docker', 'CI/CD', 'AWS', 'Linux', 'GitHub Actions'],
    location: 'On-site – Mumbai',
    salary: '$100k – $140k',
  },
];

async function upsertUser({ email, password, name, role, extra = {} }) {
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role,
      isEmailVerified: true,
      profile: { onboardingComplete: true, skills: extra.skills || [] },
      ...extra,
    });
    console.log(`Seeded user: ${email} (${role})`);
  }
  return user;
}

async function ensureDemoRecruiter() {
  return upsertUser({
    email: DEMO_RECRUITER_EMAIL,
    password: DEMO_RECRUITER_PASSWORD,
    name: 'HR Recruiter',
    role: 'hr_recruiter',
    extra: { department: 'Human Resources', designation: 'Senior Recruiter', employeeId: 'HR-001' },
  });
}

async function seedHrUsers() {
  const manager = await upsertUser({
    email: DEMO_MANAGER_EMAIL,
    password: DEMO_MANAGER_PASSWORD,
    name: 'Senior Manager',
    role: 'senior_manager',
    extra: { department: 'Operations', designation: 'Senior Manager', employeeId: 'MGR-001', salary: 150000 },
  });

  const employee = await upsertUser({
    email: DEMO_EMPLOYEE_EMAIL,
    password: DEMO_EMPLOYEE_PASSWORD,
    name: 'Demo Employee',
    role: 'employee',
    extra: {
      department: 'Engineering',
      designation: 'Software Engineer',
      employeeId: 'EMP-001',
      salary: 85000,
      managerId: manager._id,
      joinDate: new Date('2024-01-15'),
      profile: {
        onboardingComplete: true,
        skills: ['React', 'Node.js', 'JavaScript', 'MongoDB'],
      },
    },
  });

  return { manager, employee };
}

async function seedSampleJobs() {
  const count = await Job.countDocuments();
  if (count > 0) return;

  const recruiter = await ensureDemoRecruiter();
  await Job.insertMany(
    SAMPLE_JOBS.map((job) => ({
      ...job,
      status: 'open',
      createdBy: recruiter._id,
    }))
  );
  console.log(`Seeded ${SAMPLE_JOBS.length} sample jobs`);
}

async function seedPayrollAndAttendance() {
  const employees = await User.find({ role: 'employee', salary: { $gt: 0 } });
  const month = new Date().toISOString().slice(0, 7);

  for (const emp of employees) {
    const tax = Math.round(emp.salary * 0.1);
    const allowances = Math.round(emp.salary * 0.05);
    await Payroll.findOneAndUpdate(
      { userId: emp._id, month },
      {
        baseSalary: emp.salary,
        allowances,
        tax,
        deductions: 0,
        netPay: emp.salary + allowances - tax,
        status: 'paid',
      },
      { upsert: true }
    );

    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const checkIn = new Date(d);
      checkIn.setHours(9, i === 0 ? 25 : 5, 0, 0);
      await Attendance.findOneAndUpdate(
        { userId: emp._id, date: d },
        {
          checkIn,
          checkOut: new Date(checkIn.getTime() + 8 * 3600000),
          hoursWorked: 8,
          status: i === 0 ? 'late' : 'present',
        },
        { upsert: true }
      );
    }
  }
  if (employees.length) console.log('Seeded payroll & attendance for demo employees');
}

async function runAllSeeds() {
  // Fix any old roles to match updated enum
  await User.updateMany({ role: 'recruiter' }, { role: 'hr_recruiter' });

  await ensureDemoRecruiter();
  await seedHrUsers();
  await seedSampleJobs();
  await seedPayrollAndAttendance();
}

module.exports = { seedSampleJobs, ensureDemoRecruiter, runAllSeeds };
