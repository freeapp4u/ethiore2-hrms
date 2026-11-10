import { 
  User, Department, Employee, AttendanceRecord, LeaveRecord, PublicHoliday, 
  CompanyConfig, ActivityLog, FamilyMember, MedicalExpense,
  SalaryComponent, PayrollPeriod, EmployeeSalaryStructure, PayrollRecord, 
  PayrollApproval, Payslip, PayslipDistributionLog, PayrollImportLog, PayrollSettings,
  EmailActivityLog
} from "./types";

export const DEFAULT_USERS: User[] = [
  {
    id: "U001",
    fullName: "Tesfaye Teklu (Admin)",
    email: "contactesfaye@gmail.com",
    password: "admin123",
    role: "Administrator",
    status: "Active",
    createdDate: "2026-01-01",
    lastLogin: "2026-09-04 08:30:00",
    emailVerified: true
  },
  {
    id: "U002",
    fullName: "Tesfaye Teklu Feyissa",
    email: "tesfayeteklufeyissa@gmail.com",
    password: "admin123",
    role: "Administrator",
    status: "Active",
    createdDate: "2026-01-01",
    lastLogin: "2026-09-04 08:30:00",
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
  },
  emailSettings: {
    enableEmployeeEmails: true,
    smtpHost: "mail.ethiopianre.com",
    smtpPort: 587,
    smtpUser: "notifications@ethiopianre.com",
    smtpSenderEmail: "noreply@ethiopianre.com",
    smtpSenderName: "Ethiopian Reinsurance HRMS",
    useTlsSsl: true,
    updatedBy: "contactesfaye@gmail.com",
    updatedDate: "2026-01-01"
  }
};

export const DEFAULT_FAMILY_MEMBERS: FamilyMember[] = [];

export const DEFAULT_MEDICAL_EXPENSES: MedicalExpense[] = [];

export const DEFAULT_ACTIVITY_LOGS: ActivityLog[] = [];

export const DEFAULT_EMAIL_LOGS: EmailActivityLog[] = [
  {
    id: "EMAIL_LOG_INIT_1",
    recipientEmployeeId: "EMP_001",
    recipientEmail: "almaz.bekele@ethiopianre.com",
    subject: "Payslip Statement - January 2026",
    sendingModule: "Payslip Distribution",
    dateTime: "2026-01-28 14:30:00",
    deliveryStatus: "Sent",
    triggeredBy: "contactesfaye@gmail.com"
  }
];

// ==========================================
// DEFAULT PAYROLL INITIAL DATASET
// ==========================================

export const DEFAULT_SALARY_COMPONENTS: SalaryComponent[] = [
  // EARNINGS
  {
    id: "SC_BS",
    name: "Basic Salary",
    code: "BS",
    type: "Earning",
    calculationMethod: "Based on Basic Salary",
    calculationValue: 100,
    isTaxable: true,
    isPensionable: true,
    effectiveDate: "2026-01-01",
    status: "Active",
    description: "Contractual base monthly remuneration.",
    isSystemDefault: true
  },
  {
    id: "SC_PA",
    name: "Position Allowance",
    code: "PA",
    type: "Earning",
    calculationMethod: "Fixed Amount",
    calculationValue: 0,
    isTaxable: true,
    isPensionable: false,
    effectiveDate: "2026-01-01",
    status: "Active",
    description: "Allowance attached to managerial and technical position rank.",
    isSystemDefault: true
  },
  {
    id: "SC_TA",
    name: "Transport Allowance",
    code: "TA",
    type: "Earning",
    calculationMethod: "Fixed Amount",
    calculationValue: 0,
    isTaxable: true,
    isPensionable: false,
    taxExemptLimitETB: 2200,
    effectiveDate: "2026-01-01",
    status: "Active",
    description: "Monthly transport allowance (Tax-exempt up to 1/4 basic salary or 2,200 ETB cap).",
    isSystemDefault: true
  },
  {
    id: "SC_HA",
    name: "Housing Allowance",
    code: "HA",
    type: "Earning",
    calculationMethod: "Fixed Amount",
    calculationValue: 0,
    isTaxable: true,
    isPensionable: false,
    effectiveDate: "2026-01-01",
    status: "Active",
    description: "Monthly housing/accommodation subsidy.",
    isSystemDefault: true
  },
  {
    id: "SC_RA",
    name: "Responsibility Allowance",
    code: "RA",
    type: "Earning",
    calculationMethod: "Fixed Amount",
    calculationValue: 0,
    isTaxable: true,
    isPensionable: false,
    effectiveDate: "2026-01-01",
    status: "Active",
    description: "Allowance for key organizational leadership responsibilities.",
    isSystemDefault: true
  },
  {
    id: "SC_TEL",
    name: "Telephone Allowance",
    code: "TEL",
    type: "Earning",
    calculationMethod: "Fixed Amount",
    calculationValue: 0,
    isTaxable: true,
    isPensionable: false,
    effectiveDate: "2026-01-01",
    status: "Active",
    description: "Monthly communication allowance.",
    isSystemDefault: true
  },
  {
    id: "SC_OT",
    name: "Overtime",
    code: "OT",
    type: "Earning",
    calculationMethod: "Fixed Amount",
    calculationValue: 0,
    isTaxable: true,
    isPensionable: false,
    effectiveDate: "2026-01-01",
    status: "Active",
    description: "Overtime hours remuneration calculated under labor legislation.",
    isSystemDefault: true
  },
  {
    id: "SC_OA",
    name: "Other Allowances",
    code: "OA",
    type: "Earning",
    calculationMethod: "Fixed Amount",
    calculationValue: 0,
    isTaxable: true,
    isPensionable: false,
    effectiveDate: "2026-01-01",
    status: "Active",
    description: "Discretionary or project-specific earnings.",
    isSystemDefault: true
  },
  // DEDUCTIONS
  {
    id: "SC_PIT",
    name: "Employment Income Tax",
    code: "PIT",
    type: "Deduction",
    calculationMethod: "Formula-Based",
    calculationValue: 0,
    isTaxable: false,
    isPensionable: false,
    effectiveDate: "2026-01-01",
    status: "Active",
    description: "Statutory Ethiopian progressive employment income tax.",
    isSystemDefault: true
  },
  {
    id: "SC_PEN_EE",
    name: "Employee Pension Contribution",
    code: "PEN_EE",
    type: "Deduction",
    calculationMethod: "Based on Basic Salary",
    calculationValue: 7, // 7%
    isTaxable: false,
    isPensionable: true,
    effectiveDate: "2026-01-01",
    status: "Active",
    description: "Statutory 7% employee pension contribution withheld from basic salary.",
    isSystemDefault: true
  },
  {
    id: "SC_LOAN",
    name: "Loan Repayment",
    code: "LOAN",
    type: "Deduction",
    calculationMethod: "Fixed Amount",
    calculationValue: 0,
    isTaxable: false,
    isPensionable: false,
    effectiveDate: "2026-01-01",
    status: "Active",
    description: "Monthly staff salary advance or credit loan installment.",
    isSystemDefault: true
  },
  {
    id: "SC_OD",
    name: "Other Deductions",
    code: "OD",
    type: "Deduction",
    calculationMethod: "Fixed Amount",
    calculationValue: 0,
    isTaxable: false,
    isPensionable: false,
    effectiveDate: "2026-01-01",
    status: "Active",
    description: "Miscellaneous authorized staff deductions.",
    isSystemDefault: true
  }
];

export const DEFAULT_PAYROLL_PERIODS: PayrollPeriod[] = [
  {
    id: "PP_2026_01",
    periodName: "January 2026",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    paymentDate: "2026-01-28",
    status: "Open",
    createdBy: "contactesfaye@gmail.com",
    createdDate: "2026-01-01"
  },
  {
    id: "PP_2026_02",
    periodName: "February 2026",
    startDate: "2026-02-01",
    endDate: "2026-02-28",
    paymentDate: "2026-02-26",
    status: "Open",
    createdBy: "contactesfaye@gmail.com",
    createdDate: "2026-02-01"
  }
];

export const DEFAULT_EMPLOYEE_SALARY_STRUCTURES: EmployeeSalaryStructure[] = [];

export const DEFAULT_PAYROLL_RECORDS: PayrollRecord[] = [];

export const DEFAULT_PAYROLL_APPROVALS: PayrollApproval[] = [];

export const DEFAULT_PAYSLIPS: Payslip[] = [];

export const DEFAULT_PAYSLIP_DISTRIBUTION_LOGS: PayslipDistributionLog[] = [];

export const DEFAULT_PAYROLL_IMPORT_LOGS: PayrollImportLog[] = [];

export const DEFAULT_PAYROLL_SETTINGS: PayrollSettings = {
  id: "PAYROLL_SETTINGS_MAIN",
  companyName: "Ethiopian Reinsurance S.C.",
  currency: "ETB",
  autoEmailPayslipsOnApproval: true,
  updatedBy: "contactesfaye@gmail.com",
  updatedDate: "2026-01-01"
};

