import { UserRole } from "../types";
import { 
  LayoutDashboard, UserCheck, CalendarDays, Settings, ShieldAlert, 
  BarChart3, Users, Landmark, FileText, Palette, Calendar, 
  Users2, Eye, ShieldCheck, History, ChevronDown, ChevronRight, X, FolderOpen
} from "lucide-react";
import { useState } from "react";

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
  companyName
}: SidebarProps) {
  const [settingsExpanded, setSettingsExpanded] = useState(true);
  const [adminExpanded, setAdminExpanded] = useState(true);

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
    const isActive = activeTab === tabId;
    return `w-full text-left pl-9 pr-3 py-2 rounded-lg flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase transition-all ${
      isActive
        ? "text-accent-custom bg-white/5 font-bold"
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
          {/* Logo & Close Button (Mobile Only) */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-accent-custom flex items-center justify-center text-slate-900 font-bold text-xs shadow-xs">
                ER
              </div>
              <div className="text-left">
                <p className="font-extrabold text-sm tracking-tight leading-none text-white">ETHIO-RE</p>
                <p className="text-[9px] font-semibold text-accent-custom tracking-widest mt-0.5 uppercase">HRMS Engine</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-full hover:bg-white/10 text-white"
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

                <button
                  onClick={() => navigateTo("leaves")}
                  className={navItemClass("leaves")}
                >
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  Leave Management
                </button>

                <button
                  onClick={() => navigateTo("documents")}
                  className={navItemClass("documents")}
                >
                  <FolderOpen className="h-4 w-4 shrink-0 text-sky-400" />
                  Document Vault
                </button>
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

                  {/* Restrict these from HR Officer */}
                  {role === "Administrator" && (
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

            {/* Administration Block - Only for Admin */}
            {role === "Administrator" && (
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
