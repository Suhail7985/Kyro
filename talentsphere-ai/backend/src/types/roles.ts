export type UserRole = 'management_admin' | 'senior_manager' | 'hr_recruiter' | 'employee' | 'applicant';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  management_admin: ['*'],
  senior_manager: [
    'team:read',
    'performance:read',
    'performance:write',
    'leave:approve',
    'attendance:read',
    'analytics:team',
    'goals:write',
    'reports:team',
  ],
  hr_recruiter: [
    'jobs:*',
    'candidates:*',
    'resumes:*',
    'interviews:*',
    'recruitment:analytics',
    'reports:hiring',
  ],
  employee: [
    'attendance:self',
    'leave:self',
    'payroll:self',
    'performance:self',
    'onboarding:self',
    'profile:self',
    'documents:self',
    'career:self',
  ],
};

export function canAccess(role: UserRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (perms.includes('*')) return true;
  return perms.some(
    (p) => p === permission || (p.endsWith(':*') && permission.startsWith(p.replace(':*', '')))
  );
}
