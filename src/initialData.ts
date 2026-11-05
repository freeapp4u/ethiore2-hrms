import { User, Department, Employee, AttendanceRecord, LeaveRecord, PublicHoliday, CompanyConfig, ActivityLog } from "./types";

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

export const DEFAULT_EMPLOYEES: Employee[] = [
  {
    employeeId: "EMP001",
    firstName: "Yonas",
    middleName: "Alula",
    lastName: "Wolde",
    fullName: "Yonas Alula Wolde",
    gender: "Male",
    dob: "1985-05-12",
    email: "yonas.alula@ethiopianre.com",
    phoneNumber: "+251-911-234567",
    address: "Bole Medhanialem, House 410, Addis Ababa",
    departmentId: "HRAD",
    position: "HR Manager",
    employmentType: "Permanent",
    hireDate: "2026-01-15",
    status: "Active",
    createdDate: "2026-01-15",
    createdBy: "admin@ethio-re.com",
    updatedDate: "2026-01-15",
    updatedBy: "admin@ethio-re.com"
  },
  {
    employeeId: "EMP002",
    firstName: "Selam",
    middleName: "Tesfaye",
    lastName: "Beyene",
    fullName: "Selam Tesfaye Beyene",
    gender: "Female",
    dob: "1990-08-22",
    email: "selam.tesfaye@ethiopianre.com",
    phoneNumber: "+251-912-876543",
    address: "Sarbet, Block 12, Addis Ababa",
    departmentId: "REOP",
    position: "Senior Underwriter",
    employmentType: "Permanent",
    hireDate: "2026-02-01",
    status: "Active",
    createdDate: "2026-02-01",
    createdBy: "admin@ethio-re.com",
    updatedDate: "2026-02-01",
    updatedBy: "admin@ethio-re.com"
  },
  {
    employeeId: "EMP003",
    firstName: "Abel",
    middleName: "Kebede",
    lastName: "Tessema",
    fullName: "Abel Kebede Tessema",
    gender: "Male",
    dob: "1993-01-15",
    email: "abel.kebede@ethiopianre.com",
    phoneNumber: "+251-920-112233",
    address: "Gerji, House 1022, Addis Ababa",
    departmentId: "INFOTECH",
    position: "System Administrator",
    employmentType: "Permanent",
    hireDate: "2026-03-10",
    status: "Active",
    createdDate: "2026-03-10",
    createdBy: "admin@ethio-re.com",
    updatedDate: "2026-03-10",
    updatedBy: "admin@ethio-re.com"
  },
  {
    employeeId: "EMP004",
    firstName: "Tigist",
    middleName: "Haile",
    lastName: "Mariam",
    fullName: "Tigist Haile Mariam",
    gender: "Female",
    dob: "1988-11-30",
    email: "tigist.haile@ethiopianre.com",
    phoneNumber: "+251-911-556677",
    address: "CMC, Villa 44, Addis Ababa",
    departmentId: "FIAC",
    position: "Chief Accountant",
    employmentType: "Permanent",
    hireDate: "2026-01-20",
    status: "Active",
    createdDate: "2026-01-20",
    createdBy: "admin@ethio-re.com",
    updatedDate: "2026-01-20",
    updatedBy: "admin@ethio-re.com"
  }
];

export const DEFAULT_HOLIDAYS: PublicHoliday[] = [
  { id: "H001", name: "Ethiopian New Year (Enkutatash)", date: "2026-09-11" },
  { id: "H002", name: "Finding of the True Cross (Meskel)", date: "2026-09-27" },
  { id: "H003", name: "Ethiopian Christmas (Genna)", date: "2026-01-07" },
  { id: "H004", name: "Timkat (Ethiopian Epiphany)", date: "2026-01-19" },
  { id: "H005", name: "Adwa Victory Day", date: "2026-03-02" },
  { id: "H006", name: "Ethiopian Good Friday (Siklet)", date: "2026-04-10" },
  { id: "H007", name: "Ethiopian Easter (Fasika)", date: "2026-04-12" }
];

export const DEFAULT_ATTENDANCE: AttendanceRecord[] = [
  // Yesterday's Records (2026-09-03)
  {
    id: "ATT001",
    employeeId: "EMP001",
    date: "2026-09-03",
    checkInTime: "08:12",
    checkOutTime: "17:05",
    status: "Present",
    workingHours: 8.5,
    lateStatus: "No",
    remarks: "Regular working hours",
    recordedBy: "hr@ethio-re.com",
    createdDate: "2026-09-03 17:10:00",
    updatedDate: "2026-09-03 17:10:00"
  },
  {
    id: "ATT002",
    employeeId: "EMP002",
    date: "2026-09-03",
    checkInTime: "",
    checkOutTime: "",
    status: "On Leave",
    workingHours: 0,
    lateStatus: "No",
    remarks: "Approved annual leave segment",
    recordedBy: "hr@ethio-re.com",
    createdDate: "2026-09-03 09:15:00",
    updatedDate: "2026-09-03 09:15:00"
  },
  {
    id: "ATT003",
    employeeId: "EMP003",
    date: "2026-09-03",
    checkInTime: "08:29",
    checkOutTime: "17:15",
    status: "Present",
    workingHours: 8.7,
    lateStatus: "No",
    remarks: "Regular working hours",
    recordedBy: "hr@ethio-re.com",
    createdDate: "2026-09-03 17:20:00",
    updatedDate: "2026-09-03 17:20:00"
  },
  {
    id: "ATT004",
    employeeId: "EMP004",
    date: "2026-09-03",
    checkInTime: "09:05",
    checkOutTime: "17:00",
    status: "Late",
    workingHours: 7.9,
    lateStatus: "Yes",
    remarks: "Late entry due to heavy traffic around CMC road",
    recordedBy: "hr@ethio-re.com",
    createdDate: "2026-09-03 17:15:00",
    updatedDate: "2026-09-03 17:15:00"
  },
  // Today's Records (2026-09-04)
  {
    id: "ATT005",
    employeeId: "EMP001",
    date: "2026-09-04",
    checkInTime: "08:15",
    checkOutTime: "",
    status: "Present",
    workingHours: 0,
    lateStatus: "No",
    remarks: "",
    recordedBy: "hr@ethio-re.com",
    createdDate: "2026-09-04 08:20:00",
    updatedDate: "2026-09-04 08:20:00"
  },
  {
    id: "ATT006",
    employeeId: "EMP002",
    date: "2026-09-04",
    checkInTime: "",
    checkOutTime: "",
    status: "On Leave",
    workingHours: 0,
    lateStatus: "No",
    remarks: "Annual Leave",
    recordedBy: "hr@ethio-re.com",
    createdDate: "2026-09-04 08:00:00",
    updatedDate: "2026-09-04 08:00:00"
  },
  {
    id: "ATT007",
    employeeId: "EMP003",
    date: "2026-09-04",
    checkInTime: "08:20",
    checkOutTime: "",
    status: "Present",
    workingHours: 0,
    lateStatus: "No",
    remarks: "",
    recordedBy: "hr@ethio-re.com",
    createdDate: "2026-09-04 08:25:00",
    updatedDate: "2026-09-04 08:25:00"
  }
];

export const DEFAULT_LEAVES: LeaveRecord[] = [
  {
    id: "L001",
    employeeId: "EMP002",
    leaveType: "Annual Leave",
    startDate: "2026-09-01",
    endDate: "2026-09-04",
    daysCount: 4,
    reason: "Rest and recreation with family.",
    status: "Active",
    remarks: "Authorized full coverage",
    recordedBy: "hr@ethio-re.com",
    createdDate: "2026-08-25 10:00:00",
    updatedDate: "2026-08-25 10:00:00"
  }
];

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
    "Bereavement Leave": 7,
    "Study Leave": 45,
    "Unpaid Leave": 30
  }
};

export const DEFAULT_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: "LOG001",
    timestamp: "2026-09-04 08:30:00",
    userId: "U001",
    userEmail: "admin@ethio-re.com",
    userRole: "Administrator",
    module: "Auth",
    action: "User Login",
    recordEntity: "admin@ethio-re.com",
    details: "Administrator logged in from security endpoint."
  },
  {
    id: "LOG002",
    timestamp: "2026-09-04 09:00:00",
    userId: "U002",
    userEmail: "hr@ethio-re.com",
    userRole: "HR Officer",
    module: "Auth",
    action: "User Login",
    recordEntity: "hr@ethio-re.com",
    details: "HR Officer logged in."
  }
];
