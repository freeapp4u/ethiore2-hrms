import { User, Department, Employee, AttendanceRecord, LeaveRecord, PublicHoliday, CompanyConfig, ActivityLog, FamilyMember, MedicalExpense } from "./types";

export const DEFAULT_USERS: User[] = [
  {
    id: "U001",
    fullName: "Admin Ethio-Re",
    email: "admin@ethio-re.com",
    password: "admin123",
    role: "Administrator",
    status: "Active",
    createdDate: "2026-01-01",
    lastLogin: "2026-09-04 08:30:00",
    emailVerified: true
  },
  {
    id: "U002",
    fullName: "HR Officer Ethio-Re",
    email: "hr@ethio-re.com",
    password: "hr123",
    role: "HR Officer",
    status: "Active",
    createdDate: "2026-01-02",
    lastLogin: "2026-09-04 09:00:00",
    emailVerified: true
  },
  {
    id: "U003",
    fullName: "Tesfaye Teklu (Admin)",
    email: "contactesfaye@gmail.com",
    password: "admin123",
    role: "Administrator",
    status: "Active",
    createdDate: "2026-09-04",
    lastLogin: "",
    emailVerified: true
  }
];

export const DEFAULT_DEPARTMENTS: Department[] = [
  {
    id: "HRAD",
    name: "Human Resource & Administration",
    code: "HRAD",
    description: "Manages personnel, payroll, administrative affairs, and general operations.",
    status: "Active",
    createdDate: "2026-01-01",
    updatedDate: "2026-01-01"
  },
  {
    id: "REOP",
    name: "Reinsurance Operations",
    code: "REOP",
    description: "Core reinsurance underwriting, claims management, and actuarial services.",
    status: "Active",
    createdDate: "2026-01-01",
    updatedDate: "2026-01-01"
  },
  {
    id: "FIAC",
    name: "Finance & Accounts",
    code: "FIAC",
    description: "Financial planning, general ledger accounting, investments, and treasury.",
    status: "Active",
    createdDate: "2026-01-01",
    updatedDate: "2026-01-01"
  },
  {
    id: "INFOTECH",
    name: "Information Technology",
    code: "INFOTECH",
    description: "Supports digital infrastructure, software development, database maintenance, and security.",
    status: "Active",
    createdDate: "2026-01-01",
    updatedDate: "2026-01-01"
  }
];

export const DEFAULT_EMPLOYEES: Employee[] = [];

export const DEFAULT_HOLIDAYS: PublicHoliday[] = [
  { id: "H001", name: "Ethiopian New Year (Enkutatash)", date: "2026-09-11" },
  { id: "H002", name: "Finding of the True Cross (Meskel)", date: "2026-09-27" },
  { id: "H003", name: "Ethiopian Christmas (Genna)", date: "2026-01-07" },
  { id: "H004", name: "Timkat (Ethiopian Epiphany)", date: "2026-01-19" },
  { id: "H005", name: "Adwa Victory Day", date: "2026-03-02" },
  { id: "H006", name: "Ethiopian Good Friday (Siklet)", date: "2026-04-10" },
  { id: "H007", name: "Ethiopian Easter (Fasika)", date: "2026-04-12" }
];

export const DEFAULT_ATTENDANCE: AttendanceRecord[] = [];

export const DEFAULT_LEAVES: LeaveRecord[] = [];

export const DEFAULT_COMPANY_CONFIG: CompanyConfig = {
  profile: {
    displayName: "Ethiopian Reinsurance S.C.",
    legalName: "Ethiopian Reinsurance Share Company",
    shortName: "Ethio-Re",
    logoUrl: "", // Defaults to clean vector representation of Ethio-Re (a majestic circular golden-shield design)
    email: "info@ethiopianre.com",
    phoneNumber: "+251-115-575757",
    website: "https://www.ethiopianre.com",
    address: "Africa Avenue, Kirkos Sub-City, Woreda 01",
    city: "Addis Ababa",
    country: "Ethiopia",
    description: "The first reinsurance company in Ethiopia, serving as a reliable financial shock absorber and capacity builder."
  },
  branding: {
    primaryColor: "#002B5B", // High Density Navy
    secondaryColor: "#001F44", // High Density Dark Navy
    accentColor: "#D4AF37" // Warm gold
  },
  leaveAllocations: {
    "Annual Leave": 30,
    "Sick Leave": 15,
    "Maternity Leave": 90,
    "Paternity Leave": 5,
    "Compassionate Leave": 7,
    "Unpaid Leave": 30,
    "Other Leave": 10
  },
  leaveTypesConfig: [
    {
      id: "LT001",
      name: "Annual Leave",
      code: "AL",
      description: "Paid statutory vacation leave for rest and recreation.",
      annualEntitlement: 30,
      isPaid: true,
      accrualRule: "Annual",
      carryForwardEligible: true,
      maxCarryForwardDays: 10,
      expirationPeriodMonths: 12,
      requiresSupportingDocument: false,
      status: "Active"
    },
    {
      id: "LT002",
      name: "Sick Leave",
      code: "SL",
      description: "Paid leave for medical recovery, treatment, or illness.",
      annualEntitlement: 15,
      isPaid: true,
      accrualRule: "Immediate",
      carryForwardEligible: false,
      maxCarryForwardDays: 0,
      expirationPeriodMonths: 12,
      requiresSupportingDocument: true,
      status: "Active"
    },
    {
      id: "LT003",
      name: "Maternity Leave",
      code: "ML",
      description: "Fully paid maternity leave for female employees upon childbirth.",
      annualEntitlement: 90,
      isPaid: true,
      accrualRule: "Immediate",
      carryForwardEligible: false,
      maxCarryForwardDays: 0,
      expirationPeriodMonths: 12,
      requiresSupportingDocument: true,
      status: "Active"
    },
    {
      id: "LT004",
      name: "Paternity Leave",
      code: "PL",
      description: "Paid leave for male employees upon the birth of a child.",
      annualEntitlement: 5,
      isPaid: true,
      accrualRule: "Immediate",
      carryForwardEligible: false,
      maxCarryForwardDays: 0,
      expirationPeriodMonths: 12,
      requiresSupportingDocument: true,
      status: "Active"
    },
    {
      id: "LT005",
      name: "Compassionate Leave",
      code: "CL",
      description: "Paid leave for bereavement or family emergency.",
      annualEntitlement: 7,
      isPaid: true,
      accrualRule: "Immediate",
      carryForwardEligible: false,
      maxCarryForwardDays: 0,
      expirationPeriodMonths: 12,
      requiresSupportingDocument: false,
      status: "Active"
    },
    {
      id: "LT006",
      name: "Unpaid Leave",
      code: "UL",
      description: "Approved leave of absence without remuneration.",
      annualEntitlement: 30,
      isPaid: false,
      accrualRule: "Immediate",
      carryForwardEligible: false,
      maxCarryForwardDays: 0,
      expirationPeriodMonths: 12,
      requiresSupportingDocument: false,
      status: "Active"
    },
    {
      id: "LT007",
      name: "Other Leave",
      code: "OL",
      description: "Special discretionary leave authorized by executive HR management.",
      annualEntitlement: 10,
      isPaid: true,
      accrualRule: "Immediate",
      carryForwardEligible: false,
      maxCarryForwardDays: 0,
      expirationPeriodMonths: 12,
      requiresSupportingDocument: false,
      status: "Active"
    }
  ],
  leaveYearConfig: {
    id: "LY2026",
    yearName: "2026",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    isCustomYear: false,
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    status: "Active",
    processedYearEnd: false
  },
  medicalPolicyConfig: {
    defaultFamilyAllocationETB: 100000,
    employeeAllocationUnlimited: true,
    requiresInvoiceNumber: true,
    currencySymbol: "ETB"
  }
};

export const DEFAULT_FAMILY_MEMBERS: FamilyMember[] = [];

export const DEFAULT_MEDICAL_EXPENSES: MedicalExpense[] = [];

export const DEFAULT_ACTIVITY_LOGS: ActivityLog[] = [];
