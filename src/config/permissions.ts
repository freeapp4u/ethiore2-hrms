export interface ModuleConfig {
  id: string;
  name: string;
  icon: string;
  submenus: { id: string; name: string }[];
}

export const APP_MODULES: ModuleConfig[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: "LayoutDashboard",
    submenus: []
  },
  {
    id: "employees",
    name: "Employee Master",
    icon: "Users",
    submenus: [
      { id: "directory", name: "Employee Directory" },
      { id: "enrollment", name: "Employee Enrollment" },
      { id: "bulk_import", name: "Bulk Import" }
    ]
  },
  {
    id: "departments",
    name: "Department Admin",
    icon: "Landmark",
    submenus: []
  },
  {
    id: "leaves",
    name: "Leave Management",
    icon: "CalendarDays",
    submenus: [
      { id: "dashboard", name: "Leave Dashboard" },
      { id: "applications", name: "Leave Applications" },
      { id: "balances", name: "Leave Balances" },
      { id: "calendar", name: "Leave Calendar" },
      { id: "config", name: "Leave Configuration" },
      { id: "reports", name: "Leave Reports" }
    ]
  },
  {
    id: "attendance",
    name: "Attendance",
    icon: "Clock",
    submenus: []
  },
  {
    id: "medical",
    name: "Benefits & Medical",
    icon: "HeartPulse",
    submenus: [
      { id: "dashboard", name: "Medical Dashboard" },
      { id: "claims", name: "Expense Claims" },
      { id: "family", name: "Family Members" },
      { id: "policy", name: "Policy Settings" },
      { id: "reports", name: "Medical Reports" }
    ]
  },
  {
    id: "payroll",
    name: "Payroll",
    icon: "DollarSign",
    submenus: [
      { id: "dashboard", name: "Payroll Dashboard" },
      { id: "config", name: "Statutory Rules" },
      { id: "salary_setup", name: "Salary Setup" },
      { id: "processing", name: "Payroll Processing" },
      { id: "approval", name: "Payroll Approval" },
      { id: "payslips", name: "Payslip Management" },
      { id: "csv_import", name: "CSV Import" },
      { id: "csv_export", name: "CSV Export" },
      { id: "reports", name: "Payroll Reports" },
      { id: "history", name: "Payroll History" }
    ]
  },
  {
    id: "documents",
    name: "Document Vault",
    icon: "FileText",
    submenus: []
  },
  {
    id: "reports",
    name: "Reports",
    icon: "FileSpreadsheet",
    submenus: []
  },
  {
    id: "settings",
    name: "Administration",
    icon: "Settings",
    submenus: [
      { id: "profile", name: "Company Profile" },
      { id: "branding", name: "System Branding" },
      { id: "holidays", name: "Public Holidays" },
      { id: "users", name: "User Management" },
      { id: "roles", name: "Roles & Permissions" },
      { id: "email", name: "Email Settings" },
      { id: "logs", name: "Audit Logs" }
    ]
  },
  {
    id: "help",
    name: "Help Center",
    icon: "Info",
    submenus: []
  }
];

export const DEFAULT_ACTIONS = {
  view: false,
  create: false,
  edit: false,
  delete: false,
  approve: false,
  export: false
};
