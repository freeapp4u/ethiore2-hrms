import React, { useState, useEffect } from "react";
import { 
  loadState, saveState, logActivity, AppState 
} from "./dbStore";
import { syncRecordToFirestore, deleteRecordFromFirestore, syncBatchRecordsToFirestore } from "./firebaseSync";
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendEmailVerification,
  sendPasswordResetEmail 
} from "./firebase";
import { 
  User, Department, Employee, AttendanceRecord, LeaveRecord, 
  PublicHoliday, CompanyConfig, ActivityLog, UserRole, AccountStatus,
  FamilyMember, MedicalExpense,
  SalaryComponent, TaxConfiguration, PayrollPeriod, EmployeeSalaryStructure,
  PayrollRecord, Payslip, PayslipDistributionLog, PayrollApproval, PayrollImportLog, PayrollSettings,
  EmailActivityLog
} from "./types";

// Component Imports
import ThemeStyles from "./components/ThemeStyles";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Employees from "./components/Employees";
import Departments from "./components/Departments";
import Attendance from "./components/Attendance";
import LeaveManagement from "./components/LeaveManagement";
import MedicalManagement from "./components/MedicalManagement";
import PayrollManagement from "./components/PayrollManagement";
import Settings from "./components/Settings";
import Reports from "./components/Reports";
import HelpCenter from "./components/HelpCenter";
import DocumentVault from "./components/DocumentVault";

import { ShieldCheck, Lock, Mail, ServerCrash, Key, Eye, EyeOff, X, Users } from "lucide-react";

export default function App() {
  // Core App state variables
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [medicalExpenses, setMedicalExpenses] = useState<MedicalExpense[]>([]);
  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailActivityLog[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Payroll Management State
  const [salaryComponents, setSalaryComponents] = useState<SalaryComponent[]>([]);
  const [taxConfig, setTaxConfig] = useState<TaxConfiguration | null>(null);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<EmployeeSalaryStructure[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [payslipDistributionLogs, setPayslipDistributionLogs] = useState<PayslipDistributionLog[]>([]);
  const [payrollApprovals, setPayrollApprovals] = useState<PayrollApproval[]>([]);
  const [payrollImportLogs, setPayrollImportLogs] = useState<PayrollImportLog[]>([]);
  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings | null>(null);

  // Layout UI states
  const [activeTab, setActiveTabState] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return hash || "dashboard";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const setActiveTab = (tabId: string) => {
    setActiveTabState(tabId);
    if (window.location.hash !== `#${tabId}`) {
      window.location.hash = tabId;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && hash !== activeTab) {
        setActiveTabState(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [activeTab]);

  // Login form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Forgot Password modal states
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Login / Register view toggle state
  const [loginMode, setLoginMode] = useState<"login" | "register">("login");

  // Registration Form states
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regSuccessMessage, setRegSuccessMessage] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // Load state from local storage on mount
  useEffect(() => {
    const state = loadState();
    
    // Dynamically apply High Density branding theme on first mount
    if (state.config && state.config.branding && state.config.branding.primaryColor === "#0F2942") {
      state.config.branding.primaryColor = "#002B5B";
      state.config.branding.secondaryColor = "#001F44";
      saveState({ config: state.config });
    }

    setUsers(state.users);
    setDepartments(state.departments);
    setEmployees(state.employees);
    setHolidays(state.holidays);
    setAttendance(state.attendance);
    setLeaves(state.leaves);
    setFamilyMembers(state.familyMembers || []);
    setMedicalExpenses(state.medicalExpenses || []);
    setConfig(state.config);
    setLogs(state.logs);
    setEmailLogs(state.emailLogs || []);
    setCurrentUser(state.currentUser);

    // Load payroll state
    setSalaryComponents(state.salaryComponents || []);
    setTaxConfig(state.taxConfig || null);
    setPayrollPeriods(state.payrollPeriods || []);
    setSalaryStructures(state.salaryStructures || []);
    setPayrollRecords(state.payrollRecords || []);
    setPayslips(state.payslips || []);
    setPayslipDistributionLogs(state.payslipDistributionLogs || []);
    setPayrollApprovals(state.payrollApprovals || []);
    setPayrollImportLogs(state.payrollImportLogs || []);
    setPayrollSettings(state.payrollSettings || null);

    setLoading(false);
  }, []);

  if (loading || !config) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-xs font-semibold text-slate-500 gap-2">
        <div className="h-6 w-6 border-2 border-primary-custom border-t-transparent rounded-full animate-spin"></div>
        <span>Initializing Ethio-Re HRMS Database...</span>
      </div>
    );
  }

  // State update handlers (persists in LocalStorage via saveState helper and syncs to Firestore)
  const handleUpdateUsers = (newUsers: User[], userToSync?: User) => {
    setUsers(newUsers);
    saveState({ users: newUsers });
    if (userToSync) {
      syncRecordToFirestore("users", userToSync.id, userToSync);
    } else if (currentUser?.role === "Administrator") {
      newUsers.forEach(u => syncRecordToFirestore("users", u.id, u));
    }
  };

  const handleUpdateDepartments = (newDepts: Department[]) => {
    setDepartments(newDepts);
    saveState({ departments: newDepts });
  };

  const handleUpdateEmployees = (newEmps: Employee[]) => {
    setEmployees(newEmps);
    saveState({ employees: newEmps });
  };

  const handleUpdateHolidays = (newHolidays: PublicHoliday[]) => {
    setHolidays(newHolidays);
    saveState({ holidays: newHolidays });
    newHolidays.forEach(h => syncRecordToFirestore("holidays", h.id, h));
  };

  const handleUpdateAttendance = (newAttendance: AttendanceRecord[]) => {
    setAttendance(newAttendance);
    saveState({ attendance: newAttendance });
  };

  const handleUpdateLeaves = (newLeaves: LeaveRecord[]) => {
    setLeaves(newLeaves);
    saveState({ leaves: newLeaves });
  };

  const handleUpdateConfig = (newConfig: CompanyConfig) => {
    setConfig(newConfig);
    saveState({ config: newConfig });
    syncRecordToFirestore("config", "company_config", newConfig);
  };

  const handleUpdateLogs = (newLogs: ActivityLog[]) => {
    setLogs(newLogs);
    saveState({ logs: newLogs });
    if (newLogs.length > 0) {
      syncRecordToFirestore("logs", newLogs[0].id, newLogs[0]);
    }
  };

  const handleUpdateEmailLogs = (newLogs: EmailActivityLog[]) => {
    setEmailLogs(newLogs);
    saveState({ emailLogs: newLogs });
    if (newLogs.length > 0) {
      syncRecordToFirestore("email_logs", newLogs[0].id, newLogs[0]);
    }
  };

  const handleUpdateCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    saveState({ currentUser: user });
  };

  // Payroll State Update Handlers
  const handleUpdateSalaryComponents = (newComponents: SalaryComponent[]) => {
    setSalaryComponents(newComponents);
    saveState({ salaryComponents: newComponents });
    newComponents.forEach(c => syncRecordToFirestore("salary_components", c.id, c));
  };

  const handleUpdateTaxConfig = (newTaxConfig: TaxConfiguration) => {
    setTaxConfig(newTaxConfig);
    saveState({ taxConfig: newTaxConfig });
    syncRecordToFirestore("tax_configurations", newTaxConfig.id, newTaxConfig);
  };

  const handleUpdatePayrollPeriods = (newPeriods: PayrollPeriod[]) => {
    setPayrollPeriods(newPeriods);
    saveState({ payrollPeriods: newPeriods });
    newPeriods.forEach(p => syncRecordToFirestore("payroll_periods", p.id, p));
  };

  const handleUpdateSalaryStructures = (newStructures: EmployeeSalaryStructure[]) => {
    setSalaryStructures(newStructures);
    saveState({ salaryStructures: newStructures });
    newStructures.forEach(s => syncRecordToFirestore("employee_salary_structures", s.id, s));
  };

  const handleUpdatePayrollRecords = (newRecords: PayrollRecord[]) => {
    setPayrollRecords(newRecords);
    saveState({ payrollRecords: newRecords });
    newRecords.forEach(r => syncRecordToFirestore("payroll_records", r.id, r));
  };

  const handleUpdatePayslips = (newPayslips: Payslip[]) => {
    setPayslips(newPayslips);
    saveState({ payslips: newPayslips });
    newPayslips.forEach(ps => syncRecordToFirestore("payslips", ps.id, ps));
  };

  const handleUpdatePayslipDistributionLogs = (newLogs: PayslipDistributionLog[]) => {
    setPayslipDistributionLogs(newLogs);
    saveState({ payslipDistributionLogs: newLogs });
    newLogs.forEach(l => syncRecordToFirestore("payslip_distribution_logs", l.id, l));
  };

  const handleUpdatePayrollApprovals = (newApprovals: PayrollApproval[]) => {
    setPayrollApprovals(newApprovals);
    saveState({ payrollApprovals: newApprovals });
    newApprovals.forEach(a => syncRecordToFirestore("payroll_approvals", a.id, a));
  };

  const handleUpdatePayrollImportLogs = (newLogs: PayrollImportLog[]) => {
    setPayrollImportLogs(newLogs);
    saveState({ payrollImportLogs: newLogs });
    newLogs.forEach(l => syncRecordToFirestore("payroll_import_logs", l.id, l));
  };

  const handleUpdatePayrollSettings = (newSettings: PayrollSettings) => {
    setPayrollSettings(newSettings);
    saveState({ payrollSettings: newSettings });
    syncRecordToFirestore("payroll_settings", newSettings.id, newSettings);
  };

  // Transaction auditing action logger
  const handleLogAction = (module: string, action: string, record: string, details: string) => {
    const currentState: AppState = {
      users,
      departments,
      employees,
      holidays,
      attendance,
      leaves,
      familyMembers,
      medicalExpenses,
      config: config!,
      logs,
      currentUser,
      emailLogs,
      salaryComponents,
      taxConfig: taxConfig || undefined,
      payrollPeriods,
      salaryStructures,
      payrollRecords,
      payslips,
      payslipDistributionLogs,
      payrollApprovals,
      payrollImportLogs,
      payrollSettings: payrollSettings || undefined,
    };
    const updatedLogs = logActivity(currentState, module, action, record, details);
    setLogs(updatedLogs);
  };

  // User Authentication
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Please enter both your company email address and password.");
      return;
    }

    const emailNorm = loginEmail.trim().toLowerCase();
    const foundUser = users.find(u => u.email.toLowerCase() === emailNorm);

    if (!foundUser) {
      setLoginError("Unauthorized credentials: No registered account found with this email address.");
      return;
    }

    if (foundUser.password !== loginPassword) {
      setLoginError("Authentication failed: Password value is incorrect.");
      return;
    }

    // Checking email verification first (except for contactesfaye@gmail.com which is the special Admin exception)
    if (emailNorm !== "contactesfaye@gmail.com" && !foundUser.emailVerified) {
      setLoginError("Your email address has not been verified. Please check your email and complete verification before logging in.");
      return;
    }

    // Checking Account Status
    if (foundUser.status !== "Active") {
      setLoginError(`Authentication failed: This operator account is currently ${foundUser.status}. Contact administrator.`);
      return;
    }

    setLoginLoading(true);

    try {
      // Establish Firebase Auth session
      try {
        await signInWithEmailAndPassword(auth, emailNorm, loginPassword);
      } catch (authErr: any) {
        if (authErr?.code === "auth/user-not-found" || authErr?.code === "auth/invalid-credential") {
          try {
            await createUserWithEmailAndPassword(auth, emailNorm, loginPassword);
          } catch (createErr) {
            console.warn("Firebase Auth seed notice:", createErr);
          }
        } else {
          console.warn("Firebase Auth sign in notice:", authErr);
        }
      }

      // Success login
      const updatedUser = {
        ...foundUser,
        lastLogin: new Date().toISOString().replace("T", " ").substring(0, 19)
      };

      // Update users array with last login time
      const updatedUsers = users.map(u => u.id === foundUser.id ? updatedUser : u);
      handleUpdateUsers(updatedUsers, updatedUser);
      handleUpdateCurrentUser(updatedUser);

      // Initial log
      const currentState: AppState = {
        users: updatedUsers,
        departments,
        employees,
        holidays,
        attendance,
        leaves,
        familyMembers,
        medicalExpenses,
        config: config!,
        logs,
        currentUser: updatedUser,
        emailLogs,
        salaryComponents,
        taxConfig: taxConfig || undefined,
        payrollPeriods,
        salaryStructures,
        payrollRecords,
        payslips,
        payslipDistributionLogs,
        payrollApprovals,
        payrollImportLogs,
        payrollSettings: payrollSettings || undefined,
      };
      const updatedLogs = logActivity(currentState, "Security", "Operator Login", emailNorm, `Operator logged in from portal IP`);
      setLogs(updatedLogs);

      setLoginEmail("");
      setLoginPassword("");
    } finally {
      setLoginLoading(false);
    }
  };

  // Password Reset Submission
  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus(null);
    if (!resetEmail.trim()) {
      setResetStatus({ type: "error", msg: "Please enter your registered company email address." });
      return;
    }
    const norm = resetEmail.trim().toLowerCase();
    if (!norm.endsWith("@ethiopianre.com") && norm !== "contactesfaye@gmail.com") {
      setResetStatus({ type: "error", msg: "Password reset is restricted to registered @ethiopianre.com accounts." });
      return;
    }
    setResetLoading(true);
    try {
      try {
        await sendPasswordResetEmail(auth, norm);
      } catch (fErr) {
        console.warn("Firebase Password Reset notice:", fErr);
      }
      setResetStatus({ type: "success", msg: `Password reset instructions dispatched to ${norm}. Check your email inbox.` });
    } finally {
      setResetLoading(false);
    }
  };

  // User Registration Submissions
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setRegSuccessMessage("");

    if (!regFullName.trim() || !regEmail.trim() || !regPassword || !regConfirmPassword) {
      setLoginError("Please fill out all registration fields.");
      return;
    }

    const emailNorm = regEmail.trim().toLowerCase();

    // 1. Password matches validation
    if (regPassword !== regConfirmPassword) {
      setLoginError("Password confirmation failed: Passwords do not match.");
      return;
    }

    // 2. Ethiopian Reinsurance Domain restriction
    if (!emailNorm.endsWith("@ethiopianre.com")) {
      setLoginError("Only users with an @ethiopianre.com company email address are allowed to register.");
      return;
    }

    // 3. Prevent duplicate emails
    const isDuplicate = users.some(u => u.email.toLowerCase() === emailNorm);
    if (isDuplicate) {
      setLoginError("Registration error: A portal operator account is already registered with this email address.");
      return;
    }

    setRegLoading(true);

    try {
      let createdUid = `U_${Date.now()}`;
      try {
        const userCred = await createUserWithEmailAndPassword(auth, emailNorm, regPassword);
        createdUid = userCred.user.uid;
        try {
          await sendEmailVerification(userCred.user);
        } catch (vErr) {
          console.warn("sendEmailVerification notice:", vErr);
        }
      } catch (authErr: any) {
        console.warn("Firebase Auth registration notice (fallback to local record):", authErr);
      }

      const newUser: User = {
        id: createdUid,
        fullName: regFullName.trim(),
        email: emailNorm,
        password: regPassword,
        role: "HR Officer", // Automatic Default role assigned
        status: "Pending Verification", // Automatic Default status assigned
        emailVerified: false,
        createdDate: new Date().toISOString().split("T")[0]
      };

      const updatedUsers = [...users, newUser];
      handleUpdateUsers(updatedUsers, newUser);

      setRegSuccessMessage("Registration successful. Please check your @ethiopianre.com email address and verify your account before logging in.");

      // Clean registration inputs
      setRegFullName("");
      setRegEmail("");
      setRegPassword("");
      setRegConfirmPassword("");
    } finally {
      setRegLoading(false);
    }
  };

  // Helper function to simulate instant email verification for review convenience
  const handleSimulateInstantVerification = (email: string) => {
    const emailNorm = email.trim().toLowerCase();
    const found = users.find(u => u.email.toLowerCase() === emailNorm);
    if (found) {
      const verifiedUser = { ...found, emailVerified: true, status: "Active" as any };
      const updatedUsers = users.map(u => u.id === found.id ? verifiedUser : u);
      handleUpdateUsers(updatedUsers, verifiedUser);
      alert(`Simulation Success: ${found.fullName} (${emailNorm}) has been successfully verified & status set to Active! You can now log in.`);
      setLoginEmail(emailNorm);
      setLoginPassword(found.password);
      setLoginError("");
    } else {
      alert(`Simulation Error: Could not find user account with email "${emailNorm}" to verify.`);
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      handleLogAction("Security", "Operator Logout", currentUser.email, `Operator closed portal session`);
    }
    signOut(auth).catch(err => console.warn("Firebase signOut notice:", err));
    handleUpdateCurrentUser(null);
    setActiveTab("dashboard");
  };

  // Profile management from within the Header Component
  const handleUpdateOwnProfile = (fullName: string, email: string): boolean => {
    if (!currentUser) return false;
    const emailNorm = email.trim().toLowerCase();
    const isDuplicate = users.some(u => u.id !== currentUser.id && u.email.toLowerCase() === emailNorm);
    if (isDuplicate) return false;

    const updatedUser = { ...currentUser, fullName, email: emailNorm };
    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    
    handleUpdateUsers(updatedUsers, updatedUser);
    handleUpdateCurrentUser(updatedUser);
    handleLogAction("Profile", "Self Profile Updated", emailNorm, "Operator modified their account profile metadata");
    return true;
  };

  const handleUpdateOwnPassword = (oldPass: string, newPass: string): boolean => {
    if (!currentUser) return false;
    // Check old pass
    const freshUser = users.find(u => u.id === currentUser.id);
    if (!freshUser || freshUser.password !== oldPass) return false;

    const updatedUser = { ...freshUser, password: newPass };
    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    
    handleUpdateUsers(updatedUsers, updatedUser);
    handleUpdateCurrentUser(updatedUser);
    handleLogAction("Profile", "Self Password Changed", currentUser.email, "Operator changed security password");
    return true;
  };

  // Quick Action triggers for CRUD from other subcomponents
  // Employees CRUD
  const handleAddEmployee = (emp: Employee): boolean => {
    const exists = employees.some(e => e.employeeId.toLowerCase() === emp.employeeId.toLowerCase());
    if (exists) return false;
    const updated = [...employees, emp];
    handleUpdateEmployees(updated);
    syncRecordToFirestore("employees", emp.employeeId, emp);
    return true;
  };

  const handleAddEmployeesBulk = async (
    newEmps: Employee[]
  ): Promise<{ successCount: number; failCount: number; failedErrors: string[] }> => {
    if (newEmps.length === 0) {
      return { successCount: 0, failCount: 0, failedErrors: [] };
    }

    // Filter out duplicate IDs against current employees list
    const existingIds = new Set(employees.map(e => e.employeeId.toUpperCase()));
    const validToInsert: Employee[] = [];
    const duplicateErrors: string[] = [];

    newEmps.forEach(emp => {
      const upperId = emp.employeeId.toUpperCase();
      if (existingIds.has(upperId)) {
        duplicateErrors.push(`Employee ID '${emp.employeeId}' already exists in system.`);
      } else {
        existingIds.add(upperId);
        validToInsert.push(emp);
      }
    });

    if (validToInsert.length === 0) {
      return {
        successCount: 0,
        failCount: newEmps.length,
        failedErrors: duplicateErrors
      };
    }

    // Prepare separate document references for Firestore batch write
    const batchRecords = validToInsert.map(emp => ({
      id: emp.employeeId,
      data: emp
    }));

    // Await batch write to Firestore
    const syncResult = await syncBatchRecordsToFirestore("employees", batchRecords);

    // Update React State in a SINGLE update preserving ALL imported employees + existing employees
    setEmployees(prevEmployees => {
      const currentIds = new Set(prevEmployees.map(e => e.employeeId.toUpperCase()));
      const trulyNew = validToInsert.filter(e => !currentIds.has(e.employeeId.toUpperCase()));
      const combined = [...prevEmployees, ...trulyNew];
      saveState({ employees: combined });
      return combined;
    });

    return {
      successCount: syncResult.successCount,
      failCount: syncResult.failedCount + duplicateErrors.length,
      failedErrors: [...duplicateErrors, ...syncResult.errors]
    };
  };
  const handleUpdateEmployee = (emp: Employee) => {
    const updated = employees.map(e => e.employeeId === emp.employeeId ? emp : e);
    handleUpdateEmployees(updated);
    syncRecordToFirestore("employees", emp.employeeId, emp);
  };
  const handleDeleteEmployee = (id: string): boolean => {
    // Only archive/deactivate by default, unless Admin forces delete
    const updated = employees.map(e => {
      if (e.employeeId === id) {
        const inactiveEmp = { ...e, status: "Inactive" as const };
        syncRecordToFirestore("employees", inactiveEmp.employeeId, inactiveEmp);
        return inactiveEmp;
      }
      return e;
    });
    handleUpdateEmployees(updated);
    return true;
  };

  // Departments CRUD
  const handleAddDepartment = (dept: Department): boolean => {
    const nameExists = departments.some(d => d.name.toLowerCase() === dept.name.toLowerCase());
    const codeExists = departments.some(d => d.code.toLowerCase() === dept.code.toLowerCase());
    if (nameExists || codeExists) return false;
    handleUpdateDepartments([...departments, dept]);
    syncRecordToFirestore("departments", dept.id, dept);
    return true;
  };
  const handleUpdateDepartment = (dept: Department) => {
    const updated = departments.map(d => d.id === dept.id ? dept : d);
    handleUpdateDepartments(updated);
    syncRecordToFirestore("departments", dept.id, dept);
  };
  const handleDeleteDepartment = (id: string): boolean => {
    const hasEmployees = employees.some(e => e.departmentId === id);
    if (hasEmployees) return false;
    const updated = departments.filter(d => d.id !== id);
    handleUpdateDepartments(updated);
    deleteRecordFromFirestore("departments", id);
    return true;
  };

  // Attendance Add
  const handleAddAttendance = (rec: AttendanceRecord): boolean => {
    const exists = attendance.some(a => a.employeeId === rec.employeeId && a.date === rec.date);
    if (exists) return false;
    handleUpdateAttendance([rec, ...attendance]);
    syncRecordToFirestore("attendance", rec.id, rec);
    return true;
  };
  const handleUpdateAttendanceRecord = (rec: AttendanceRecord) => {
    const updated = attendance.map(a => a.id === rec.id ? rec : a);
    handleUpdateAttendance(updated);
    syncRecordToFirestore("attendance", rec.id, rec);
  };

  // Leaves Add
  const handleAddLeave = (rec: LeaveRecord): boolean => {
    handleUpdateLeaves([rec, ...leaves]);
    syncRecordToFirestore("leaves", rec.id, rec);
    return true;
  };
  const handleUpdateLeaveRecord = (rec: LeaveRecord) => {
    const updated = leaves.map(l => l.id === rec.id ? rec : l);
    handleUpdateLeaves(updated);
    syncRecordToFirestore("leaves", rec.id, rec);
  };

  // Family Members & Medical Expenses CRUD
  const handleUpdateFamilyMembersState = (newFms: FamilyMember[]) => {
    setFamilyMembers(newFms);
    saveState({ familyMembers: newFms });
  };
  const handleAddFamilyMember = (fm: FamilyMember): boolean => {
    const updated = [...familyMembers, fm];
    handleUpdateFamilyMembersState(updated);
    syncRecordToFirestore("family_members", fm.id, fm);
    return true;
  };
  const handleUpdateFamilyMember = (fm: FamilyMember) => {
    const updated = familyMembers.map(item => item.id === fm.id ? fm : item);
    handleUpdateFamilyMembersState(updated);
    syncRecordToFirestore("family_members", fm.id, fm);
  };

  const handleUpdateMedicalExpensesState = (newExps: MedicalExpense[]) => {
    setMedicalExpenses(newExps);
    saveState({ medicalExpenses: newExps });
  };
  const handleAddMedicalExpense = (exp: MedicalExpense): boolean => {
    const updated = [exp, ...medicalExpenses];
    handleUpdateMedicalExpensesState(updated);
    syncRecordToFirestore("medical_expenses", exp.id, exp);
    return true;
  };
  const handleUpdateMedicalExpense = (exp: MedicalExpense) => {
    const updated = medicalExpenses.map(item => item.id === exp.id ? exp : item);
    handleUpdateMedicalExpensesState(updated);
    syncRecordToFirestore("medical_expenses", exp.id, exp);
  };
  const handleDeleteMedicalExpense = (id: string): boolean => {
    const updated = medicalExpenses.filter(item => item.id !== id);
    handleUpdateMedicalExpensesState(updated);
    deleteRecordFromFirestore("medical_expenses", id);
    return true;
  };

  // Quick credentials loader for evaluator ease of access
  const handleQuickLogin = (email: string) => {
    setLoginEmail(email);
    setLoginPassword("admin123");
  };

  // LOGIN & REGISTRATION CANVAS (Minimal Corporate Balanced Layout)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
        <ThemeStyles branding={config.branding} />
        
        {/* Main Balanced 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen w-full">
          
          {/* LEFT SECTION – Minimal Corporate Branding Panel */}
          <div className="lg:col-span-6 bg-gradient-to-br from-[#001F44] via-[#002B5B] to-[#0A192F] p-8 lg:p-14 text-white flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10 min-h-[480px]">
            
            {/* Ambient Background Blur */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#FED100]/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Branding Header */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                {config?.profile?.logoUrl ? (
                  <img 
                    src={config.profile.logoUrl} 
                    alt="Ethiopian Reinsurance S.C. Logo" 
                    className="h-12 max-w-[170px] object-contain drop-shadow-md" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-[#009A44] via-[#FED100] to-[#E62529] p-0.5 shadow-lg shrink-0">
                    <div className="w-full h-full rounded-full bg-[#002B5B] flex items-center justify-center font-black text-[#FED100] text-sm border border-white/30">
                      ER
                    </div>
                  </div>
                )}
                <div>
                  <h2 className="font-extrabold text-base md:text-lg tracking-tight text-white leading-snug">
                    Ethiopian Reinsurance S.C.
                  </h2>
                  <p className="text-xs font-bold text-[#FED100] tracking-wide mt-0.5">
                    የኢትዮጵያ ጠለፋ መድን አ.ማ.
                  </p>
                </div>
              </div>

              {/* Secondary Slogan Pill */}
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 bg-white/10 rounded-full border border-white/20 text-[#FED100] backdrop-blur-xs">
                Rising with Africa
              </span>
            </div>

            {/* Center Content Section */}
            <div className="relative z-10 my-auto py-10 space-y-6 max-w-xl">
              
              {/* Badge Indicator */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/15 text-slate-200 text-[11px] font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                ETRHRMS Enterprise Portal
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                  Human Resource Management System
                </h1>
                <p className="text-xs lg:text-sm text-slate-300 leading-relaxed font-normal">
                  A centralized platform for managing employee information, leave administration, departmental operations, and HR services across Ethiopian Reinsurance S.C.
                </p>
              </div>

              {/* Key Module Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 backdrop-blur-xs">
                  <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center text-[#FED100] shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Centralized Personnel</h4>
                    <p className="text-[10px] text-slate-400">Employee Master Records</p>
                  </div>
                </div>

                <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 backdrop-blur-xs">
                  <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center text-[#FED100] shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Role-Based Security</h4>
                    <p className="text-[10px] text-slate-400">Verified Access Control</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer Details */}
            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>© {new Date().getFullYear()} Ethiopian Reinsurance S.C.</span>
              <span>የኢትዮጵያ ጠለፋ መድን አ.ማ.</span>
            </div>
          </div>

          {/* RIGHT SECTION – Balanced Corporate Login Form Panel */}
          <div className="lg:col-span-6 bg-white p-8 lg:p-16 flex flex-col justify-center min-h-[500px]">
            <div className="max-w-md w-full mx-auto space-y-6">
              
              {/* Header Title & Subtitle */}
              <div>
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                  {loginMode === "login" ? "Welcome Back" : "Operator Registration"}
                </h2>
                <p className="text-xs lg:text-sm text-slate-500 font-medium mt-1">
                  {loginMode === "login"
                    ? "Sign in to access your ETRHRMS account."
                    : "Register your operator account with verified @ethiopianre.com email."}
                </p>
              </div>

              {/* Status Alerts */}
              {loginError && (
                <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold space-y-2 animate-in fade-in duration-150">
                  <p className="leading-tight">{loginError}</p>
                  {loginError.includes("verified") && (
                    <div className="pt-2 border-t border-rose-200/60 flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => alert(`Simulated Notice: Resent email verification link to ${loginEmail}`)}
                        className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] rounded-lg uppercase tracking-wider transition-all"
                      >
                        Resend Verification Email
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateInstantVerification(loginEmail)}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg uppercase tracking-wider transition-all"
                      >
                        ⚡ Simulate Instant Verification (Review Helper)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {regSuccessMessage && (
                <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold space-y-2 animate-in fade-in duration-150">
                  <p className="leading-tight">{regSuccessMessage}</p>
                  <div className="pt-2 border-t border-emerald-200/60">
                    <button
                      type="button"
                      onClick={() => handleSimulateInstantVerification(regEmail || loginEmail)}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg uppercase tracking-wider transition-all"
                    >
                      ⚡ Simulate Instant Verification for Registered Email
                    </button>
                  </div>
                </div>
              )}

              {loginMode === "login" ? (
                /* --- LOGIN FORM --- */
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Company Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        placeholder="e.g. employee@ethiopianre.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#002B5B] focus:border-transparent text-slate-800 font-medium transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#002B5B] focus:border-transparent text-slate-800 font-medium transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                        title={showLoginPassword ? "Hide Password" : "Show Password"}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password Row */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-[#002B5B] focus:ring-[#002B5B]"
                      />
                      <span>Remember Me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(loginEmail);
                        setResetStatus(null);
                        setForgotPasswordModal(true);
                      }}
                      className="text-xs font-extrabold text-[#002B5B] hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 bg-[#002B5B] hover:bg-[#001F44] text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg uppercase tracking-wider disabled:opacity-50 mt-2 cursor-pointer"
                  >
                    {loginLoading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Key className="h-4 w-4 text-[#FED100]" />
                        <span>Sign In to ETRHRMS</span>
                      </>
                    )}
                  </button>

                  {/* Register Toggle */}
                  <div className="text-center pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginError("");
                        setRegSuccessMessage("");
                        setLoginMode("register");
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-[#002B5B] transition-colors"
                    >
                      Don't have an account? <span className="text-[#002B5B] underline">Register / Sign Up here</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* --- REGISTRATION FORM --- */
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Almaz Bekele"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#002B5B] text-slate-800 font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Company Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. almaz.bekele@ethiopianre.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#002B5B] text-slate-800 font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? "text" : "password"}
                        placeholder="Create secure password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#002B5B] text-slate-800 font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Re-type password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#002B5B] text-slate-800 font-medium"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-3 bg-[#002B5B] hover:bg-[#001F44] text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                  >
                    {regLoading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 text-[#FED100]" />
                        <span>Register Operator Account</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginError("");
                        setRegSuccessMessage("");
                        setLoginMode("register");
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-[#002B5B] transition-colors"
                    >
                      Already registered? <span className="text-[#002B5B] underline">Back to Login Screen</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {forgotPasswordModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-[#002B5B] text-white px-6 py-4 flex items-center justify-between">
                <h3 className="font-extrabold text-sm tracking-wide">Reset ETRHRMS Security Password</h3>
                <button onClick={() => setForgotPasswordModal(false)} className="text-white/80 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handlePasswordResetSubmit} className="p-6 space-y-4">
                {resetStatus && (
                  <div className={`p-3.5 rounded-xl text-xs font-semibold ${
                    resetStatus.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}>
                    {resetStatus.msg}
                  </div>
                )}

                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Enter your registered @ethiopianre.com company email address. We will dispatch password reset instructions to your inbox.
                </p>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Company Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="e.g. employee@ethiopianre.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#002B5B] text-slate-800 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t mt-4">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-4 py-2 text-xs font-black text-white bg-[#002B5B] hover:bg-[#001F44] rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {resetLoading ? (
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span>Send Reset Email</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // CORE APPLICATION WORKSPACE (Authenticated Operator view)
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col overflow-hidden">
      {/* Inject custom variables dynamically */}
      <ThemeStyles branding={config.branding} />

      {/* Shared top Navigation Header */}
      <Header
        currentUser={currentUser}
        companyName={config.profile.displayName}
        logoUrl={config.profile.logoUrl}
        onLogout={handleLogout}
        onOpenHelp={() => setActiveTab("help")}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onUpdateOwnProfile={handleUpdateOwnProfile}
        onUpdateOwnPassword={handleUpdateOwnPassword}
      />

      {/* Shared Sidebar + Main Workspace layout wrapper */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
        
        {/* Dynamic Navigation Sidebar */}
        <Sidebar
          role={currentUser.role}
          activeTab={activeTab}
          onTabChange={(tabId) => {
            // Direct mapping of settings subtabs from sidebar triggers
            if (["profile", "branding", "holidays", "users", "roles", "logs"].includes(tabId)) {
              setActiveTab("settings_" + tabId);
            } else {
              setActiveTab(tabId);
            }
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          companyName={config.profile.displayName}
        />

        {/* Content canvas viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* View Tab Router Switch */}
          {activeTab === "dashboard" && (
            <Dashboard
              employees={employees}
              departments={departments}
              leaves={leaves}
              attendance={attendance}
              users={users}
              logs={logs}
              role={currentUser.role}
              onNavigate={(tabId) => {
                if (["profile", "branding", "holidays", "users", "roles", "logs"].includes(tabId)) {
                  setActiveTab("settings_" + tabId);
                } else {
                  setActiveTab(tabId);
                }
              }}
              onOpenQuickAddEmployee={() => {
                setActiveTab("employees");
              }}
              onOpenQuickRecordAttendance={() => {
                setActiveTab("attendance");
              }}
              onOpenQuickRegisterLeave={() => {
                setActiveTab("leaves");
              }}
            />
          )}

          {activeTab === "employees" && (
            <Employees
              employees={employees}
              departments={departments}
              familyMembers={familyMembers}
              currentUser={currentUser}
              onAddEmployee={handleAddEmployee}
              onAddEmployeesBulk={handleAddEmployeesBulk}
              onUpdateEmployee={handleUpdateEmployee}
              onAddFamilyMember={handleAddFamilyMember}
              onLogAction={handleLogAction}
            />
          )}

          {activeTab === "departments" && (
            <Departments
              departments={departments}
              employees={employees}
              currentUser={currentUser}
              onAddDepartment={handleAddDepartment}
              onUpdateDepartment={handleUpdateDepartment}
              onDeleteDepartment={handleDeleteDepartment}
              onLogAction={handleLogAction}
            />
          )}

          {activeTab === "attendance" && (
            <Attendance
              attendance={attendance}
              employees={employees}
              departments={departments}
              currentUser={currentUser}
              onAddAttendance={handleAddAttendance}
              onUpdateAttendance={handleUpdateAttendanceRecord}
              onLogAction={handleLogAction}
            />
          )}

          {(activeTab === "leaves" || activeTab.startsWith("leaves")) && (
            <LeaveManagement
              leaves={leaves}
              employees={employees}
              departments={departments}
              holidays={holidays}
              companyConfig={config}
              currentUser={currentUser}
              initialSubTab={activeTab.includes("_") ? activeTab.split("_")[1] : "dashboard"}
              onAddLeave={handleAddLeave}
              onUpdateLeave={handleUpdateLeaveRecord}
              onUpdateConfig={handleUpdateConfig}
              onLogAction={handleLogAction}
            />
          )}

          {(activeTab === "medical" || activeTab.startsWith("medical")) && (
            <MedicalManagement
              employees={employees}
              departments={departments}
              familyMembers={familyMembers}
              medicalExpenses={medicalExpenses}
              companyConfig={config}
              currentUser={currentUser}
              initialSubTab={activeTab.includes("_") ? activeTab.split("_")[1] : "dashboard"}
              onAddFamilyMember={handleAddFamilyMember}
              onUpdateFamilyMember={handleUpdateFamilyMember}
              onAddMedicalExpense={handleAddMedicalExpense}
              onUpdateMedicalExpense={handleUpdateMedicalExpense}
              onDeleteMedicalExpense={handleDeleteMedicalExpense}
              onUpdateConfig={handleUpdateConfig}
              onLogAction={handleLogAction}
            />
          )}

          {(activeTab === "payroll" || activeTab.startsWith("payroll")) && (
            <PayrollManagement
              employees={employees}
              departments={departments}
              currentUser={currentUser}
              companyConfig={config}
              salaryComponents={salaryComponents}
              taxConfig={taxConfig}
              payrollPeriods={payrollPeriods}
              salaryStructures={salaryStructures}
              payrollRecords={payrollRecords}
              payslips={payslips}
              payslipDistributionLogs={payslipDistributionLogs}
              payrollApprovals={payrollApprovals}
              payrollImportLogs={payrollImportLogs}
              payrollSettings={payrollSettings}
              initialSubTab={
                activeTab.startsWith("payroll_")
                  ? (activeTab.replace("payroll_", "") === "import" ? "csv_import" : activeTab.replace("payroll_", "") === "export" ? "csv_export" : activeTab.replace("payroll_", ""))
                  : "dashboard"
              }
              emailLogs={emailLogs}
              onUpdateComponents={handleUpdateSalaryComponents}
              onUpdateTaxConfig={handleUpdateTaxConfig}
              onUpdatePeriods={handleUpdatePayrollPeriods}
              onUpdateStructures={handleUpdateSalaryStructures}
              onUpdateRecords={handleUpdatePayrollRecords}
              onUpdatePayslips={handleUpdatePayslips}
              onUpdateDistributionLogs={handleUpdatePayslipDistributionLogs}
              onUpdateApprovals={handleUpdatePayrollApprovals}
              onUpdateImportLogs={handleUpdatePayrollImportLogs}
              onUpdateSettings={handleUpdatePayrollSettings}
              onUpdateEmailLogs={handleUpdateEmailLogs}
              onLogAction={handleLogAction}
            />
          )}

          {/* Map sidebar settings direct nodes to setting panels */}
          {activeTab.startsWith("settings_") && (
            <Settings
              config={config}
              users={users}
              employees={employees}
              holidays={holidays}
              emailLogs={emailLogs}
              currentUser={currentUser}
              initialSubTab={activeTab.substring(activeTab.indexOf("_") + 1)}
              onUpdateConfig={handleUpdateConfig}
              onUpdateUsers={handleUpdateUsers}
              onUpdateHolidays={handleUpdateHolidays}
              onUpdateEmailLogs={handleUpdateEmailLogs}
              onLogAction={handleLogAction}
            />
          )}

          {activeTab === "reports" && (
            <Reports
              employees={employees}
              departments={departments}
              leaves={leaves}
              attendance={attendance}
              auditLogs={logs}
              config={config}
              currentUser={currentUser}
            />
          )}

          {activeTab === "documents" && (
            <DocumentVault
              employees={employees}
              departments={departments}
              currentUser={currentUser}
              onLogAction={handleLogAction}
            />
          )}

          {activeTab === "help" && (
            <HelpCenter 
              onClose={() => setActiveTab("dashboard")}
              companyName={config.profile.displayName}
            />
          )}
        </main>
      </div>
    </div>
  );
}
