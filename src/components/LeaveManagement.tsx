import React, { useState, useEffect } from "react";
import { LeaveRecord, Employee, Department, PublicHoliday, User } from "../types";
import { calculateWorkingDaysCount, checkLeaveOverlap } from "../utils/leaveUtils";
import { 
  Plus, Search, Edit, Trash2, Calendar, Check, X, Save, 
  FileSpreadsheet, Printer, RefreshCw, Calculator, Ban, Info, AlertTriangle
} from "lucide-react";

interface LeaveManagementProps {
  leaves: LeaveRecord[];
  employees: Employee[];
  departments: Department[];
  holidays: PublicHoliday[];
  leaveAllocations: { [leaveType: string]: number };
  currentUser: User | null;
  onAddLeave: (record: LeaveRecord) => boolean;
  onUpdateLeave: (record: LeaveRecord) => void;
  onLogAction: (module: string, action: string, record: string, details: string) => void;
}

export default function LeaveManagement({
  leaves,
  employees,
  departments,
  holidays,
  leaveAllocations,
  currentUser,
  onAddLeave,
  onUpdateLeave,
  onLogAction
}: LeaveManagementProps) {
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);

  // Form Fields
  const [empIdInput, setEmpIdInput] = useState("");
  const [leaveType, setLeaveType] = useState("Annual Leave");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [leaveStatus, setLeaveStatus] = useState<any>("Active");
  const [adminBypass, setAdminBypass] = useState(false); // Admin exception override

  // Calculated Days preview state
  const [calcDaysCount, setCalcDaysCount] = useState(0);
  const [empBalanceInfo, setEmpBalanceInfo] = useState({ allocated: 0, used: 0, remaining: 0 });

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const activeEmployees = employees.filter(e => e.status === "Active");
  const leaveTypesList = Object.keys(leaveAllocations);
  const holidayDates = holidays.map(h => h.date);

  // Dynamic balance and days preview inside the form
  useEffect(() => {
    if (empIdInput && leaveType) {
      // Calculate used days for this leave type
      const used = leaves
        .filter(r => r.employeeId === empIdInput && r.leaveType === leaveType && r.status !== "Cancelled")
        .reduce((sum, r) => sum + r.daysCount, 0);
      
      const allocated = leaveAllocations[leaveType] || 0;
      setEmpBalanceInfo({
        allocated,
        used,
        remaining: Math.max(0, allocated - used)
      });
    }
  }, [empIdInput, leaveType, leaves, leaveAllocations]);

  useEffect(() => {
    const days = calculateWorkingDaysCount(startDate, endDate, holidayDates);
    setCalcDaysCount(days);
  }, [startDate, endDate, holidays]);

  const filteredLeaves = leaves.filter(rec => {
    const emp = employees.find(e => e.employeeId === rec.employeeId);
    const empName = emp ? emp.fullName.toLowerCase() : "";

    const matchSearch = 
      empName.includes(searchTerm.toLowerCase()) ||
      rec.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchType = filterType ? rec.leaveType === filterType : true;
    const matchStatus = filterStatus ? rec.status === filterStatus : true;

    return matchSearch && matchType && matchStatus;
  });

  const resetForm = () => {
    setEmpIdInput(activeEmployees[0]?.employeeId || "");
    setLeaveType(leaveTypesList[0] || "Annual Leave");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
    setReason("");
    setRemarks("");
    setLeaveStatus("Active");
    setAdminBypass(false);
    setFormError("");
    setFormSuccess("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setAddModalOpen(true);
  };

  const handleOpenEdit = (rec: LeaveRecord) => {
    setSelectedLeave(rec);
    setEmpIdInput(rec.employeeId);
    setLeaveType(rec.leaveType);
    setStartDate(rec.startDate);
    setEndDate(rec.endDate);
    setReason(rec.reason);
    setRemarks(rec.remarks);
    setLeaveStatus(rec.status);
    setAdminBypass(false);
    setFormError("");
    setFormSuccess("");
    setEditModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!empIdInput || !leaveType || !startDate || !endDate) {
      setFormError("All required fields must be completed.");
      return;
    }

    // 1. Confirm employee exists and is active
    const empObj = employees.find(e => e.employeeId === empIdInput);
    if (!empObj || empObj.status !== "Active") {
      setFormError("Selected employee is inactive or invalid. Leaves can only be recorded for active personnel.");
      return;
    }

    // 2. Confirm start date is not after end date
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      setFormError("Start date cannot be after end date.");
      return;
    }

    // 3. Check for overlapping leave records
    const isOverlapping = checkLeaveOverlap(empIdInput, startDate, endDate, leaves);
    if (isOverlapping) {
      setFormError("Date collision detected: Employee already has an overlapping active leave record during this range.");
      return;
    }

    // 4. Calculate working days
    const computedDays = calculateWorkingDaysCount(startDate, endDate, holidayDates);
    if (computedDays === 0) {
      setFormError("Calculated leave duration is 0 working days. Select date range that contains standard business days.");
      return;
    }

    // 5. Check available leave balance
    if (computedDays > empBalanceInfo.remaining && !adminBypass) {
      setFormError(`Insufficient leave balance! Requested ${computedDays} days exceeds remaining ${empBalanceInfo.remaining} days of ${leaveType}.`);
      return;
    }

    const newRec: LeaveRecord = {
      id: `LVE_${Date.now()}`,
      employeeId: empIdInput,
      leaveType,
      startDate,
      endDate,
      daysCount: computedDays,
      reason,
      status: "Active",
      remarks,
      recordedBy: currentUser?.email || "hr@ethio-re.com",
      createdDate: new Date().toISOString().replace("T", " ").substring(0, 19),
      updatedDate: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    const ok = onAddLeave(newRec);
    if (ok) {
      setFormSuccess("Leave record created and finalized successfully!");
      onLogAction(
        "Leave",
        "Leave Created",
        newRec.employeeId,
        `Recorded ${newRec.daysCount} days of ${newRec.leaveType} for ${empObj.fullName}`
      );
      setTimeout(() => {
        setAddModalOpen(false);
        resetForm();
      }, 1000);
    } else {
      setFormError("Could not log leave folder.");
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!selectedLeave) return;

    const empObj = employees.find(e => e.employeeId === empIdInput);
    if (!empObj) {
      setFormError("Employee folder does not exist.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      setFormError("Start date cannot be after end date.");
      return;
    }

    // Check overlaps excluding self
    const isOverlapping = checkLeaveOverlap(empIdInput, startDate, endDate, leaves, selectedLeave.id);
    if (isOverlapping) {
      setFormError("Date collision detected: Employee already has an overlapping active leave record during this range.");
      return;
    }

    const computedDays = calculateWorkingDaysCount(startDate, endDate, holidayDates);
    if (computedDays === 0) {
      setFormError("Calculated leave duration is 0 working days.");
      return;
    }

    // Check balance but add self's days back to available balance
    const otherUsed = leaves
      .filter(r => r.employeeId === empIdInput && r.leaveType === leaveType && r.status !== "Cancelled" && r.id !== selectedLeave.id)
      .reduce((sum, r) => sum + r.daysCount, 0);
    
    const allocated = leaveAllocations[leaveType] || 0;
    const remainingWithSelf = Math.max(0, allocated - otherUsed);

    if (computedDays > remainingWithSelf && !adminBypass) {
      setFormError(`Insufficient leave balance! Requested ${computedDays} days exceeds remaining ${remainingWithSelf} days.`);
      return;
    }

    const updatedRec: LeaveRecord = {
      ...selectedLeave,
      leaveType,
      startDate,
      endDate,
      daysCount: computedDays,
      reason,
      status: leaveStatus,
      remarks,
      updatedDate: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    onUpdateLeave(updatedRec);
    setFormSuccess("Leave record corrected successfully!");
    onLogAction(
      "Leave",
      "Leave Updated",
      updatedRec.employeeId,
      `Corrected leave folder parameters of ${leaveType} for ${empObj.fullName}`
    );
    setTimeout(() => {
      setEditModalOpen(false);
    }, 1000);
  };

  const handleCancelLeave = (rec: LeaveRecord) => {
    const confirmCheck = window.confirm(`Are you sure you want to cancel this leave record? The allocated days will be credited back to the employee.`);
    if (confirmCheck) {
      const updated = {
        ...rec,
        status: "Cancelled" as const,
        updatedDate: new Date().toISOString().replace("T", " ").substring(0, 19)
      };
      onUpdateLeave(updated);
      onLogAction(
        "Leave",
        "Leave Cancelled",
        rec.employeeId,
        `Cancelled leave schedule for employee ID ${rec.employeeId}`
      );
    }
  };

  // Simulating exports & printing
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Leave ID,Employee ID,Employee Name,Department,Leave Type,Start Date,End Date,Working Days,Status,Reason\r\n";
    
    filteredLeaves.forEach(r => {
      const emp = employees.find(e => e.employeeId === r.employeeId);
      const empName = emp ? emp.fullName : r.employeeId;
      const deptName = emp ? (departments.find(d => d.id === emp.departmentId)?.name || emp.departmentId) : "";
      csvContent += `"${r.id}","${r.employeeId}","${empName}","${deptName}","${r.leaveType}","${r.startDate}","${r.endDate}","${r.daysCount}","${r.status}","${r.reason}"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ethiore_leaves_${filterStatus || "all"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Leave Register</h2>
          <p className="text-xs text-slate-500 mt-1">Directly book, cancel, or edit active and historical leave periods.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-all"
            id="btn-export-leaves"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-all"
            id="btn-print-leaves"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            <span>Print List</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex-2 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 bg-primary-custom hover:opacity-95 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            id="btn-register-leave-trigger"
          >
            <Plus className="h-4 w-4" />
            <span>Book Leave</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search leaves by Employee ID, Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-xs ring-primary-custom"
            />
          </div>
          
          {/* Leave Type Filter */}
          <div className="w-full md:w-48">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom"
            >
              <option value="">All Leave Types</option>
              {leaveTypesList.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-40">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leave Database Table */}
      <div className="bg-white border rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Leave Type</th>
                <th className="px-6 py-3">Date Range</th>
                <th className="px-6 py-3 text-center">Business Days</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3">Reason</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                    No active or historical leave records match current filters.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map(rec => {
                  const empObj = employees.find(e => e.employeeId === rec.employeeId);
                  const empName = empObj ? empObj.fullName : rec.employeeId;
                  const deptObj = empObj ? departments.find(d => d.id === empObj.departmentId) : null;
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-800">{empName}</div>
                        <div className="text-[10px] font-bold text-primary-custom">{rec.employeeId}</div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 font-semibold uppercase">{deptObj ? deptObj.code : "N/A"}</td>
                      <td className="px-6 py-3.5 font-bold text-primary-custom uppercase tracking-wide text-[10px]">
                        {rec.leaveType}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-600">
                        {rec.startDate} to {rec.endDate}
                      </td>
                      <td className="px-6 py-3.5 text-center font-bold text-slate-800 bg-slate-50/50">
                        {rec.daysCount} days
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          rec.status === "Completed" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 max-w-[150px] truncate" title={rec.reason}>
                        {rec.reason || "-"}
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-50 rounded-md transition-colors"
                          title="Edit Leave Details"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {rec.status !== "Cancelled" && (
                          <button
                            onClick={() => handleCancelLeave(rec)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Cancel Leave"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOOK LEAVE MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-primary-custom text-white px-5 py-3.5 border-b flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-wider">Book Employee Leave</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-white/80 hover:text-white rounded-full p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                  {formSuccess}
                </div>
              )}

              {/* Employee Selection */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Select Active Employee *</label>
                <select
                  value={empIdInput}
                  onChange={(e) => setEmpIdInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom font-semibold text-slate-800"
                  required
                >
                  <option value="" disabled>Choose employee</option>
                  {activeEmployees.map(emp => {
                    const d = departments.find(dep => dep.id === emp.departmentId);
                    return (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.fullName} ({emp.employeeId} • {d ? d.name : emp.departmentId})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Leave Type */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Leave Type Selection *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom font-bold"
                  required
                >
                  {leaveTypesList.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Balance Widget */}
              {empIdInput && (
                <div className="bg-slate-50 border rounded-lg p-3 text-xs flex justify-around text-center">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Allocated</span>
                    <span className="font-bold text-slate-700">{empBalanceInfo.allocated} days</span>
                  </div>
                  <div className="border-r border-slate-200"></div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Used</span>
                    <span className="font-bold text-slate-700">{empBalanceInfo.used} days</span>
                  </div>
                  <div className="border-r border-slate-200"></div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Remaining</span>
                    <span className={`font-extrabold text-[13px] ${empBalanceInfo.remaining > 5 ? "text-slate-900" : "text-amber-600"}`}>
                      {empBalanceInfo.remaining} days
                    </span>
                  </div>
                </div>
              )}

              {/* Date Ranges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold ring-primary-custom"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold ring-primary-custom"
                    required
                  />
                </div>
              </div>

              {/* Live Calculator Badge */}
              <div className="bg-blue-50 border border-blue-100 text-blue-800 p-2.5 rounded-lg text-xs flex items-center gap-2 font-medium">
                <Calculator className="h-4 w-4 shrink-0 text-blue-600" />
                <span>
                  Calculated Duration: <strong className="text-blue-900">{calcDaysCount} Working Days</strong> (skips weekends/holidays)
                </span>
              </div>

              {/* Overdraft check with Admin bypass option */}
              {calcDaysCount > empBalanceInfo.remaining && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800 space-y-2">
                  <p className="font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    Requested days exceed available leave balance of {empBalanceInfo.remaining} days.
                  </p>
                  {currentUser?.role === "Administrator" ? (
                    <label className="flex items-center gap-2 mt-2 cursor-pointer border-t pt-2 border-amber-200">
                      <input
                        type="checkbox"
                        checked={adminBypass}
                        onChange={(e) => setAdminBypass(e.target.checked)}
                        className="rounded ring-amber-500"
                      />
                      <span className="font-bold text-slate-700">Bypass balance check (Admin Override Exception)</span>
                    </label>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-tight">
                      * Only Administrators have permissions to bypass the balance validation and force override this log.
                    </p>
                  )}
                </div>
              )}

              {/* Reason */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Reason / Details</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for requesting leave..."
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-extrabold text-white bg-primary-custom hover:opacity-95 rounded-lg flex items-center gap-1"
                >
                  <Save className="h-4 w-4 text-accent-custom" />
                  Save and Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LEAVE MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-primary-custom text-white px-5 py-3.5 border-b flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-wider">Correct Leave Entry</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-white/80 hover:text-white rounded-full p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                  {formSuccess}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Employee *</label>
                <select
                  value={empIdInput}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-slate-100 font-semibold text-slate-800 cursor-not-allowed"
                >
                  {employees.map(emp => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.fullName} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Leave Type *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom font-bold"
                  required
                >
                  {leaveTypesList.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold ring-primary-custom"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold ring-primary-custom"
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 text-blue-800 p-2 rounded-lg text-xs flex items-center gap-2 font-medium">
                <Calculator className="h-4 w-4 shrink-0 text-blue-600" />
                <span>
                  Recalculated: <strong className="text-blue-900">{calcDaysCount} Working Days</strong>
                </span>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Status</label>
                <select
                  value={leaveStatus}
                  onChange={(e) => setLeaveStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Reason</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-extrabold text-white bg-primary-custom hover:opacity-95 rounded-lg flex items-center gap-1"
                >
                  <Save className="h-4 w-4 text-accent-custom" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
