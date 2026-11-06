import { 
  User, Department, Employee, AttendanceRecord, LeaveRecord, 
  PublicHoliday, CompanyConfig, ActivityLog, UserRole, FamilyMember, MedicalExpense
} from "./types";
import { 
  DEFAULT_USERS, DEFAULT_DEPARTMENTS, DEFAULT_EMPLOYEES, 
  DEFAULT_HOLIDAYS, DEFAULT_ATTENDANCE, DEFAULT_LEAVES, 
  DEFAULT_COMPANY_CONFIG, DEFAULT_ACTIVITY_LOGS, DEFAULT_FAMILY_MEMBERS, DEFAULT_MEDICAL_EXPENSES 
} from "./initialData";

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
  CURRENT_USER: "ethiore_current_user"
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

  const rawEmployees = getOrSeed<Employee[]>(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
  const rawAttendance = getOrSeed<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
  const rawLeaves = getOrSeed<LeaveRecord[]>(STORAGE_KEYS.LEAVES, DEFAULT_LEAVES);
  const rawFamilyMembers = getOrSeed<FamilyMember[]>(STORAGE_KEYS.FAMILY_MEMBERS, DEFAULT_FAMILY_MEMBERS);
  const rawMedicalExpenses = getOrSeed<MedicalExpense[]>(STORAGE_KEYS.MEDICAL_EXPENSES, DEFAULT_MEDICAL_EXPENSES);
  const rawLogs = getOrSeed<ActivityLog[]>(STORAGE_KEYS.LOGS, DEFAULT_ACTIVITY_LOGS);

  const cleanEmployees = rawEmployees.filter(e => !demoEmpIds.has(e.employeeId));
  const cleanAttendance = rawAttendance.filter(a => !demoAttIds.has(a.id) && !demoEmpIds.has(a.employeeId));
  const cleanLeaves = rawLeaves.filter(l => !demoLeaveIds.has(l.id) && !demoEmpIds.has(l.employeeId));
  const cleanFamilyMembers = rawFamilyMembers.filter(f => !demoFamIds.has(f.id) && !demoEmpIds.has(f.employeeId));
  const cleanMedicalExpenses = rawMedicalExpenses.filter(m => !demoMedIds.has(m.id) && !demoEmpIds.has(m.employeeId));
  const cleanLogs = rawLogs.filter(l => !demoLogIds.has(l.id));

  // Persist sanitized state back
  localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(cleanEmployees));
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(cleanAttendance));
  localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(cleanLeaves));
  localStorage.setItem(STORAGE_KEYS.FAMILY_MEMBERS, JSON.stringify(cleanFamilyMembers));
  localStorage.setItem(STORAGE_KEYS.MEDICAL_EXPENSES, JSON.stringify(cleanMedicalExpenses));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(cleanLogs));

  return {
    users: getOrSeed<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS),
    departments: getOrSeed<Department[]>(STORAGE_KEYS.DEPARTMENTS, DEFAULT_DEPARTMENTS),
    employees: cleanEmployees,
    holidays: getOrSeed<PublicHoliday[]>(STORAGE_KEYS.HOLIDAYS, DEFAULT_HOLIDAYS),
    attendance: cleanAttendance,
    leaves: cleanLeaves,
    familyMembers: cleanFamilyMembers,
    medicalExpenses: cleanMedicalExpenses,
    config: getOrSeed<CompanyConfig>(STORAGE_KEYS.CONFIG, DEFAULT_COMPANY_CONFIG),
    logs: cleanLogs,
    currentUser: getOrSeed<User | null>(STORAGE_KEYS.CURRENT_USER, null)
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
