export const ROLES = {
  MANAGEMENT_ADMIN: 'admin',
  SENIOR_MANAGER: 'senior_manager',
  HR_RECRUITER: 'hr_recruiter',
  EMPLOYEE: 'employee',
};

export const ROLE_LABELS = {
  [ROLES.MANAGEMENT_ADMIN]: 'Management Admin',
  [ROLES.SENIOR_MANAGER]: 'Senior Manager',
  [ROLES.HR_RECRUITER]: 'HR Recruiter',
  [ROLES.EMPLOYEE]: 'Employee',
};

export function dashboardPath(role) {
  switch (role) {
    case ROLES.MANAGEMENT_ADMIN:
      return '/dashboard/admin';
    case ROLES.SENIOR_MANAGER:
      return '/dashboard/manager';
    case ROLES.HR_RECRUITER:
      return '/dashboard/recruiter';
    default:
      return '/dashboard/employee';
  }
}

export function isEmployee(role) {
  return role === ROLES.EMPLOYEE;
}

export const SIDEBAR_LINKS = {
  [ROLES.MANAGEMENT_ADMIN]: [
    { label: 'Overview', to: '/dashboard/admin' },
    { label: 'Employees', to: '/dashboard/admin#employees' },
    { label: 'Departments', to: '/dashboard/admin#departments' },
    { label: 'Analytics', to: '/dashboard/admin#analytics' },
    { label: 'Payroll', to: '/dashboard/admin#payroll' },
    { label: 'Reports', to: '/dashboard/admin#reports' },
    { label: 'AI Insights', to: '/dashboard/admin#ai-insights' },
    { label: 'Settings', to: '/dashboard/admin#settings' },
  ],
  [ROLES.SENIOR_MANAGER]: [
    { label: 'Overview', to: '/dashboard/manager' },
    { label: 'Team Members', to: '/dashboard/manager#team' },
    { label: 'Attendance', to: '/dashboard/manager#attendance' },
    { label: 'Leave Requests', to: '/dashboard/manager#leaves' },
    { label: 'Performance Reviews', to: '/dashboard/manager#performance' },
    { label: 'Goals', to: '/dashboard/manager#goals' },
    { label: 'Reports', to: '/dashboard/manager#reports' },
    { label: 'Team Analytics', to: '/dashboard/manager#analytics' },
  ],
  [ROLES.HR_RECRUITER]: [
    { label: 'Overview', to: '/dashboard/recruiter' },
    { label: 'Jobs', to: '/dashboard/recruiter#jobs' },
    { label: 'Candidates', to: '/dashboard/recruiter#candidates' },
    { label: 'Resume Screening', to: '/dashboard/recruiter#screening' },
    { label: 'Candidate Ranking', to: '/dashboard/recruiter#ranking' },
    { label: 'Interviews', to: '/dashboard/recruiter#interviews' },
    { label: 'Hiring Reports', to: '/dashboard/recruiter#reports' },
    { label: 'AI Recruitment Assistant', to: '/dashboard/recruiter#ai' },
  ],
  [ROLES.EMPLOYEE]: [
    { label: 'Overview', to: '/dashboard/employee' },
    { label: 'Attendance', to: '/dashboard/employee#attendance' },
    { label: 'Leave', to: '/dashboard/employee#leave' },
    { label: 'Payroll', to: '/dashboard/employee#payroll' },
    { label: 'Performance', to: '/dashboard/employee#performance' },
    { label: 'Profile', to: '/dashboard/employee#profile' },
    { label: 'Documents', to: '/dashboard/employee#documents' },
    { label: 'Career Assistant', to: '/dashboard/employee#career' },
  ],
};
