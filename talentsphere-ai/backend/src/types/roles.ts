export type UserRole = 'admin' | 'senior_manager' | 'hr_recruiter' | 'employee';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'],
  senior_manager: [
    'team:read',
    'performance:read',
    'performance:write',
    'leave:approve',
    'attendance:read',
    'analytics:team',
  ],
  hr_recruiter: [
    'jobs:*',
    'candidates:*',
    'resumes:*',
    'interviews:*',
    'recruitment:analytics',
  ],
  employee: [
    'attendance:self',
    'leave:self',
    'payroll:self',
    'performance:self',
    'onboarding:self',
  ],
};

export function canAccess(role: UserRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (perms.includes('*')) return true;
  return perms.some((p) => p === permission || p.endsWith(':*') && permission.startsWith(p.replace(':*', '')));
}
