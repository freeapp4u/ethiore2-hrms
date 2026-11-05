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
  reason: string;
  status: LeaveStatus;
  remarks: string;
  recordedBy: string;
  createdDate: string;
  updatedDate: string;
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
