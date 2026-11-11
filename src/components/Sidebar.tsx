import { 
  LayoutDashboard, UserCheck, CalendarDays,
  BarChart3, Users, Landmark, FileText, Palette, Calendar, 
  Users2, ShieldCheck, History, ChevronDown, ChevronRight, X, FolderOpen, HeartPulse, DollarSign, Mail, Info, Settings, Lock
} from "lucide-react";
import { useState } from "react";
import { UserRole, RolePermissions, User } from "../types";
import { APP_MODULES } from "../config/permissions";
import { hasPermission } from "../utils/rbacUtils";

interface SidebarProps {
  currentUser: User | null;
  rolePermissions: RolePermissions | undefined;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
}

const IconMap: { [key: string]: any } = {
  LayoutDashboard,
  Users,
  Landmark,
  CalendarDays,
  Clock: UserCheck, // Mapping Clock to UserCheck as used in old sidebar
  HeartPulse,
  DollarSign,
  FileText,
  FileSpreadsheet: BarChart3,
  Settings,
  Info,
  History,
  ShieldCheck,
  Users2,
  Palette,
  Calendar,
  Mail
};

export default function Sidebar({
  currentUser,
  rolePermissions,
  activeTab,
  onTabChange,
  isOpen,
  onClose,
}: SidebarProps) {
  const [expandedModules, setExpandedExpandedModules] = useState<{ [key: string]: boolean }>(() => {
    const initial: { [key: string]: boolean } = {};
    APP_MODULES.forEach(m => {
      if (m.submenus.length > 0) {
        // Expand if active tab belongs to this module
        initial[m.id] = activeTab.startsWith(m.id);
      }
    });
    return initial;
  });

  const toggleModule = (moduleId: string) => {
    setExpandedExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const navigateTo = (tabId: string) => {
    onTabChange(tabId);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const navItemClass = (tabId: string) => {
    const isActive = activeTab === tabId || activeTab.startsWith(tabId + "_");
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
        ? "text-accent-custom bg-white/10 font-bold border-l-2 border-accent-custom"
        : "text-slate-400 hover:text-white hover:bg-white/5"
    }`;
  };

  const filteredModules = APP_MODULES.filter(module => {
    const canViewModule = hasPermission(rolePermissions, module.id, "view");
    if (!canViewModule) return false;

    // If module has submenus, at least one must be allowed
    if (module.submenus.length > 0) {
      return module.submenus.some(sub => hasPermission(rolePermissions, module.id, "view", sub.id));
    }

    return true;
  });

  return (
    <>
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        ></div>
      )}

      <aside
        className={`fixed inset-y-0 left-0 bg-primary-custom text-white w-64 z-50 flex flex-col justify-between border-r border-white/10 transition-transform duration-300 transform lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="h-20 px-4 py-3 flex items-center justify-between border-b border-white/10 shrink-0 bg-[#001F44]">
            <div className="flex items-center">
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
                    <path d="M 27,20 C 33,18 42,17 52,18 C 60,19 67,17 76,21 C 80,23 77,28 74,32 C 73,36 78,39 83,42 C 88,45 89,50 85,54 C 81,58 76,60 74,64 C 72,68 66,75 62,81 C 57,87 52,89 47,86 C 44,82 46,75 44,71 C 42,67 38,64 35,60 C 31,59 27,59 23,57 C 18,54 15,49 14,44 C 13,38 16,33 20,29 C 23,26 25,23 27,20 Z" />
                    <path d="M 81,64 C 83,66 85,72 83,78 C 81,78 79,72 81,64 Z" />
                  </svg>
                </div>
              </div>
              <div className="h-8 w-px bg-white/20 mx-3 shrink-0" />
              <div className="flex flex-col justify-center text-left leading-tight shrink-0">
                <span className="font-black italic text-sm tracking-tight text-white drop-shadow-xs">Rising</span>
                <span className="font-extrabold italic text-xs tracking-tight text-[#FED100] drop-shadow-xs">with Africa</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-full hover:bg-white/10 text-white transition-colors"
              aria-label="Close Navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">Navigator</p>
            
            {filteredModules.map(module => {
              const IconComp = IconMap[module.icon] || FolderOpen;
              const hasSubmenus = module.submenus.length > 0;
              const isExpanded = expandedModules[module.id];
              const allowedSubmenus = module.submenus.filter(sub => hasPermission(rolePermissions, module.id, "view", sub.id));

              if (hasSubmenus && allowedSubmenus.length === 0) return null;

              return (
                <div key={module.id} className="space-y-1">
                  <div className="flex items-center justify-between group">
                    <button
                      onClick={() => {
                        if (hasSubmenus) {
                          toggleModule(module.id);
                        } else {
                          navigateTo(module.id);
                        }
                      }}
                      className={navItemClass(module.id)}
                    >
                      <IconComp className="h-4 w-4 shrink-0" />
                      <span>{module.name}</span>
                    </button>
                    {hasSubmenus && (
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                      >
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>

                  {hasSubmenus && isExpanded && (
                    <div className="space-y-0.5 pl-2 border-l border-white/10 ml-5 my-1">
                      {allowedSubmenus.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => navigateTo(`${module.id}_${sub.id}`)}
                          className={subNavItemClass(`${module.id}_${sub.id}`)}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-black/10 flex flex-col gap-1 text-[10px] text-slate-400">
          <p className="font-bold text-slate-300">Ethiopian Reinsurance S.C.</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium">Active Session ({currentUser?.role || "Guest"})</span>
          </div>
        </div>
      </aside>
    </>
  );
}
