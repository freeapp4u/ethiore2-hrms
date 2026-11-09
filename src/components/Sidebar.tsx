import { 
  LayoutDashboard, UserCheck, CalendarDays,
  BarChart3, Users, Landmark, FileText, Palette, Calendar, 
  Users2, ShieldCheck, History, ChevronDown, ChevronRight, X, FolderOpen, HeartPulse, DollarSign, Mail
} from "lucide-react";
import { useState } from "react";
import { UserRole } from "../types";

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
}

export default function Sidebar({
  role,
  activeTab,
  onTabChange,
  isOpen,
  onClose,
}: SidebarProps) {
  const [leaveExpanded, setLeaveExpanded] = useState(true);
  const [medicalExpanded, setMedicalExpanded] = useState(true);
  const [payrollExpanded, setPayrollExpanded] = useState(() => activeTab.startsWith("payroll"));
  const [settingsExpanded, setSettingsExpanded] = useState(true);
  const [adminExpanded, setAdminExpanded] = useState(true);

  // Auto-expand payroll accordion when activeTab starts with payroll
  if (activeTab.startsWith("payroll") && !payrollExpanded) {
    setPayrollExpanded(true);
  }

  const navigateTo = (tabId: string) => {
    onTabChange(tabId);
    // Auto close on mobile
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const navItemClass = (tabId: string) => {
    const isActive = activeTab === tabId;
    return `w-full text-left py-2.5 flex items-center gap-3 text-xs font-semibold tracking-wide transition-all ${
      isActive 
        ? "bg-accent-custom/20 text-accent-custom border-l-4 border-accent-custom pl-4 pr-3 rounded-r" 
        : "text-slate-300 hover:bg-white/10 hover:text-white pl-5 pr-3 rounded"
    }`;
  };

  const subNavItemClass = (tabId: string) => {
    const isActive = activeTab === tabId || 
      (tabId === "payroll_import" && (activeTab === "payroll_import" || activeTab === "payroll_csv_import")) ||
      (tabId === "payroll_export" && (activeTab === "payroll_export" || activeTab === "payroll_csv_export"));
    return `w-full text-left pl-9 pr-3 py-2 rounded-lg flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase transition-all ${
      isActive
        ? "text-accent-custom bg-white/10 font-bold border-l-2 border-accent-custom"
        : "text-slate-400 hover:text-white hover:bg-white/5"
    }`;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        ></div>
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 bg-primary-custom text-white w-64 z-50 flex flex-col justify-between border-r border-white/10 transition-transform duration-300 transform lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo & Branding Area (Africa Emblem + "Rising with Africa" Slogan) */}
          <div className="h-20 px-4 py-3 flex items-center justify-between border-b border-white/10 shrink-0 bg-[#001F44]">
            <div className="flex items-center">
              {/* Modern Circular Emblem with African Continent Silhouette & Flag Accents */}
              <div 
                className="relative p-0.5 rounded-full bg-gradient-to-tr from-[#009A44] via-[#FED100] to-[#E62529] shadow-md shrink-0 transition-transform hover:scale-105"
                title="Rising with Africa - ETRHRMS"
              >
                <div className="w-10 h-10 rounded-full bg-[#002B5B] flex items-center justify-center p-1.5 text-[#FED100] border border-white/20 shadow-inner">
                  <svg 
                    viewBox="0 0 100 100" 
                    className="w-full h-full drop-shadow-xs" 
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Africa Continent Silhouette */}
                    <path d="M 27,20 C 33,18 42,17 52,18 C 60,19 67,17 76,21 C 80,23 77,28 74,32 C 73,36 78,39 83,42 C 88,45 89,50 85,54 C 81,58 76,60 74,64 C 72,68 66,75 62,81 C 57,87 52,89 47,86 C 44,82 46,75 44,71 C 42,67 38,64 35,60 C 31,59 27,59 23,57 C 18,54 15,49 14,44 C 13,38 16,33 20,29 C 23,26 25,23 27,20 Z" />
                    {/* Madagascar Island */}
                    <path d="M 81,64 C 83,66 85,72 83,78 C 81,78 79,72 81,64 Z" />
                  </svg>
                </div>
              </div>

              {/* Subtle Vertical Divider */}
              <div className="h-8 w-px bg-white/20 mx-3 shrink-0" />

              {/* Slogan: Rising with Africa */}
              <div className="flex flex-col justify-center text-left leading-tight shrink-0">
                <span className="font-black italic text-sm tracking-tight text-white drop-shadow-xs">Rising</span>
                <span className="font-extrabold italic text-xs tracking-tight text-[#FED100] drop-shadow-xs">with Africa</span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-full hover:bg-white/10 text-white transition-colors"
              aria-label="Close Navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">Core Operations</p>
              <div className="space-y-1">
                <button
                  onClick={() => navigateTo("dashboard")}
                  className={navItemClass("dashboard")}
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  Dashboard
                </button>

                <button
                  onClick={() => navigateTo("attendance")}
                  className={navItemClass("attendance")}
                >
                  <UserCheck className="h-4 w-4 shrink-0" />
                  Attendance
                </button>

                {/* Leave Management */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => navigateTo("leaves_dashboard")}
                      className={`flex-1 text-left py-2.5 flex items-center gap-3 text-xs font-semibold tracking-wide transition-all ${
                        activeTab.startsWith("leaves")
                          ? "bg-accent-custom/20 text-accent-custom border-l-4 border-accent-custom pl-4 pr-1 rounded-r font-bold"
                          : "text-slate-300 hover:bg-white/10 hover:text-white pl-5 pr-1 rounded"
                      }`}
                    >
                      <CalendarDays className="h-4 w-4 shrink-0 text-amber-400" />
                      <span>Leave Management</span>
                    </button>
                    <button
                      onClick={() => setLeaveExpanded(!leaveExpanded)}
                      className="p-2 text-slate-400 hover:text-white"
                      title="Toggle Leave Submenus"
                    >
                      {leaveExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {leaveExpanded && (
                    <div className="space-y-0.5 pl-2 border-l border-white/10 ml-5 my-1">
                      <button
                        onClick={() => navigateTo("leaves_dashboard")}
                        className={subNavItemClass("leaves_dashboard")}
                      >
                        Leave Dashboard
                      </button>
                      <button
                        onClick={() => navigateTo("leaves_applications")}
                        className={subNavItemClass("leaves_applications")}
                      >
                        Leave Applications
                      </button>
                      <button
                        onClick={() => navigateTo("leaves_balances")}
                        className={subNavItemClass("leaves_balances")}
                      >
                        Leave Balances
                      </button>
                      <button
                        onClick={() => navigateTo("leaves_calendar")}
                        className={subNavItemClass("leaves_calendar")}
                      >
                        Leave Calendar
                      </button>
                      {(role === "Administrator" || role === "Auditor") && (
                        <button
                          onClick={() => navigateTo("leaves_config")}
                          className={subNavItemClass("leaves_config")}
                        >
                          Leave Configuration
                        </button>
                      )}
                      <button
                        onClick={() => navigateTo("leaves_reports")}
                        className={subNavItemClass("leaves_reports")}
                      >
                        Leave Reports
                      </button>
                    </div>
                  )}
                </div>

                {/* Medical & Health Management */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => navigateTo("medical_dashboard")}
                      className={`flex-1 text-left py-2.5 flex items-center gap-3 text-xs font-semibold tracking-wide transition-all ${
                        activeTab.startsWith("medical")
                          ? "bg-accent-custom/20 text-accent-custom border-l-4 border-accent-custom pl-4 pr-1 rounded-r font-bold"
                          : "text-slate-300 hover:bg-white/10 hover:text-white pl-5 pr-1 rounded"
                      }`}
                    >
                      <HeartPulse className="h-4 w-4 shrink-0 text-rose-400" />
                      <span>Medical &amp; Health</span>
                    </button>
                    <button
                      onClick={() => setMedicalExpanded(!medicalExpanded)}
                      className="p-2 text-slate-400 hover:text-white"
                      title="Toggle Medical Submenus"
                    >
                      {medicalExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {medicalExpanded && (
                    <div className="space-y-0.5 pl-2 border-l border-white/10 ml-5 my-1">
                      <button
                        onClick={() => navigateTo("medical_dashboard")}
                        className={subNavItemClass("medical_dashboard")}
                      >
                        Medical Dashboard
                      </button>
                      <button
                        onClick={() => navigateTo("medical_claims")}
                        className={subNavItemClass("medical_claims")}
                      >
                        Expense Claims
                      </button>
                      <button
                        onClick={() => navigateTo("medical_family")}
                        className={subNavItemClass("medical_family")}
                      >
                        Family Registry
                      </button>
                      {(role === "Administrator" || role === "Auditor") && (
                        <button
                          onClick={() => navigateTo("medical_policy")}
                          className={subNavItemClass("medical_policy")}
                        >
                          Policy Settings
                        </button>
                      )}
                      <button
                        onClick={() => navigateTo("medical_reports")}
                        className={subNavItemClass("medical_reports")}
                      >
                        Medical Reports
                      </button>
                    </div>
                  )}
                </div>

                {/* Payroll Management */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setPayrollExpanded(true);
                        navigateTo("payroll_dashboard");
                      }}
                      className={`flex-1 text-left py-2.5 flex items-center gap-3 text-xs font-semibold tracking-wide transition-all ${
                        activeTab.startsWith("payroll")
                          ? "bg-accent-custom/20 text-accent-custom border-l-4 border-accent-custom pl-4 pr-1 rounded-r font-bold"
                          : "text-slate-300 hover:bg-white/10 hover:text-white pl-5 pr-1 rounded"
                      }`}
                    >
                      <DollarSign className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span>Payroll Management</span>
                    </button>
                    <button
                      onClick={() => setPayrollExpanded(!payrollExpanded)}
                      className="p-2 text-slate-400 hover:text-white"
                      title="Toggle Payroll Submenus"
                    >
                      {payrollExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {payrollExpanded && (
                    <div className="space-y-0.5 pl-2 border-l border-white/10 ml-5 my-1">
                      <button
                        onClick={() => navigateTo("payroll_dashboard")}
                        className={subNavItemClass("payroll_dashboard")}
                      >
                        Payroll Dashboard
                      </button>
                      <button
                        onClick={() => navigateTo("payroll_config")}
                        className={subNavItemClass("payroll_config")}
                      >
                        Payroll Configuration
                      </button>
                      <button
                        onClick={() => navigateTo("payroll_salary_setup")}
                        className={subNavItemClass("payroll_salary_setup")}
                      >
                        Employee Salary Setup
                      </button>
                      <button
                        onClick={() => navigateTo("payroll_processing")}
                        className={subNavItemClass("payroll_processing")}
                      >
                        Payroll Processing
                      </button>
                      <button
                        onClick={() => navigateTo("payroll_approval")}
                        className={subNavItemClass("payroll_approval")}
                      >
                        Payroll Approval
                      </button>
                      <button
                        onClick={() => navigateTo("payroll_payslips")}
                        className={subNavItemClass("payroll_payslips")}
                      >
                        Payslip Management
                      </button>
                      <button
                        onClick={() => navigateTo("payroll_import")}
                        className={subNavItemClass("payroll_import")}
                      >
                        Payroll CSV Import
                      </button>
                      <button
                        onClick={() => navigateTo("payroll_export")}
                        className={subNavItemClass("payroll_export")}
                      >
                        Payroll CSV Export
                      </button>
                      <button
                        onClick={() => navigateTo("payroll_reports")}
                        className={subNavItemClass("payroll_reports")}
                      >
                        Payroll Reports
                      </button>
                      <button
                        onClick={() => navigateTo("payroll_history")}
                        className={subNavItemClass("payroll_history")}
                      >
                        Payroll History
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Company Settings (Submenus differ by role) */}
            <div>
              <button
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className="w-full px-3 mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white"
              >
                <span>Company Settings</span>
                {settingsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>

              {settingsExpanded && (
                <div className="space-y-1 pl-1">
                  <button
                    onClick={() => navigateTo("employees")}
                    className={subNavItemClass("employees")}
                  >
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    Employees
                  </button>

                  <button
                    onClick={() => navigateTo("departments")}
                    className={subNavItemClass("departments")}
                  >
                    <Landmark className="h-3.5 w-3.5 shrink-0" />
                    Departments
                  </button>

                  {(role === "Administrator" || role === "Auditor") && (
                    <>
                      <button
                        onClick={() => navigateTo("profile")}
                        className={subNavItemClass("profile")}
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        Company Profile
                      </button>

                      <button
                        onClick={() => navigateTo("branding")}
                        className={subNavItemClass("branding")}
                      >
                        <Palette className="h-3.5 w-3.5 shrink-0" />
                        Branding Theme
                      </button>

                      <button
                        onClick={() => navigateTo("holidays")}
                        className={subNavItemClass("holidays")}
                      >
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        Public Holidays
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Administration Block - Admin and Auditor */}
            {(role === "Administrator" || role === "Auditor") && (
              <div>
                <button
                  onClick={() => setAdminExpanded(!adminExpanded)}
                  className="w-full px-3 mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white"
                >
                  <span>Administration</span>
                  {adminExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>

                {adminExpanded && (
                  <div className="space-y-1 pl-1">
                    <button
                      onClick={() => navigateTo("email_settings")}
                      className={subNavItemClass("email_settings")}
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      Email Settings
                    </button>

                    <button
                      onClick={() => navigateTo("users")}
                      className={subNavItemClass("users")}
                    >
                      <Users2 className="h-3.5 w-3.5 shrink-0" />
                      User Management
                    </button>

                    <button
                      onClick={() => navigateTo("roles")}
                      className={subNavItemClass("roles")}
                    >
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      Roles &amp; Matrix
                    </button>

                    <button
                      onClick={() => navigateTo("logs")}
                      className={subNavItemClass("logs")}
                    >
                      <History className="h-3.5 w-3.5 shrink-0" />
                      Activity Logs
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Reports Menu */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">Intelligence</p>
              <button
                onClick={() => navigateTo("reports")}
                className={navItemClass("reports")}
              >
                <BarChart3 className="h-4 w-4 shrink-0" />
                Reports Center
              </button>
            </div>
          </div>
        </div>

        {/* User Badge Info Footer */}
        <div className="p-4 border-t border-white/10 bg-black/10 flex flex-col gap-1 text-[10px] text-slate-400">
          <p className="font-bold text-slate-300">Ethiopian Reinsurance S.C.</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium">Active Session ({role})</span>
          </div>
        </div>
      </aside>
    </>
  );
}
