import { 
  User, Department, Employee, AttendanceRecord, LeaveRecord, 
  PublicHoliday, CompanyConfig, ActivityLog, UserRole
} from "./types";
import { 
  DEFAULT_USERS, DEFAULT_DEPARTMENTS, DEFAULT_EMPLOYEES, 
  DEFAULT_HOLIDAYS, DEFAULT_ATTENDANCE, DEFAULT_LEAVES, 
  DEFAULT_COMPANY_CONFIG, DEFAULT_ACTIVITY_LOGS 
} from "./initialData";

const STORAGE_KEYS = {
  USERS: "ethiore_users",
  DEPARTMENTS: "ethiore_departments",
  EMPLOYEES: "ethiore_employees",
  HOLIDAYS: "ethiore_holidays",
  ATTENDANCE: "ethiore_attendance",
  LEAVES: "ethiore_leaves",
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

  return {
    users: getOrSeed<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS),
    departments: getOrSeed<Department[]>(STORAGE_KEYS.DEPARTMENTS, DEFAULT_DEPARTMENTS),
    employees: getOrSeed<Employee[]>(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES),
    holidays: getOrSeed<PublicHoliday[]>(STORAGE_KEYS.HOLIDAYS, DEFAULT_HOLIDAYS),
    attendance: getOrSeed<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE),
    leaves: getOrSeed<LeaveRecord[]>(STORAGE_KEYS.LEAVES, DEFAULT_LEAVES),
    config: getOrSeed<CompanyConfig>(STORAGE_KEYS.CONFIG, DEFAULT_COMPANY_CONFIG),
    logs: getOrSeed<ActivityLog[]>(STORAGE_KEYS.LOGS, DEFAULT_ACTIVITY_LOGS),
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
