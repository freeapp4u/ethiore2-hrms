export type UserRole = "Administrator" | "HR Officer" | "Auditor";
export type AccountStatus = "Active" | "Inactive" | "Suspended" | "Pending Verification";
export type EmploymentStatus = "Active" | "Inactive";
export type AttendanceStatus = "Present" | "Absent" | "Late" | "On Leave" | "Half Day" | "Other";
export type LeaveStatus = "Active" | "Completed" | "Cancelled";

export interface User {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
  status: AccountStatus;
  employeeId?: string; // Optional reference linking system user to Employee Master
  createdDate: string;
  lastLogin?: string;
  emailVerified?: boolean;
}

export interface Department {
  id: string; // Same as code, or auto-id
  name: string;
  code: string;
  description: string;
  status: "Active" | "Inactive";
  headEmployeeId?: string; // Optional reference to Employee Master for Department Head
  parentDepartmentId?: string; // Optional reference to Department Admin for Parent Department
  createdDate: string;
  updatedDate: string;
}

export interface Employee {
  employeeId: string; // Unique
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  gender: "Male" | "Female";
  dob: string; // YYYY-MM-DD
  email: string;
  phoneNumber: string;
  altPhoneNumber?: string;
  address: string;
  departmentId: string; // references Department.id
  position: string; // Job title
  employmentType: "Permanent" | "Contract" | "Temporary" | "Intern";
  hireDate: string; // YYYY-MM-DD
  status: EmploymentStatus;
  category?: string;
  createdDate: string;
  createdBy: string;
  updatedDate: string;
  updatedBy: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string; // references Employee.employeeId
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:MM
  checkOutTime: string; // HH:MM
  status: AttendanceStatus;
  workingHours: number;
  lateStatus: "Yes" | "No";
  remarks: string;
  recordedBy: string; // Name/Email of HR Officer/Admin
  createdDate: string;
  updatedDate: string;
}

export interface LeaveRecord {
  id: string;
  employeeId: string; // references Employee.employeeId
  leaveType: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  isHalfDay?: boolean;
  halfDayPeriod?: "Morning" | "Afternoon";
  reason: string;
  status: LeaveStatus;
  remarks: string;
  supportingDocumentUrl?: string;
  recordedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface LeaveTypeConfig {
  id: string;
  name: string;
  code: string;
  description: string;
  annualEntitlement: number;
  isPaid: boolean;
  accrualRule: "Annual" | "Monthly" | "Immediate";
  carryForwardEligible: boolean;
  maxCarryForwardDays: number;
  expirationPeriodMonths: number; // 0 = never, 6, 12, 24
  requiresSupportingDocument: boolean;
  status: "Active" | "Inactive";
}

export interface LeaveYearConfig {
  id: string;
  yearName: string; // e.g. "2026"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isCustomYear: boolean;
  workingDays: string[]; // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri"]
  status: "Active" | "Closed" | "Archived";
  processedYearEnd?: boolean;
  processedDate?: string;
  processedBy?: string;
}

export interface EmployeeLeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveYear: string; // e.g. "2026"
  openingBalance: number;
  annualEntitlement: number;
  carriedForwardBalance: number;
  leaveUtilized: number;
  expiredLeave: number;
  remainingBalance: number;
  expirationDate?: string;
  upcomingExpiringDays?: number;
  lastUpdated: string;
}

export interface LeaveBalanceAdjustment {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveYear: string;
  adjustmentType: "Manual Adjustment" | "Year-End Carry Forward" | "Expiration" | "System Reset";
  amount: number; // positive or negative
  previousRemaining: number;
  newRemaining: number;
  reason: string;
  performedBy: string;
  timestamp: string;
}

export interface YearEndProcessingRecord {
  id: string;
  fromYear: string;
  toYear: string;
  processedDate: string;
  processedBy: string;
  totalEmployeesProcessed: number;
  totalCarriedForwardDays: number;
  totalExpiredDays: number;
  details: {
    employeeId: string;
    employeeName: string;
    departmentName: string;
    leaveType: string;
    prevOpening: number;
    entitlement: number;
    utilized: number;
    unused: number;
    eligibleCarryForward: number;
    expired: number;
    newOpening: number;
  }[];
}

export interface PublicHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
}

export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface CompanyProfile {
  displayName: string;
  legalName: string;
  shortName: string;
  logoUrl: string; // base64 or empty
  email: string;
  phoneNumber: string;
  website: string;
  address: string;
  city: string;
  country: string;
  description: string;
}

export interface EmailSettingsConfig {
  enableEmployeeEmails: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpSenderEmail: string;
  smtpSenderName: string;
  useTlsSsl: boolean;
  updatedBy?: string;
  updatedDate?: string;
}

export interface EmailActivityLog {
  id: string;
  recipientEmployeeId?: string;
  recipientEmail: string;
  subject: string;
  sendingModule: string;
  dateTime: string;
  deliveryStatus: "Sent" | "Failed" | "Blocked – Email Sending Disabled";
  failureReason?: string;
  triggeredBy: string;
}

export interface CompanyConfig {
  profile: CompanyProfile;
  branding: BrandingConfig;
  leaveAllocations: { [leaveType: string]: number };
  leaveTypesConfig?: LeaveTypeConfig[];
  leaveYearConfig?: LeaveYearConfig;
  medicalPolicyConfig?: MedicalPolicyConfig;
  emailSettings?: EmailSettingsConfig;
}

export type RelationshipType = "Spouse" | "Child" | "Parent" | "Dependent" | "Other";

export interface FamilyMember {
  id: string;
  employeeId: string; // references Employee.employeeId
  fullName: string;
  relationship: RelationshipType;
  gender: "Male" | "Female";
  dob: string; // YYYY-MM-DD
  phoneNumber?: string;
  medicalEligibility: boolean;
  status: "Active" | "Inactive";
  createdDate: string;
  updatedDate: string;
}

export interface MedicalExpense {
  id: string;
  employeeId: string; // references Employee.employeeId
  employeeName: string;
  beneficiaryType: "Employee" | "Family Member";
  familyMemberId?: string; // references FamilyMember.id if Family Member
  beneficiaryName: string;
  relationship: "Self" | RelationshipType;
  medicalService: string; // Description of medical service or expense
  facilityName: string; // Hospital or clinic name
  expenseDate: string; // YYYY-MM-DD
  invoiceNumber: string;
  amountETB: number;
  supportingDocumentUrl?: string;
  remarks?: string;
  recordedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface MedicalPolicyConfig {
  defaultFamilyAllocationETB: number; // Default 100,000 ETB aggregate allocation per employee
  employeeAllocationUnlimited: boolean; // true
  requiresInvoiceNumber: boolean;
  currencySymbol: string; // "ETB"
  updatedBy?: string;
  updatedDate?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userRole: string;
  module: string;
  action: string;
  recordEntity: string;
  details: string;
}

// ==========================================
// PAYROLL MANAGEMENT MODULE TYPES
// ==========================================

export type ComponentType = "Earning" | "Deduction";
export type CalculationMethod = "Fixed Amount" | "Percentage" | "Formula-Based" | "Based on Basic Salary";
export type PayrollPeriodStatus = "Open" | "Calculated" | "Submitted" | "Approved" | "Closed" | "Locked";
export type ApprovalStatus = "Draft" | "Calculated" | "Submitted" | "Approved" | "Rejected" | "Reopened";

export interface SalaryComponent {
  id: string;
  name: string; // e.g. "Basic Salary", "Position Allowance", "Transport Allowance"
  code: string; // e.g. "BS", "PA", "TA", "PIT", "PEN_EE"
  type: ComponentType;
  calculationMethod: CalculationMethod;
  calculationValue: number; // default rate or amount
  isTaxable: boolean;
  isPensionable: boolean;
  taxExemptLimitETB?: number; // max tax exempt portion in ETB
  effectiveDate: string; // YYYY-MM-DD
  status: "Active" | "Inactive";
  description: string;
  isSystemDefault?: boolean;
}

export interface TaxBracket {
  id: string;
  minIncome: number;
  maxIncome: number | null; // null for upper threshold (> 10,900 ETB)
  taxRate: number; // e.g. 0, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35
  deductionETB: number; // Tax formula deduction offset in ETB
}

export interface TaxConfiguration {
  id: string;
  taxBrackets: TaxBracket[];
  employeePensionRate: number; // 0.07 (7%)
  employerPensionRate: number; // 0.11 (11%)
  transportTaxExemptLimit: number; // 2200 ETB or max threshold
  effectiveDate: string;
  status: "Active" | "Historical";
  updatedBy: string;
  updatedDate: string;
}

export interface PayrollPeriod {
  id: string;
  periodName: string; // e.g. "January 2026"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  paymentDate: string; // YYYY-MM-DD
  status: PayrollPeriodStatus;
  createdBy: string;
  createdDate: string;
  approvedBy?: string;
  approvedDate?: string;
  approvalComments?: string;
}

export interface SalaryRevision {
  id: string;
  basicSalary: number;
  positionAllowance: number;
  effectiveDate: string;
  reason: string;
  updatedBy: string;
  updatedDate: string;
}

export interface EmployeeSalaryStructure {
  id: string;
  employeeId: string; // references Employee.employeeId
  basicSalary: number;
  salaryGrade?: string;
  positionAllowance: number;
  transportAllowance: number;
  housingAllowance: number;
  responsibilityAllowance: number;
  telephoneAllowance: number;
  overtimeAmount: number;
  otherEarnings: number;
  recurringDeductions: { [componentCode: string]: number }; // Loan, Other Deductions, etc.
  isPensionEligible: boolean;
  effectiveDate: string;
  updatedBy: string;
  updatedDate: string;
  revisionHistory?: SalaryRevision[];
}

export interface PayrollRecord {
  id: string;
  payrollPeriodId: string;
  payrollPeriodName: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  position: string;
  basicSalary: number;
  positionAllowance: number;
  transportAllowance: number;
  housingAllowance: number;
  responsibilityAllowance: number;
  telephoneAllowance: number;
  overtime: number;
  otherEarnings: number;
  grossSalary: number;
  taxableEarnings: number;
  taxExemptEarnings: number;
  incomeTax: number;
  employeePension: number;
  loanDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  employerPension: number; // Calculated separately, NOT deducted from employee net salary
  status: PayrollPeriodStatus;
  isImported?: boolean;
  calculatedDate: string;
  calculatedBy: string;
}

export interface Payslip {
  id: string;
  payslipRefNo: string;
  payrollPeriodId: string;
  payrollPeriodName: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  paymentDate: string;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  employerPension: number;
  earningsBreakdown: { name: string; amount: number }[];
  deductionsBreakdown: { name: string; amount: number }[];
  generatedDate: string;
  generatedBy: string;
}

export interface PayslipDistributionLog {
  id: string;
  employeeId: string;
  employeeName: string;
  recipientEmail: string;
  payrollPeriodId: string;
  payrollPeriodName: string;
  sendingDate: string;
  deliveryStatus: "Sent" | "Failed" | "Pending";
  errorDetails?: string;
  sentBy: string;
}

export interface PayrollApproval {
  id: string;
  payrollPeriodId: string;
  periodName: string;
  submittedBy: string;
  submittedDate: string;
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalEmployerPension: number;
  status: ApprovalStatus;
  actionBy?: string;
  actionDate?: string;
  comments?: string;
}

export interface PayrollImportError {
  rowNumber: number;
  employeeId: string;
  errorMessage: string;
}

export interface PayrollImportLog {
  id: string;
  filename: string;
  importMode: "Salary Structure" | "Monthly Payroll";
  payrollPeriod: string;
  totalRows: number;
  successfulRows: number;
  skippedRows: number;
  failedRows: number;
  timestamp: string;
  importedBy: string;
  errors: PayrollImportError[];
}

export interface PayrollSettings {
  id: string;
  companyName: string;
  currency: string;
  autoEmailPayslipsOnApproval: boolean;
  updatedBy: string;
  updatedDate: string;
}
