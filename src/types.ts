export type UserRole = "Administrator" | "HR Officer";
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

export interface CompanyConfig {
  profile: CompanyProfile;
  branding: BrandingConfig;
  leaveAllocations: { [leaveType: string]: number };
  leaveTypesConfig?: LeaveTypeConfig[];
  leaveYearConfig?: LeaveYearConfig;
  medicalPolicyConfig?: MedicalPolicyConfig;
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
