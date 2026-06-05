import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/database';
import {
  User,
  Employee,
  Department,
  Designation,
  Job,
  Candidate,
  Application,
  Attendance,
  LeaveBalance,
  Payroll,
  Onboarding,
} from '../models';
import { env } from '../config/env';
import { analyzeResume } from '../ai/resumeAnalyzer';

const SKILLS_POOL = ['React', 'Node.js', 'Python', 'TypeScript', 'MongoDB', 'AWS', 'Docker', 'ML', 'SQL'];

async function seed() {
  await connectDatabase();
  console.log('Clearing database...');
  await Promise.all([
    User.deleteMany({}),
    Employee.deleteMany({}),
    Department.deleteMany({}),
    Designation.deleteMany({}),
    Job.deleteMany({}),
    Candidate.deleteMany({}),
    Application.deleteMany({}),
    Attendance.deleteMany({}),
    LeaveBalance.deleteMany({}),
    Payroll.deleteMany({}),
    Onboarding.deleteMany({}),
  ]);

  const hash = async (p: string) => bcrypt.hash(p, 10);

  const departments = await Department.insertMany([
    { name: 'Engineering', code: 'ENG', employeeCount: 0 },
    { name: 'Human Resources', code: 'HR', employeeCount: 0 },
    { name: 'Sales', code: 'SALES', employeeCount: 0 },
    { name: 'Operations', code: 'OPS', employeeCount: 0 },
    { name: 'Finance', code: 'FIN', employeeCount: 0 },
  ]);

  const designations = await Designation.insertMany(
    departments.flatMap((d) => [
      { title: `${d.name} Associate`, level: 1, departmentId: d._id },
      { title: `${d.name} Lead`, level: 3, departmentId: d._id },
    ])
  );

  const admin = await User.create({
    name: 'System Admin',
    email: env.ADMIN_EMAIL,
    passwordHash: await hash(env.ADMIN_PASSWORD),
    role: 'management_admin',
  });

  const managers = [];
  for (let i = 1; i <= 5; i++) {
    managers.push(
      await User.create({
        name: `Senior Manager ${i}`,
        email: `manager${i}@talentsphere.ai`,
        passwordHash: await hash('Manager@123'),
        role: 'senior_manager',
      })
    );
  }

  const recruiters = [];
  for (let i = 1; i <= 10; i++) {
    recruiters.push(
      await User.create({
        name: `HR Recruiter ${i}`,
        email: `recruiter${i}@talentsphere.ai`,
        passwordHash: await hash('Recruiter@123'),
        role: 'hr_recruiter',
      })
    );
  }

  const employees = [];
  for (let i = 1; i <= 100; i++) {
    const u = await User.create({
      name: `Employee ${i}`,
      email: `employee${i}@talentsphere.ai`,
      passwordHash: await hash('Employee@123'),
      role: 'employee',
    });
    const dept = departments[i % departments.length];
    const des = designations.find((d) => d.departmentId?.equals(dept._id))!;
    const emp = await Employee.create({
      userId: u._id,
      employeeId: `EMP-${String(i).padStart(4, '0')}`,
      departmentId: dept._id,
      designationId: des._id,
      managerId: managers[i % managers.length]._id,
      joinDate: new Date(2023, i % 12, 1),
      salary: 60000 + (i % 40) * 1000,
      skills: SKILLS_POOL.slice(0, 3 + (i % 4)),
      lifecycleStage: 'active',
      onboardingComplete: true,
    });
    await LeaveBalance.create({ employeeId: emp._id, userId: u._id });
    await Onboarding.create({
      employeeId: emp._id,
      userId: u._id,
      offerAccepted: true,
      documentsSubmitted: true,
      profileCompleted: true,
      progress: 100,
      status: 'completed',
      tasks: [{ title: 'Complete', completed: true }],
    });
    employees.push(emp);
  }

  for (const d of departments) {
    const count = await Employee.countDocuments({ departmentId: d._id });
    d.employeeCount = count;
    await d.save();
  }

  const candidates = [];
  for (let i = 1; i <= 50; i++) {
    candidates.push(
      await Candidate.create({
        name: `Candidate ${i}`,
        email: `candidate${i}@mail.com`,
        skills: SKILLS_POOL.slice(0, 4),
        experienceYears: 2 + (i % 8),
        education: 'B.Tech Computer Science',
        certifications: ['AWS Certified'],
        projects: ['E-commerce platform', 'HR Analytics dashboard'],
      })
    );
  }

  const jobs = [];
  for (let i = 1; i <= 25; i++) {
    jobs.push(
      await Job.create({
        title: `Open Role ${i}`,
        description: `We are hiring for position ${i}. Build scalable HR tech with modern stack.`,
        requiredSkills: SKILLS_POOL.slice(i % 5, (i % 5) + 4),
        experienceLevel: ['junior', 'mid', 'senior', 'lead'][i % 4] as 'junior',
        location: 'Remote',
        salaryMin: 80000,
        salaryMax: 150000,
        status: 'open',
        createdBy: recruiters[i % recruiters.length]._id,
        departmentId: departments[i % departments.length]._id,
      })
    );
  }

  const pairs: { job: any; candidate: any }[] = [];
  for (const job of jobs) {
    for (const candidate of candidates) {
      pairs.push({ job, candidate });
    }
  }

  // Shuffle or slice 200 items from unique pairs
  const selectedPairs = pairs.slice(0, 200);

  let appCount = 0;
  for (let i = 0; i < selectedPairs.length; i++) {
    const { job, candidate } = selectedPairs[i];
    const resumeText = `${candidate.name}\nSkills: ${candidate.skills.join(', ')}\n${candidate.education}\nProjects: ${candidate.projects.join('; ')}`;
    const analysis = await analyzeResume(resumeText, job.description, job.requiredSkills);
    await Application.create({
      jobId: job._id,
      candidateId: candidate._id,
      resumeText,
      analysis,
      aiScore: analysis.matchPercentage,
      rank: 0,
      status: ['applied', 'screening', 'shortlisted', 'interview'][i % 4] as 'applied',
    });
    appCount++;
  }

  for (const job of jobs) {
    const apps = await Application.find({ jobId: job._id }).sort({ aiScore: -1 });
    for (let r = 0; r < apps.length; r++) {
      apps[r].rank = r + 1;
      await apps[r].save();
    }
    job.applicantCount = apps.length;
    await job.save();
  }

  const month = new Date().toISOString().slice(0, 7);
  for (const emp of employees.slice(0, 50)) {
    await Payroll.create({
      employeeId: emp._id,
      userId: emp.userId,
      month,
      baseSalary: emp.salary,
      bonus: 2000,
      allowances: Math.round(emp.salary * 0.05),
      tax: Math.round(emp.salary * 0.1),
      deductions: 0,
      netPay: emp.salary + 2000 + Math.round(emp.salary * 0.05) - Math.round(emp.salary * 0.1),
      status: 'paid',
    });
    for (let d = 0; d < 5; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);
      await Attendance.create({
        employeeId: emp._id,
        userId: emp.userId,
        date,
        checkIn: new Date(date.getTime() + 9 * 3600000),
        checkOut: new Date(date.getTime() + 17 * 3600000),
        hoursWorked: 8,
        status: d === 0 ? 'late' : 'present',
        isLate: d === 0,
      });
    }
  }

  console.log('Seed complete:', {
    admin: admin.email,
    managers: managers.length,
    recruiters: recruiters.length,
    employees: employees.length,
    candidates: candidates.length,
    jobs: jobs.length,
    applications: appCount,
  });
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
