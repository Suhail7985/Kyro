/** Role helpers – supports exact enterprise HRMS roles and legacy mapping for compatibility */

const ROLES = {
  MANAGEMENT_ADMIN: 'admin',
  SENIOR_MANAGER: 'senior_manager',
  HR_RECRUITER: 'hr_recruiter',
  EMPLOYEE: 'employee',
};

const LEGACY_MAP = {
  candidate: ROLES.EMPLOYEE,
  recruiter: ROLES.HR_RECRUITER,
};

const ROLE_PERMISSIONS = {
  [ROLES.MANAGEMENT_ADMIN]: [
    'full_access',
    'create_managers',
    'create_recruiters',
    'create_employees',
    'edit_users',
    'delete_users',
    'manage_departments',
    'manage_payroll',
    'view_company_analytics',
    'view_recruitment_analytics',
    'view_attendance_analytics',
    'view_performance_analytics',
    'access_ai_insights',
    'generate_reports',
    'view_all_employees',
    'view_all_attendance',
    'view_all_leave',
    'view_all_payroll',
  ],
  [ROLES.SENIOR_MANAGER]: [
    'view_team_members',
    'view_team_attendance',
    'approve_leave',
    'reject_leave',
    'conduct_performance_reviews',
    'assign_goals',
    'generate_team_reports',
    'use_ai_performance_review',
    'view_team_analytics',
  ],
  [ROLES.HR_RECRUITER]: [
    'create_jobs',
    'edit_jobs',
    'delete_jobs',
    'view_candidates',
    'screen_resumes',
    'use_ai_resume_screening',
    'use_candidate_ranking',
    'generate_interview_questions',
    'schedule_interviews',
    'shortlist_candidates',
    'reject_candidates',
    'generate_hiring_reports',
  ],
  [ROLES.EMPLOYEE]: [
    'clock_in',
    'clock_out',
    'apply_leave',
    'view_attendance',
    'view_payroll',
    'download_payslips',
    'view_performance',
    'update_profile',
    'upload_documents',
    'use_career_assistant',
  ],
};

const HR_ROLES = Object.values(ROLES);
const MANAGEMENT = [ROLES.MANAGEMENT_ADMIN, ROLES.SENIOR_MANAGER];
const HR_STAFF = [ROLES.MANAGEMENT_ADMIN, ROLES.SENIOR_MANAGER, ROLES.HR_RECRUITER];

function normalizeRole(role) {
  return LEGACY_MAP[role] || role;
}

function userHasRole(user, allowedRoles) {
  const role = normalizeRole(user?.role);
  const expanded = allowedRoles.flatMap((r) => {
    if (r === ROLES.EMPLOYEE) return [ROLES.EMPLOYEE, 'candidate'];
    if (r === ROLES.HR_RECRUITER) return [ROLES.HR_RECRUITER, 'recruiter'];
    return [r];
  });
  return expanded.includes(role);
}

function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[normalizeRole(role)] || [];
}

function userHasPermission(user, permission) {
  if (!user) return false;
  const role = normalizeRole(user.role);
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission) || permissions.includes('full_access');
}

module.exports = {
  ROLES,
  ROLE_PERMISSIONS,
  normalizeRole,
  userHasRole,
  userHasPermission,
  HR_ROLES,
  MANAGEMENT,
  HR_STAFF,
  LEGACY_MAP,
};
