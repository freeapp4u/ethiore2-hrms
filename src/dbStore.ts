import { 
  User, Department, Employee, AttendanceRecord, LeaveRecord, 
  PublicHoliday, CompanyConfig, ActivityLog, FamilyMember, MedicalExpense,
  SalaryComponent, TaxConfiguration, PayrollPeriod, EmployeeSalaryStructure,
  PayrollRecord, Payslip, PayslipDistributionLog, PayrollApproval, PayrollImportLog, PayrollSettings,
  EmailActivityLog, SystemRole, RolePermissions
} from "./types";
import { 
  DEFAULT_USERS, DEFAULT_DEPARTMENTS, DEFAULT_EMPLOYEES, 
  DEFAULT_HOLIDAYS, DEFAULT_ATTENDANCE, DEFAULT_LEAVES, 
  DEFAULT_COMPANY_CONFIG, DEFAULT_ACTIVITY_LOGS, DEFAULT_FAMILY_MEMBERS, DEFAULT_MEDICAL_EXPENSES,
  DEFAULT_SALARY_COMPONENTS, DEFAULT_PAYROLL_PERIODS, DEFAULT_EMPLOYEE_SALARY_STRUCTURES,
  DEFAULT_PAYROLL_RECORDS, DEFAULT_PAYROLL_APPROVALS, DEFAULT_PAYSLIPS,
  DEFAULT_PAYSLIP_DISTRIBUTION_LOGS, DEFAULT_PAYROLL_IMPORT_LOGS, DEFAULT_PAYROLL_SETTINGS,
  DEFAULT_EMAIL_LOGS
} from "./initialData";
import { DEFAULT_TAX_CONFIG } from "./utils/payrollUtils";

const STORAGE_KEYS = {
  USERS: "ethiore_users",
  DEPARTMENTS: "ethiore_departments",
  EMPLOYEES: "ethiore_employees",
  HOLIDAYS: "ethiore_holidays",
  ATTENDANCE: "ethiore_attendance",
  LEAVES: "ethiore_leaves",
  FAMILY_MEMBERS: "ethiore_family_members",
  MEDICAL_EXPENSES: "ethiore_medical_expenses",
  CONFIG: "ethiore_company_config",
  LOGS: "ethiore_activity_logs",
  CURRENT_USER: "ethiore_current_user",
  EMAIL_LOGS: "ethiore_email_logs",
  // PAYROLL STORAGE KEYS
  SALARY_COMPONENTS: "ethiore_salary_components",
  TAX_CONFIG: "ethiore_tax_config",
  PAYROLL_PERIODS: "ethiore_payroll_periods",
  SALARY_STRUCTURES: "ethiore_employee_salary_structures",
  PAYROLL_RECORDS: "ethiore_payroll_records",
  PAYSLIPS: "ethiore_payslips",
  PAYSLIP_DISTRIBUTION_LOGS: "ethiore_payslip_distribution_logs",
  PAYROLL_APPROVALS: "ethiore_payroll_approvals",
  PAYROLL_IMPORT_LOGS: "ethiore_payroll_import_logs",
  PAYROLL_SETTINGS: "ethiore_payroll_settings",
  ROLES: "ethiore_roles",
  ROLE_PERMISSIONS: "ethiore_role_permissions"
};

export interface AppState {
  users: User[];
  departments: Department[];
  employees: Employee[];
  holidays: PublicHoliday[];
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  familyMembers: FamilyMember[];
  medicalExpenses: MedicalExpense[];
  config: CompanyConfig;
  logs: ActivityLog[];
  currentUser: User | null;
  emailLogs: EmailActivityLog[];
  // Payroll State
  salaryComponents: SalaryComponent[];
  taxConfig: TaxConfiguration;
  payrollPeriods: PayrollPeriod[];
  salaryStructures: EmployeeSalaryStructure[];
  payrollRecords: PayrollRecord[];
  payslips: Payslip[];
  payslipDistributionLogs: PayslipDistributionLog[];
  payrollApprovals: PayrollApproval[];
  payrollImportLogs: PayrollImportLog[];
  payrollSettings: PayrollSettings;
  roles: SystemRole[];
  rolePermissions: RolePermissions[];
}

export function loadState(): AppState {
  const getOrSeed = <T>(key: string, defaultVal: T): T => {
    const val = localStorage.getItem(key);
    if (val === null) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    try {
      return JSON.parse(val) as T;
    } catch {
      return defaultVal;
    }
  };

  const demoEmpIds = new Set(["EMP001", "EMP002", "EMP003", "EMP004"]);
  const demoAttIds = new Set(["ATT001", "ATT002", "ATT003", "ATT004", "ATT005", "ATT006", "ATT007"]);
  const demoLeaveIds = new Set(["L001"]);
  const demoFamIds = new Set(["FAM001", "FAM002", "FAM003"]);
  const demoMedIds = new Set(["MED001", "MED002", "MED003"]);
  const demoLogIds = new Set(["LOG001", "LOG002"]);
  const demoUserEmails = new Set(["admin@ethio-re.com", "hr@ethio-re.com"]);

  const rawUsers = getOrSeed<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
  const rawEmployees = getOrSeed<Employee[]>(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
  const rawAttendance = getOrSeed<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
  const rawLeaves = getOrSeed<LeaveRecord[]>(STORAGE_KEYS.LEAVES, DEFAULT_LEAVES);
  const rawFamilyMembers = getOrSeed<FamilyMember[]>(STORAGE_KEYS.FAMILY_MEMBERS, DEFAULT_FAMILY_MEMBERS);
  const rawMedicalExpenses = getOrSeed<MedicalExpense[]>(STORAGE_KEYS.MEDICAL_EXPENSES, DEFAULT_MEDICAL_EXPENSES);
  const rawLogs = getOrSeed<ActivityLog[]>(STORAGE_KEYS.LOGS, DEFAULT_ACTIVITY_LOGS);
  let rawCurrentUser = getOrSeed<User | null>(STORAGE_KEYS.CURRENT_USER, null);

  const cleanUsers = rawUsers.filter(u => !demoUserEmails.has(u.email.toLowerCase()));
  const cleanEmployees = rawEmployees.filter(e => !demoEmpIds.has(e.employeeId));
  const cleanAttendance = rawAttendance.filter(a => !demoAttIds.has(a.id) && !demoEmpIds.has(a.employeeId));
  const cleanLeaves = rawLeaves.filter(l => !demoLeaveIds.has(l.id) && !demoEmpIds.has(l.employeeId));
  const cleanFamilyMembers = rawFamilyMembers.filter(f => !demoFamIds.has(f.id) && !demoEmpIds.has(f.employeeId));
  const cleanMedicalExpenses = rawMedicalExpenses.filter(m => !demoMedIds.has(m.id) && !demoEmpIds.has(m.employeeId));
  const cleanLogs = rawLogs.filter(l => !demoLogIds.has(l.id));

  if (rawCurrentUser && demoUserEmails.has(rawCurrentUser.email.toLowerCase())) {
    rawCurrentUser = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  // Persist sanitized state back
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cleanUsers));
  localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(cleanEmployees));
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(cleanAttendance));
  localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(cleanLeaves));
  localStorage.setItem(STORAGE_KEYS.FAMILY_MEMBERS, JSON.stringify(cleanFamilyMembers));
  localStorage.setItem(STORAGE_KEYS.MEDICAL_EXPENSES, JSON.stringify(cleanMedicalExpenses));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(cleanLogs));

  return {
    users: cleanUsers.length > 0 ? cleanUsers : DEFAULT_USERS,
    departments: getOrSeed<Department[]>(STORAGE_KEYS.DEPARTMENTS, DEFAULT_DEPARTMENTS),
    employees: cleanEmployees,
    holidays: getOrSeed<PublicHoliday[]>(STORAGE_KEYS.HOLIDAYS, DEFAULT_HOLIDAYS),
    attendance: cleanAttendance,
    leaves: cleanLeaves,
    familyMembers: cleanFamilyMembers,
    medicalExpenses: cleanMedicalExpenses,
    config: getOrSeed<CompanyConfig>(STORAGE_KEYS.CONFIG, DEFAULT_COMPANY_CONFIG),
    logs: cleanLogs,
    currentUser: rawCurrentUser,
    emailLogs: getOrSeed<EmailActivityLog[]>(STORAGE_KEYS.EMAIL_LOGS, DEFAULT_EMAIL_LOGS),
    // Payroll State Load
    salaryComponents: getOrSeed<SalaryComponent[]>(STORAGE_KEYS.SALARY_COMPONENTS, DEFAULT_SALARY_COMPONENTS),
    taxConfig: getOrSeed<TaxConfiguration>(STORAGE_KEYS.TAX_CONFIG, DEFAULT_TAX_CONFIG),
    payrollPeriods: getOrSeed<PayrollPeriod[]>(STORAGE_KEYS.PAYROLL_PERIODS, DEFAULT_PAYROLL_PERIODS),
    salaryStructures: getOrSeed<EmployeeSalaryStructure[]>(STORAGE_KEYS.SALARY_STRUCTURES, DEFAULT_EMPLOYEE_SALARY_STRUCTURES),
    payrollRecords: getOrSeed<PayrollRecord[]>(STORAGE_KEYS.PAYROLL_RECORDS, DEFAULT_PAYROLL_RECORDS),
    payslips: getOrSeed<Payslip[]>(STORAGE_KEYS.PAYSLIPS, DEFAULT_PAYSLIPS),
    payslipDistributionLogs: getOrSeed<PayslipDistributionLog[]>(STORAGE_KEYS.PAYSLIP_DISTRIBUTION_LOGS, DEFAULT_PAYSLIP_DISTRIBUTION_LOGS),
    payrollApprovals: getOrSeed<PayrollApproval[]>(STORAGE_KEYS.PAYROLL_APPROVALS, DEFAULT_PAYROLL_APPROVALS),
    payrollImportLogs: getOrSeed<PayrollImportLog[]>(STORAGE_KEYS.PAYROLL_IMPORT_LOGS, DEFAULT_PAYROLL_IMPORT_LOGS),
    payrollSettings: getOrSeed<PayrollSettings>(STORAGE_KEYS.PAYROLL_SETTINGS, DEFAULT_PAYROLL_SETTINGS),
    roles: getOrSeed<SystemRole[]>(STORAGE_KEYS.ROLES, []),
    rolePermissions: getOrSeed<RolePermissions[]>(STORAGE_KEYS.ROLE_PERMISSIONS, [])
  };
}

export function saveState(state: Partial<AppState>) {
  if (state.users !== undefined) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(state.users));
  if (state.departments !== undefined) localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(state.departments));
  if (state.employees !== undefined) localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(state.employees));
  if (state.holidays !== undefined) localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(state.holidays));
  if (state.attendance !== undefined) localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(state.attendance));
  if (state.leaves !== undefined) localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(state.leaves));
  if (state.familyMembers !== undefined) localStorage.setItem(STORAGE_KEYS.FAMILY_MEMBERS, JSON.stringify(state.familyMembers));
  if (state.medicalExpenses !== undefined) localStorage.setItem(STORAGE_KEYS.MEDICAL_EXPENSES, JSON.stringify(state.medicalExpenses));
  if (state.config !== undefined) localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(state.config));
  if (state.logs !== undefined) localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(state.logs));
  if (state.currentUser !== undefined) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(state.currentUser));
  if (state.emailLogs !== undefined) localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(state.emailLogs));

  // Payroll save
  if (state.salaryComponents !== undefined) localStorage.setItem(STORAGE_KEYS.SALARY_COMPONENTS, JSON.stringify(state.salaryComponents));
  if (state.taxConfig !== undefined) localStorage.setItem(STORAGE_KEYS.TAX_CONFIG, JSON.stringify(state.taxConfig));
  if (state.payrollPeriods !== undefined) localStorage.setItem(STORAGE_KEYS.PAYROLL_PERIODS, JSON.stringify(state.payrollPeriods));
  if (state.salaryStructures !== undefined) localStorage.setItem(STORAGE_KEYS.SALARY_STRUCTURES, JSON.stringify(state.salaryStructures));
  if (state.payrollRecords !== undefined) localStorage.setItem(STORAGE_KEYS.PAYROLL_RECORDS, JSON.stringify(state.payrollRecords));
  if (state.payslips !== undefined) localStorage.setItem(STORAGE_KEYS.PAYSLIPS, JSON.stringify(state.payslips));
  if (state.payslipDistributionLogs !== undefined) localStorage.setItem(STORAGE_KEYS.PAYSLIP_DISTRIBUTION_LOGS, JSON.stringify(state.payslipDistributionLogs));
  if (state.payrollApprovals !== undefined) localStorage.setItem(STORAGE_KEYS.PAYROLL_APPROVALS, JSON.stringify(state.payrollApprovals));
  if (state.payrollImportLogs !== undefined) localStorage.setItem(STORAGE_KEYS.PAYROLL_IMPORT_LOGS, JSON.stringify(state.payrollImportLogs));
  if (state.payrollSettings !== undefined) localStorage.setItem(STORAGE_KEYS.PAYROLL_SETTINGS, JSON.stringify(state.payrollSettings));
  if (state.roles !== undefined) localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(state.roles));
  if (state.rolePermissions !== undefined) localStorage.setItem(STORAGE_KEYS.ROLE_PERMISSIONS, JSON.stringify(state.rolePermissions));
}

// Global logger helper
export function logActivity(
  state: AppState,
  module: string,
  action: string,
  recordEntity: string,
  details: string
): ActivityLog[] {
  const currentUser = state.currentUser;
  const newLog: ActivityLog = {
    id: `LOG${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
    userId: currentUser ? currentUser.id : "SYSTEM",
    userEmail: currentUser ? currentUser.email : "system@ethio-re.com",
    userRole: currentUser ? currentUser.role : "System",
    module,
    action,
    recordEntity,
    details
  };
  
  const updatedLogs = [newLog, ...state.logs];
  // Limit to 500 logs for efficiency
  const slicedLogs = updatedLogs.slice(0, 500);
  saveState({ logs: slicedLogs });
  return slicedLogs;
}
