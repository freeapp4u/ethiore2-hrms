import { Employee, Department, AttendanceRecord, LeaveRecord, User, ActivityLog } from "../types";
import { 
  Users, Landmark, UserCheck, UserX, CalendarDays, Plus, Clock, FileSpreadsheet, KeyRound, CheckCircle2, AlertTriangle
} from "lucide-react";

interface DashboardProps {
  employees: Employee[];
  departments: Department[];
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  users: User[];
  logs: ActivityLog[];
  role: "Administrator" | "HR Officer";
  onNavigate: (tabId: string) => void;
  onOpenQuickAddEmployee: () => void;
  onOpenQuickRecordAttendance: () => void;
  onOpenQuickRegisterLeave: () => void;
}

export default function Dashboard({
  employees,
  departments,
  attendance,
  leaves,
  users,
  logs,
  role,
  onNavigate,
  onOpenQuickAddEmployee,
  onOpenQuickRecordAttendance,
  onOpenQuickRegisterLeave
}: DashboardProps) {
  
  // Calculate today's date in YYYY-MM-DD
  const todayStr = "2026-09-04"; // Seeding date matching local timezone or local timestamp in seed data
  
  // Basic metrics
  const activeEmployees = employees.filter(e => e.status === "Active");
  const totalEmployeesCount = activeEmployees.length;
  const activeDepartmentsCount = departments.filter(d => d.status === "Active").length;
  
  // Today's attendance counters
  const todayAttendance = attendance.filter(a => a.date === todayStr);
  const presentTodayCount = todayAttendance.filter(a => a.status === "Present" || a.status === "Late" || a.status === "Half Day").length;
  const leaveTodayCount = todayAttendance.filter(a => a.status === "On Leave").length;
  
  // An employee is considered absent today if they are active, not checked in, and not on leave.
  const checkedInIds = new Set(todayAttendance.map(a => a.employeeId));
  const absentTodayCount = activeEmployees.filter(e => !checkedInIds.has(e.employeeId)).length;

  // Recent attendance
  const recentAttendance = [...attendance]
    .sort((a, b) => b.createdDate.localeCompare(a.createdDate))
    .slice(0, 5);

  // Recent leaves
  const recentLeaves = [...leaves]
    .sort((a, b) => b.createdDate.localeCompare(a.createdDate))
    .slice(0, 5);

  // Recent system logs (Admin only)
  const recentLogs = [...logs]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Ethio-Re Operational Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Human Resource Management &amp; Analytics Console • Active Date: <span className="font-bold text-slate-700">{todayStr}</span>
          </p>
        </div>
        <div className="text-xs bg-slate-100 border px-3 py-1.5 rounded-lg text-slate-600 font-semibold">
          Signed in: <span className="text-primary-custom capitalize font-bold">{role}</span>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-4">
          <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 border border-blue-100">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Employees</p>
            <p className="text-xl font-black text-slate-800">{totalEmployeesCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-4">
          <div className="h-10 w-10 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center shrink-0 border border-slate-200">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departments</p>
            <p className="text-xl font-black text-slate-800">{activeDepartmentsCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-4">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Present Today</p>
            <p className="text-xl font-black text-slate-800">{presentTodayCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-4">
          <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center shrink-0 border border-rose-100">
            <UserX className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Absent Today</p>
            <p className="text-xl font-black text-slate-800">{absentTodayCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-4">
          <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0 border border-amber-100">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">On Leave Today</p>
            <p className="text-xl font-black text-slate-800">{leaveTodayCount}</p>
          </div>
        </div>
      </div>

      {/* Admin Extra Metrics Panel */}
      {role === "Administrator" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-primary-custom" />
            <div>
              <p className="text-xs font-bold text-slate-700">Total System Users</p>
              <p className="text-sm font-semibold text-slate-500">
                <span className="text-lg font-black text-slate-800">{users.length}</span> registered administrators &amp; HR officers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-slate-700">Active System Users</p>
              <p className="text-sm font-semibold text-slate-500">
                <span className="text-lg font-black text-slate-800">{users.filter(u => u.status === "Active").length}</span> authorized logging accounts
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Panel */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick HR Actions</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={onOpenQuickAddEmployee}
            className="flex flex-col items-center justify-center p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-center transition-all group"
            id="qa-add-employee"
          >
            <div className="h-8 w-8 rounded-full bg-slate-100 group-hover:bg-primary-custom group-hover:text-white text-primary-custom flex items-center justify-center mb-2 transition-all">
              <Plus className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-700">Add Employee</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Enroll new resource</span>
          </button>

          <button 
            onClick={onOpenQuickRecordAttendance}
            className="flex flex-col items-center justify-center p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-center transition-all group"
            id="qa-record-attendance"
          >
            <div className="h-8 w-8 rounded-full bg-slate-100 group-hover:bg-primary-custom group-hover:text-white text-primary-custom flex items-center justify-center mb-2 transition-all">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-700">Record Attendance</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Log daily attendance</span>
          </button>

          <button 
            onClick={onOpenQuickRegisterLeave}
            className="flex flex-col items-center justify-center p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-center transition-all group"
            id="qa-register-leave"
          >
            <div className="h-8 w-8 rounded-full bg-slate-100 group-hover:bg-primary-custom group-hover:text-white text-primary-custom flex items-center justify-center mb-2 transition-all">
              <CalendarDays className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-700">Register Leave</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Book leave directly</span>
          </button>

          <button 
            onClick={() => onNavigate("reports")}
            className="flex flex-col items-center justify-center p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-center transition-all group"
            id="qa-view-reports"
          >
            <div className="h-8 w-8 rounded-full bg-slate-100 group-hover:bg-primary-custom group-hover:text-white text-primary-custom flex items-center justify-center mb-2 transition-all">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-700">View Reports</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Extract audit reports</span>
          </button>
        </div>
      </div>

      {/* Lists Section: Attendance vs. Leaves (vs. Activity Logs if Admin) */}
      <div className={`grid grid-cols-1 ${role === "Administrator" ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-6`}>
        {/* Recent Attendance */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col h-[380px]">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary-custom" />
              Recent Attendance
            </h3>
            <button 
              onClick={() => onNavigate("attendance")} 
              className="text-[10px] font-bold text-primary-custom hover:underline"
            >
              View All
            </button>
          </div>
          <div className="p-2 overflow-y-auto flex-1 divide-y divide-slate-100">
            {recentAttendance.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">No recent attendance records.</div>
            ) : (
              recentAttendance.map(a => {
                const emp = employees.find(e => e.employeeId === a.employeeId);
                const empName = emp ? emp.fullName : a.employeeId;
                return (
                  <div key={a.id} className="p-3 hover:bg-slate-50 transition-colors flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{empName}</p>
                      <div className="flex items-center gap-2 text-slate-400 mt-0.5 font-medium">
                        <span>{a.date}</span>
                        <span>•</span>
                        <span>{a.checkInTime || "--:--"} to {a.checkOutTime || "--:--"}</span>
                      </div>
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        a.status === "Present" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        a.status === "Late" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        a.status === "On Leave" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        "bg-slate-50 text-slate-700 border"
                      }`}>
                        {a.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Leaves */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col h-[380px]">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary-custom" />
              Recent Leave Records
            </h3>
            <button 
              onClick={() => onNavigate("leaves")} 
              className="text-[10px] font-bold text-primary-custom hover:underline"
            >
              View All
            </button>
          </div>
          <div className="p-2 overflow-y-auto flex-1 divide-y divide-slate-100">
            {recentLeaves.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">No recent leave records.</div>
            ) : (
              recentLeaves.map(l => {
                const emp = employees.find(e => e.employeeId === l.employeeId);
                const empName = emp ? emp.fullName : l.employeeId;
                return (
                  <div key={l.id} className="p-3 hover:bg-slate-50 transition-colors flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{empName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-semibold text-primary-custom uppercase">
                        {l.leaveType}
                      </p>
                      <div className="flex items-center gap-1.5 text-slate-400 mt-1 font-medium">
                        <span>{l.startDate} to {l.endDate}</span>
                        <span>•</span>
                        <span className="font-bold text-slate-600">{l.daysCount} Working Days</span>
                      </div>
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        l.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        l.status === "Completed" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        "bg-slate-50 text-slate-500 border border-slate-200"
                      }`}>
                        {l.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Admin Logs - Admin Only */}
        {role === "Administrator" && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col h-[380px]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Security Activities
              </h3>
              <button 
                onClick={() => onNavigate("logs")} 
                className="text-[10px] font-bold text-primary-custom hover:underline"
              >
                Full Logs
              </button>
            </div>
            <div className="p-2 overflow-y-auto flex-1 divide-y divide-slate-100">
              {recentLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">No recent activities.</div>
              ) : (
                recentLogs.map(g => (
                  <div key={g.id} className="p-3 hover:bg-slate-50 transition-colors text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-700">{g.userEmail}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{g.timestamp.split(" ")[1]}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">
                      <span className="text-primary-custom">[{g.module}]</span> {g.action}
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-tight">{g.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
