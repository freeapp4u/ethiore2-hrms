import { useState } from "react";
import { Employee, Department, LeaveRecord, AttendanceRecord, ActivityLog, CompanyConfig, User } from "../types";
import { 
  FileText, Calendar, Clock, ShieldCheck, Printer, FileSpreadsheet, 
  Search, Filter, Eye, Award, BarChart3, Users, Landmark 
} from "lucide-react";

interface ReportsProps {
  employees: Employee[];
  departments: Department[];
  leaves: LeaveRecord[];
  attendance: AttendanceRecord[];
  auditLogs: ActivityLog[];
  config: CompanyConfig;
  currentUser: User | null;
}

export default function Reports({
  employees,
  departments,
  leaves,
  attendance,
  auditLogs,
  config,
  currentUser
}: ReportsProps) {
  const [activeReportTab, setActiveReportTab] = useState("directory");

  // --- Filter states ---
  // Employee filters
  const [empDept, setEmpDept] = useState("");
  const [empStatus, setEmpStatus] = useState("");
  const [empJoinYear, setEmpJoinYear] = useState("");

  // Leave filters
  const [leaveDept, setLeaveDept] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");

  // Attendance filters
  const [attDept, setAttDept] = useState("");
  const [attStatus, setAttStatus] = useState("");
  const [attStart, setAttStart] = useState("");
  const [attEnd, setAttEnd] = useState("");

  // Audit filters (Admin only)
  const [auditModule, setAuditModule] = useState("");
  const [auditSearch, setAuditSearch] = useState("");

  // --- 1. Calculations: Employee Directory Report ---
  const filteredEmployees = employees.filter(emp => {
    const matchDept = empDept ? emp.departmentId === empDept : true;
    const matchStatus = empStatus ? emp.status === empStatus : true;
    const matchYear = empJoinYear ? emp.hireDate.startsWith(empJoinYear) : true;
    return matchDept && matchStatus && matchYear;
  });

  const totalEmps = filteredEmployees.length;
  const activeEmpsCount = filteredEmployees.filter(e => e.status === "Active").length;
  const deactivatedEmpsCount = filteredEmployees.filter(e => e.status === "Inactive").length;
  
  // Average tenure
  const calculateAvgTenure = () => {
    if (filteredEmployees.length === 0) return 0;
    const currentYear = new Date().getFullYear();
    const sumTenure = filteredEmployees.reduce((sum, emp) => {
      const joinYear = new Date(emp.hireDate).getFullYear() || currentYear;
      return sum + (currentYear - joinYear);
    }, 0);
    return (sumTenure / filteredEmployees.length).toFixed(1);
  };

  // --- 2. Calculations: Leave Utilization Report ---
  const filteredLeaves = leaves.filter(l => {
    const emp = employees.find(e => e.employeeId === l.employeeId);
    const matchDept = leaveDept ? emp?.departmentId === leaveDept : true;
    const matchType = leaveType ? l.leaveType === leaveType : true;
    const matchStart = leaveStart ? l.startDate >= leaveStart : true;
    const matchEnd = leaveEnd ? l.endDate <= leaveEnd : true;
    return matchDept && matchType && matchStart && matchEnd;
  });

  const totalDaysLost = filteredLeaves.reduce((sum, l) => l.status !== "Cancelled" ? sum + l.daysCount : sum, 0);
  const avgLeaveDuration = filteredLeaves.length > 0 
    ? (totalDaysLost / filteredLeaves.filter(l => l.status !== "Cancelled").length || 0).toFixed(1) 
    : 0;

  // --- 3. Calculations: Attendance & Lateness Summary ---
  const filteredAttendance = attendance.filter(att => {
    const emp = employees.find(e => e.employeeId === att.employeeId);
    const matchDept = attDept ? emp?.departmentId === attDept : true;
    const matchStatus = attStatus ? att.status === attStatus : true;
    const matchStart = attStart ? att.date >= attStart : true;
    const matchEnd = attEnd ? att.date <= attEnd : true;
    return matchDept && matchStatus && matchStart && matchEnd;
  });

  const totalDaysLogged = filteredAttendance.length;
  const presentCount = filteredAttendance.filter(a => a.status === "Present" || a.status === "Late").length;
  const absentCount = filteredAttendance.filter(a => a.status === "Absent").length;
  const lateCount = filteredAttendance.filter(a => a.status === "Late" || a.lateStatus === "Yes").length;

  // --- 4. Calculations: Audit Logs (Admin ONLY) ---
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchModule = auditModule ? log.module === auditModule : true;
    const matchSearch = auditSearch 
      ? log.action.toLowerCase().includes(auditSearch.toLowerCase()) || 
        log.details.toLowerCase().includes(auditSearch.toLowerCase()) || 
        log.userEmail.toLowerCase().includes(auditSearch.toLowerCase())
      : true;
    return matchModule && matchSearch;
  });

  // --- Print Optimization & Export Functions ---
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (activeReportTab === "directory") {
      csvContent += "Employee ID,Full Name,Email,Phone,Department,Hire Date,Status,Birth Date\r\n";
      filteredEmployees.forEach(e => {
        const dName = departments.find(d => d.id === e.departmentId)?.name || e.departmentId;
        csvContent += `"${e.employeeId}","${e.fullName}","${e.email}","${e.phoneNumber}","${dName}","${e.hireDate}","${e.status}","${e.dob}"\r\n`;
      });
    } else if (activeReportTab === "leaves") {
      csvContent += "Leave ID,Employee ID,Employee Name,Leave Type,Start Date,End Date,Working Days,Status,Reason\r\n";
      filteredLeaves.forEach(l => {
        const empName = employees.find(e => e.employeeId === l.employeeId)?.fullName || l.employeeId;
        csvContent += `"${l.id}","${l.employeeId}","${empName}","${l.leaveType}","${l.startDate}","${l.endDate}","${l.daysCount}","${l.status}","${l.reason}"\r\n`;
      });
    } else if (activeReportTab === "attendance") {
      csvContent += "Record ID,Employee ID,Employee Name,Date,Check In,Check Out,Working Hours,Late,Status,Remarks\r\n";
      filteredAttendance.forEach(a => {
        const empName = employees.find(e => e.employeeId === a.employeeId)?.fullName || a.employeeId;
        csvContent += `"${a.id}","${a.employeeId}","${empName}","${a.date}","${a.checkInTime || "-"}","${a.checkOutTime || "-"}","${a.workingHours}","${a.lateStatus}","${a.status}","${a.remarks}"\r\n`;
      });
    } else if (activeReportTab === "audit" && currentUser?.role === "Administrator") {
      csvContent += "Timestamp,User,Module,Action,Record,Details\r\n";
      filteredAuditLogs.forEach(log => {
        csvContent += `"${log.timestamp}","${log.userEmail}","${log.module}","${log.action}","${log.recordEntity}","${log.details}"\r\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ethiore_report_${activeReportTab}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Tab Selectors */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-1 border-b pb-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveReportTab("directory")}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
              activeReportTab === "directory" 
                ? "bg-primary-custom text-white shadow-xs" 
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Employee Directory</span>
          </button>
          <button
            onClick={() => setActiveReportTab("leaves")}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
              activeReportTab === "leaves" 
                ? "bg-primary-custom text-white shadow-xs" 
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Leave Utilization</span>
          </button>
          <button
            onClick={() => setActiveReportTab("attendance")}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
              activeReportTab === "attendance" 
                ? "bg-primary-custom text-white shadow-xs" 
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Attendance &amp; Lateness</span>
          </button>
          {currentUser?.role === "Administrator" && (
            <button
              onClick={() => setActiveReportTab("audit")}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                activeReportTab === "audit" 
                  ? "bg-primary-custom text-white shadow-xs" 
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Activity Audit Logs</span>
            </button>
          )}
        </div>

        {/* Global Export actions */}
        <div className="flex gap-2 w-full sm:w-auto self-end">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            <span>Print Report / Save PDF</span>
          </button>
        </div>
      </div>

      {/* --- REPORT VIEW 1: EMPLOYEE DIRECTORY --- */}
      {activeReportTab === "directory" && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border rounded-lg p-4 shadow-2xs">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Filtered headcount</span>
              <span className="text-xl font-extrabold text-slate-800">{totalEmps} Personnel</span>
            </div>
            <div className="bg-white border rounded-lg p-4 shadow-2xs">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Active Staff Status</span>
              <span className="text-xl font-extrabold text-slate-800">{activeEmpsCount} Active</span>
            </div>
            <div className="bg-white border rounded-lg p-4 shadow-2xs">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Average Service Length</span>
              <span className="text-xl font-extrabold text-slate-800">{calculateAvgTenure()} Years Tenure</span>
            </div>
          </div>

          {/* Filters card */}
          <div className="bg-white border rounded-lg p-4 shadow-2xs">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</label>
                <select
                  value={empDept}
                  onChange={(e) => setEmpDept(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white font-semibold text-slate-700"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="w-48 space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employment Status</label>
                <select
                  value={empStatus}
                  onChange={(e) => setEmpStatus(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white font-semibold text-slate-700"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="w-48 space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year of Joining</label>
                <input
                  type="number"
                  placeholder="e.g. 2024"
                  value={empJoinYear}
                  onChange={(e) => setEmpJoinYear(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white font-semibold text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* High Fidelity Report Preview Canvas */}
          <div className="bg-white border rounded-lg p-8 shadow-2xs max-w-5xl mx-auto printable-canvas">
            {/* Branded Letterhead */}
            <div className="border-b-2 border-primary-custom pb-6 flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                {config.profile.logoUrl ? (
                  <img src={config.profile.logoUrl} alt="Ethio-Re logo" className="h-12 w-12 object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-12 w-12 bg-primary-custom text-white rounded-lg flex items-center justify-center font-extrabold text-sm uppercase">
                    ER
                  </div>
                )}
                <div>
                  <h1 className="font-extrabold text-slate-800 text-sm md:text-base tracking-tight uppercase">{config.profile.legalName}</h1>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">{config.profile.displayName} SC • Human Resource Management</p>
                </div>
              </div>
              <div className="text-center sm:text-right text-[10px] font-medium text-slate-500 leading-relaxed">
                <div>Email: {config.profile.email}</div>
                <div>Phone: {config.profile.phoneNumber}</div>
                <div>Website: {config.profile.website}</div>
              </div>
            </div>

            {/* Document details */}
            <div className="flex justify-between items-end mb-6 text-xs">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-tight">EMPLOYEE DIRECTORY SUMMARY REPORT</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Parameters: Dept: {departments.find(d => d.id === empDept)?.name || "All"} | Status: {empStatus || "All"}</p>
              </div>
              <div className="text-right text-slate-400 text-[10px] font-bold">
                <div>Date Generated: {new Date().toISOString().split("T")[0]}</div>
                <div>System State: Production (Client Sync)</div>
              </div>
            </div>

            {/* Listing Table */}
            <table className="w-full border text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b font-extrabold text-[10px] text-slate-600 uppercase tracking-wider">
                  <th className="px-4 py-2 border-r">ID</th>
                  <th className="px-4 py-2 border-r">Full Name</th>
                  <th className="px-4 py-2 border-r">Department</th>
                  <th className="px-4 py-2 border-r">Date of Joining</th>
                  <th className="px-4 py-2 border-r">Active Status</th>
                  <th className="px-4 py-2">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-800 font-medium">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400">No employees match selected directory parameters.</td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => {
                    const deptObj = departments.find(d => d.id === emp.departmentId);
                    return (
                      <tr key={emp.employeeId} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 border-r font-bold text-primary-custom">{emp.employeeId}</td>
                        <td className="px-4 py-2.5 border-r font-bold">{emp.fullName}</td>
                        <td className="px-4 py-2.5 border-r text-slate-500 font-semibold">{deptObj ? deptObj.name : "N/A"}</td>
                        <td className="px-4 py-2.5 border-r">{emp.hireDate}</td>
                        <td className="px-4 py-2.5 border-r">
                          <span className={`inline-block text-[10px] font-bold ${
                            emp.status === "Active" ? "text-emerald-700" : "text-rose-700"
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">{emp.phoneNumber || "-"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- REPORT VIEW 2: LEAVE UTILIZATION --- */}
      {activeReportTab === "leaves" && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border rounded-lg p-4 shadow-2xs">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Working Days Off-Duty</span>
              <span className="text-xl font-extrabold text-slate-800">{totalDaysLost} Days Lost</span>
            </div>
            <div className="bg-white border rounded-lg p-4 shadow-2xs">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Average booked leave duration</span>
              <span className="text-xl font-extrabold text-slate-800">{avgLeaveDuration} Days average</span>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border rounded-lg p-4 shadow-2xs flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</label>
              <select
                value={leaveDept}
                onChange={(e) => setLeaveDept(e.target.value)}
                className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white font-semibold"
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="w-48 space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leave Type</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white font-semibold"
              >
                <option value="">All Types</option>
                <option value="Annual Leave">Annual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Maternity Leave">Maternity Leave</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
              </select>
            </div>

            <div className="w-48 space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date From</label>
              <input
                type="date"
                value={leaveStart}
                onChange={(e) => setLeaveStart(e.target.value)}
                className="w-full px-3 py-1 border rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Printable Branded Canvas */}
          <div className="bg-white border rounded-lg p-8 shadow-2xs max-w-5xl mx-auto printable-canvas">
            {/* Branded Letterhead */}
            <div className="border-b-2 border-primary-custom pb-6 flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                {config.profile.logoUrl ? (
                  <img src={config.profile.logoUrl} alt="Ethio-Re logo" className="h-12 w-12 object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-12 w-12 bg-primary-custom text-white rounded-lg flex items-center justify-center font-extrabold text-sm">
                    ER
                  </div>
                )}
                <div>
                  <h1 className="font-extrabold text-slate-800 text-sm md:text-base tracking-tight uppercase">{config.profile.legalName}</h1>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">{config.profile.displayName} SC • Human Resource Management</p>
                </div>
              </div>
              <div className="text-center sm:text-right text-[10px] font-medium text-slate-500 leading-relaxed">
                <div>Email: {config.profile.email}</div>
                <div>Phone: {config.profile.phoneNumber}</div>
                <div>Website: {config.profile.website}</div>
              </div>
            </div>

            {/* Document Details */}
            <div className="flex justify-between items-end mb-6 text-xs">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-tight">LEAVE UTILIZATION AUDIT REPORT</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Filter Scope: Type: {leaveType || "All"} | Dept: {departments.find(d => d.id === leaveDept)?.name || "All"}</p>
              </div>
              <div className="text-right text-slate-400 text-[10px] font-bold">
                <div>Date Generated: {new Date().toISOString().split("T")[0]}</div>
                <div>Printed By: {currentUser?.email}</div>
              </div>
            </div>

            {/* Table */}
            <table className="w-full border text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b font-extrabold text-[10px] text-slate-600 uppercase tracking-wider">
                  <th className="px-4 py-2 border-r">Employee</th>
                  <th className="px-4 py-2 border-r">Leave Type</th>
                  <th className="px-4 py-2 border-r">Start Date</th>
                  <th className="px-4 py-2 border-r">End Date</th>
                  <th className="px-4 py-2 border-r text-center">Business Days</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-800 font-medium">
                {filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400">No leave allocations or bookings match current scope.</td>
                  </tr>
                ) : (
                  filteredLeaves.map(l => {
                    const empName = employees.find(e => e.employeeId === l.employeeId)?.fullName || l.employeeId;
                    return (
                      <tr key={l.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 border-r">
                          <div className="font-bold">{empName}</div>
                          <div className="text-[9px] text-slate-400">{l.employeeId}</div>
                        </td>
                        <td className="px-4 py-2 border-r text-primary-custom uppercase text-[10px] font-extrabold">{l.leaveType}</td>
                        <td className="px-4 py-2 border-r">{l.startDate}</td>
                        <td className="px-4 py-2 border-r">{l.endDate}</td>
                        <td className="px-4 py-2 border-r text-center font-bold bg-slate-50/50">{l.daysCount} days</td>
                        <td className="px-4 py-2 text-slate-500 font-bold uppercase tracking-wider text-[10px]">{l.status}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- REPORT VIEW 3: ATTENDANCE & LATENESS SUMMARY --- */}
      {activeReportTab === "attendance" && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border rounded-lg p-4 shadow-2xs">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Total Days Evaluated</span>
              <span className="text-xl font-extrabold text-slate-800">{totalDaysLogged} Days Logged</span>
            </div>
            <div className="bg-white border rounded-lg p-4 shadow-2xs">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Present Ratio</span>
              <span className="text-xl font-extrabold text-slate-800">
                {totalDaysLogged > 0 ? ((presentCount / totalDaysLogged) * 100).toFixed(0) : 0}% Present
              </span>
            </div>
            <div className="bg-white border rounded-lg p-4 shadow-2xs">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Late Check-In Incidents</span>
              <span className="text-xl font-extrabold text-amber-600">{lateCount} Incidents</span>
            </div>
            <div className="bg-white border rounded-lg p-4 shadow-2xs">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Absent Folders</span>
              <span className="text-xl font-extrabold text-rose-600">{absentCount} Days Absent</span>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border rounded-lg p-4 shadow-2xs flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</label>
              <select
                value={attDept}
                onChange={(e) => setAttDept(e.target.value)}
                className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white font-semibold"
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="w-48 space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance Status</label>
              <select
                value={attStatus}
                onChange={(e) => setAttStatus(e.target.value)}
                className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white font-semibold"
              >
                <option value="">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>

            <div className="w-48 space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Specific Date From</label>
              <input
                type="date"
                value={attStart}
                onChange={(e) => setAttStart(e.target.value)}
                className="w-full px-3 py-1 border rounded-lg text-xs"
              />
            </div>
          </div>

          {/* High Fidelity Print Preview Canvas */}
          <div className="bg-white border rounded-lg p-8 shadow-2xs max-w-5xl mx-auto printable-canvas">
            {/* Branded Letterhead */}
            <div className="border-b-2 border-primary-custom pb-6 flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                {config.profile.logoUrl ? (
                  <img src={config.profile.logoUrl} alt="Ethio-Re logo" className="h-12 w-12 object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-12 w-12 bg-primary-custom text-white rounded-lg flex items-center justify-center font-extrabold text-sm">
                    ER
                  </div>
                )}
                <div>
                  <h1 className="font-extrabold text-slate-800 text-sm md:text-base tracking-tight uppercase">{config.profile.legalName}</h1>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">{config.profile.displayName} SC • Human Resource Management</p>
                </div>
              </div>
              <div className="text-center sm:text-right text-[10px] font-medium text-slate-500 leading-relaxed">
                <div>Email: {config.profile.email}</div>
                <div>Phone: {config.profile.phoneNumber}</div>
                <div>Website: {config.profile.website}</div>
              </div>
            </div>

            {/* Document Details */}
            <div className="flex justify-between items-end mb-6 text-xs">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-tight">ATTENDANCE &amp; LATENESS AUDIT LOGS</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Search: {attStatus || "All"} Statuses in Department {departments.find(d => d.id === attDept)?.name || "All"}</p>
              </div>
              <div className="text-right text-slate-400 text-[10px] font-bold">
                <div>Date Generated: {new Date().toISOString().split("T")[0]}</div>
                <div>System State: Active</div>
              </div>
            </div>

            {/* Table */}
            <table className="w-full border text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b font-extrabold text-[10px] text-slate-600 uppercase tracking-wider">
                  <th className="px-4 py-2 border-r">Date</th>
                  <th className="px-4 py-2 border-r">Employee</th>
                  <th className="px-4 py-2 border-r">Check In</th>
                  <th className="px-4 py-2 border-r">Check Out</th>
                  <th className="px-4 py-2 border-r text-center">Working Hours</th>
                  <th className="px-4 py-2">Status Status</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-800 font-medium">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400">No attendance check-ins recorded for current filters.</td>
                  </tr>
                ) : (
                  filteredAttendance.map(a => {
                    const empName = employees.find(e => e.employeeId === a.employeeId)?.fullName || a.employeeId;
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 border-r font-semibold text-slate-600">{a.date}</td>
                        <td className="px-4 py-2.5 border-r">
                          <div className="font-bold">{empName}</div>
                          <div className="text-[9px] text-slate-400">{a.employeeId}</div>
                        </td>
                        <td className="px-4 py-2.5 border-r font-bold">{a.checkInTime || "--:--"}</td>
                        <td className="px-4 py-2.5 border-r font-bold">{a.checkOutTime || "--:--"}</td>
                        <td className="px-4 py-2.5 border-r text-center font-bold bg-slate-50/50">{a.workingHours} hrs</td>
                        <td className="px-4 py-2">
                          <span className={`inline-block px-1.5 py-0.5 rounded-sm text-[9px] font-extrabold ${
                            a.status === "Present" ? "text-emerald-700" :
                            a.status === "Late" ? "text-amber-700" : "text-rose-700"
                          }`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- REPORT VIEW 4: ACTIVITY AUDIT LOGS (ADMIN ONLY) --- */}
      {activeReportTab === "audit" && currentUser?.role === "Administrator" && (
        <div className="space-y-6">
          {/* Quick info banner */}
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg text-xs text-slate-600 font-medium leading-relaxed flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>This list catalogs immutable transaction actions (Created, Updated, Deleted) performed by operators within this portal session. Gated exclusively to system Administrators.</span>
          </div>

          {/* Filters */}
          <div className="bg-white border rounded-lg p-4 shadow-2xs flex flex-wrap gap-4">
            <div className="w-48 space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter Module</label>
              <select
                value={auditModule}
                onChange={(e) => setAuditModule(e.target.value)}
                className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white font-semibold"
              >
                <option value="">All Modules</option>
                <option value="Employees">Employees</option>
                <option value="Departments">Departments</option>
                <option value="Attendance">Attendance</option>
                <option value="Leave">Leave</option>
                <option value="Settings">Settings</option>
                <option value="Users">Users</option>
              </select>
            </div>

            <div className="flex-1 space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Keyword</label>
              <div className="relative">
                <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by action, details, or operator email..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Printable Table */}
          <div className="bg-white border rounded-lg p-8 shadow-2xs max-w-5xl mx-auto printable-canvas">
            {/* Branded Letterhead */}
            <div className="border-b-2 border-primary-custom pb-6 flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                {config.profile.logoUrl ? (
                  <img src={config.profile.logoUrl} alt="Ethio-Re logo" className="h-12 w-12 object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-12 w-12 bg-primary-custom text-white rounded-lg flex items-center justify-center font-extrabold text-sm">
                    ER
                  </div>
                )}
                <div>
                  <h1 className="font-extrabold text-slate-800 text-sm md:text-base tracking-tight uppercase">{config.profile.legalName}</h1>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">{config.profile.displayName} SC • Security &amp; Audit Logs</p>
                </div>
              </div>
              <div className="text-center sm:text-right text-[10px] font-medium text-slate-500 leading-relaxed">
                <div>System Environment: Secure Local State</div>
                <div>Admin Operator: {currentUser?.fullName}</div>
              </div>
            </div>

            <div className="flex justify-between items-end mb-6 text-xs">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-tight">SECURITY TRANSACTION SYSTEM AUDIT LOG</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Filter Scope: Module: {auditModule || "All"} | Query: {auditSearch || "None"}</p>
              </div>
            </div>

            {/* Table */}
            <table className="w-full border text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b font-extrabold text-[10px] text-slate-600 uppercase tracking-wider">
                  <th className="px-4 py-2 border-r">Timestamp</th>
                  <th className="px-4 py-2 border-r">Operator (User)</th>
                  <th className="px-4 py-2 border-r">Module</th>
                  <th className="px-4 py-2 border-r">Action Logged</th>
                  <th className="px-4 py-2">Operation Details</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-800 font-medium">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400">No activity transaction records logged for current filters.</td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 border-r font-semibold text-slate-600">{log.timestamp}</td>
                        <td className="px-4 py-2 border-r text-primary-custom">{log.userEmail}</td>
                        <td className="px-4 py-2 border-r text-slate-400 font-bold uppercase text-[9px] tracking-wider">{log.module}</td>
                        <td className="px-4 py-2 border-r font-extrabold text-slate-800">{log.action}</td>
                        <td className="px-4 py-2.5 text-slate-500 leading-relaxed text-[11px] font-semibold">{log.details}</td>
                      </tr>
                    ))
                  )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
