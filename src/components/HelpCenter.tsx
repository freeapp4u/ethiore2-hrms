import { useState } from "react";
import { BookOpen, UserCheck, CalendarDays, Users, Landmark, HelpCircle, PhoneCall, ShieldCheck, X } from "lucide-react";

interface HelpCenterProps {
  onClose: () => void;
  companyName: string;
}

export default function HelpCenter({ onClose, companyName }: HelpCenterProps) {
  const [activeTab, setActiveTab] = useState("start");

  const menuItems = [
    { id: "start", label: "Getting Started", icon: BookOpen },
    { id: "user", label: "User Roles & Auth", icon: ShieldCheck },
    { id: "attendance", label: "Attendance Guide", icon: UserCheck },
    { id: "leave", label: "Leave Management", icon: CalendarDays },
    { id: "employee", label: "Employee Management", icon: Users },
    { id: "department", label: "Department Management", icon: Landmark },
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "contact", label: "Contact Admin / About", icon: PhoneCall },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-primary-custom text-white px-6 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-accent-custom" />
            <div>
              <h2 className="font-bold text-lg">Help Center &amp; User Guides</h2>
              <p className="text-xs text-white/80">{companyName} Human Resource Management System</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tabs Sidebar */}
          <div className="w-1/3 bg-slate-50 border-r border-slate-200 overflow-y-auto p-3 flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-all ${
                    isActive 
                      ? "bg-primary-custom text-white shadow-xs" 
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-accent-custom" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content Panel */}
          <div className="w-2/3 p-6 overflow-y-auto bg-white text-slate-700">
            {activeTab === "start" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Getting Started with Ethio-Re HRMS</h3>
                <p className="text-sm leading-relaxed">
                  Welcome to the official Human Resource Management System of <strong>{companyName}</strong>. 
                  This platform is custom-built to streamline daily HR operational processes, attendance tracking, 
                  and leave records without complex multi-level approval queues.
                </p>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                  <h4 className="font-bold text-sm text-slate-800">Quick Start Checklist:</h4>
                  <ol className="list-decimal list-inside text-xs space-y-1.5 text-slate-600">
                    <li>Log in using your authorized organizational credentials.</li>
                    <li>Check the <strong>Dashboard</strong> for real-time daily stats and quick action shortcuts.</li>
                    <li>Ensure all active <strong>Departments</strong> are registered in Company Settings.</li>
                    <li>Enroll your team in the <strong>Employee Directory</strong>.</li>
                    <li>Directly log check-ins, record leafing, and extract comprehensive operational reports.</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTab === "user" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">User Roles &amp; Access Permissions</h3>
                <p className="text-sm">
                  The system enforces secure, strict role-based access control. Only two specific roles exist:
                </p>
                <div className="space-y-3">
                  <div className="p-3.5 border border-l-4 border-l-[var(--primary-color)] rounded-r-lg bg-slate-50">
                    <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary-custom"></span>
                      Administrator (Full Access)
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Full administrative authorization. Able to manage system users (add, edit, toggle active status), 
                      set up organizational profiles, configure custom branding color schemes, define public holidays, 
                      and view global secure activity logs.
                    </p>
                  </div>
                  <div className="p-3.5 border border-l-4 border-l-[var(--accent-color)] rounded-r-lg bg-slate-50">
                    <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-accent-custom"></span>
                      HR Officer (Operational Access)
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Executes all daily operations. Can register and edit employees, configure active departments, 
                      directly log and correct attendance entries, register employee leave schedules, and run operational reports. 
                      Cannot access administrative setups or user tables.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "attendance" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Attendance Management Guide</h3>
                <p className="text-sm">
                  There is no complex self-service request pipeline. The HR Officer or Administrator directly manages 
                  and corrects daily attendance records.
                </p>
                <div className="space-y-2 text-sm text-slate-600">
                  <p className="font-semibold text-slate-800">To Record Daily Attendance:</p>
                  <ol className="list-decimal list-inside text-xs space-y-1">
                    <li>Navigate to the <strong>Attendance</strong> module.</li>
                    <li>Click on <strong>Record Attendance</strong> to open the log form.</li>
                    <li>Select an employee from the dropdown. Employee ID and Department will populate automatically.</li>
                    <li>Set the date, status (Present, Late, Absent, Half Day, On Leave), and enter optional check-in/out times.</li>
                    <li>Add remarks if explaining delays or deviations. Click <strong>Save Record</strong>.</li>
                  </ol>
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                    <strong>Prevention:</strong> The system guards against duplicate attendance logs. You cannot create 
                    two distinct attendance entries for the same employee on the same date. Instead, use the <strong>Edit</strong> action 
                    to correct an existing entry.
                  </div>
                </div>
              </div>
            )}

            {activeTab === "leave" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Leave Management Guide</h3>
                <p className="text-sm">
                  The system calculates leave days and monitors balances with strict data validation. There is 
                  <strong> no approval process</strong>; leaves logged are instantly finalized.
                </p>
                <div className="space-y-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-800">Key Features &amp; Rules:</p>
                  <ul className="list-disc list-inside text-xs space-y-1.5">
                    <li><strong>Automated Calculation:</strong> System calculates leave duration by automatically excluding Saturdays, Sundays, and configured Public Holidays.</li>
                    <li><strong>Balance Check:</strong> The system checks the employee&apos;s allocated balance before saving. If the requested leave days exceed the remaining balance, the transaction is rejected (unless forced by the Administrator).</li>
                    <li><strong>Overlap Protection:</strong> The system prevents an employee from having concurrent or overlapping leaves.</li>
                    <li><strong>Status:</strong> Simplistic lifecycle: Active, Completed, or Cancelled.</li>
                  </ul>
                  <div className="p-3 bg-slate-50 rounded-md border text-xs">
                    <span className="font-bold text-slate-700">Formula:</span> Remaining Days = Allocated Days - Used Days
                  </div>
                </div>
              </div>
            )}

            {activeTab === "employee" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Employee Directory Guide</h3>
                <p className="text-sm">
                  Under <strong>Company Settings → Employees</strong>, authorized users can search, register, 
                  and edit individual employee folders.
                </p>
                <div className="space-y-2 text-xs text-slate-600">
                  <p className="font-semibold text-sm text-slate-800">Data Integrity Guidelines:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Employee ID:</strong> Must be completely unique (e.g., EMP001, EMP002).</li>
                    <li><strong>Historical Preservation:</strong> To avoid breaking previous attendance logs or leave history, do not delete employees. Instead, set their status to <strong>Inactive</strong> to archive them.</li>
                    <li><strong>Filtering &amp; Search:</strong> Instantly filter by active status, search names, or query by departments.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "department" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Department Setup</h3>
                <p className="text-sm">
                  Active departments populate the drop-down menus across the application. 
                </p>
                <div className="space-y-2 text-xs text-slate-600">
                  <p className="font-semibold text-sm text-slate-800">Integrity Constraints:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Department Name and Department Code must be unique.</li>
                    <li><strong>Referential Safety:</strong> The system blocks the deletion of a department if employees are currently assigned to it. You must first reassign those employees before removing the department code.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "faq" && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Frequently Asked Questions</h3>
                <div className="space-y-3.5 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800">Q: Can an employee log into this portal to request leaves?</h4>
                    <p className="text-slate-600 mt-0.5">A: No. There is no self-service portal. The system is designed strictly for Administrator and HR Officer direct management.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Q: How do we handle public holidays when calculating leave?</h4>
                    <p className="text-slate-600 mt-0.5">A: Administrators can register public holidays under Settings → Public Holidays. The leave engine reads this list and automatically excludes those dates from the computed leave duration.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Q: Why did my leave registration show a validation error?</h4>
                    <p className="text-slate-600 mt-0.5">A: The employee is either inactive, has an overlapping leave already recorded, or has insufficient remaining leave days for the requested type.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "contact" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">About Ethio-Re HRMS</h3>
                <div className="space-y-2 text-xs">
                  <p>
                    <strong>Ethio-Re HRMS</strong> is an enterprise software solution custom built for Ethiopian Reinsurance S.C. 
                    It is designed to manage employee resources with precision, adherence to organizational policies, 
                    and operational security.
                  </p>
                  <div className="p-4 bg-slate-50 rounded-lg space-y-1 text-slate-600 mt-4">
                    <p className="font-bold text-slate-800">System Support Contacts:</p>
                    <p>📧 Email: support@ethiopianre.com</p>
                    <p>📞 Phone: +251-115-575757 (Ext: 104 - IT Dept)</p>
                    <p>🏢 Location: Africa Avenue, Addis Ababa, Ethiopia</p>
                  </div>
                  <div className="text-center pt-8 text-slate-400">
                    <p>Version 1.2.0 • Secured Enterprise Build</p>
                    <p>© 2026 Ethiopian Reinsurance Share Company. All Rights Reserved.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
