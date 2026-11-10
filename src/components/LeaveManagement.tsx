import React, { useState, useEffect, useMemo } from "react";
import { 
  LeaveRecord, Employee, Department, PublicHoliday, CompanyConfig, User,
  LeaveTypeConfig, LeaveYearConfig, EmployeeLeaveBalance, LeaveBalanceAdjustment, YearEndProcessingRecord 
} from "../types";
import { calculateWorkingDaysCount, checkLeaveOverlap, calculateEmployeeLeaveBalance } from "../utils/leaveUtils";
import { 
  Plus, Search, Edit, Trash2, Calendar, CalendarDays, Check, X, Save, 
  FileSpreadsheet, Printer, RefreshCw, Calculator, Ban, Info, AlertTriangle,
  LayoutDashboard, FileText, CheckCircle2, ShieldAlert, Clock, ArrowRight,
  Sliders, Settings, ChevronRight, Download, Filter, UserCheck, Layers, Award, ShieldCheck
} from "lucide-react";

interface LeaveManagementProps {
  leaves: LeaveRecord[];
  employees: Employee[];
  departments: Department[];
  holidays: PublicHoliday[];
  companyConfig: CompanyConfig;
  currentUser: User | null;
  initialSubTab?: string;
  onAddLeave: (record: LeaveRecord) => boolean;
  onUpdateLeave: (record: LeaveRecord) => void;
  onUpdateConfig: (config: CompanyConfig) => void;
  onLogAction: (module: string, action: string, record: string, details: string) => void;
}

export default function LeaveManagement({
  leaves,
  employees,
  departments,
  holidays,
  companyConfig,
  currentUser,
  initialSubTab = "dashboard",
  onAddLeave,
  onUpdateLeave,
  onUpdateConfig,
  onLogAction
}: LeaveManagementProps) {
  // Navigation Subtab state (dashboard, applications, balances, calendar, config, reports)
  const [activeSubTab, setActiveSubTab] = useState<string>(() => {
    if (initialSubTab && ["dashboard", "applications", "balances", "calendar", "config", "reports"].includes(initialSubTab)) {
      return initialSubTab;
    }
    return "dashboard";
  });

  useEffect(() => {
    if (initialSubTab && ["dashboard", "applications", "balances", "calendar", "config", "reports"].includes(initialSubTab)) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // System Configurations with Fallbacks
  const leaveTypesConfig: LeaveTypeConfig[] = useMemo(() => {
    if (companyConfig.leaveTypesConfig && companyConfig.leaveTypesConfig.length > 0) {
      return companyConfig.leaveTypesConfig;
    }
    // Fallback default list
    return Object.entries(companyConfig.leaveAllocations || {}).map(([name, count], index) => ({
      id: `LT00${index + 1}`,
      name,
      code: name.split(" ").map(w => w[0]).join("").toUpperCase(),
      description: `Configured ${name} for Ethiopian Reinsurance S.C.`,
      annualEntitlement: count,
      isPaid: !name.toLowerCase().includes("unpaid"),
      accrualRule: "Annual",
      carryForwardEligible: name.toLowerCase().includes("annual"),
      maxCarryForwardDays: name.toLowerCase().includes("annual") ? 10 : 0,
      expirationPeriodMonths: 12,
      requiresSupportingDocument: name.toLowerCase().includes("sick") || name.toLowerCase().includes("maternity"),
      status: "Active"
    }));
  }, [companyConfig]);

  const leaveYearConfig: LeaveYearConfig = useMemo(() => {
    return companyConfig.leaveYearConfig || {
      id: "LY2026",
      yearName: "2026",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      isCustomYear: false,
      workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      status: "Active",
      processedYearEnd: false
    };
  }, [companyConfig]);

  const activeLeaveTypes = useMemo(() => {
    return leaveTypesConfig.filter(lt => lt.status === "Active");
  }, [leaveTypesConfig]);

  const holidayDates = useMemo(() => holidays.map(h => h.date), [holidays]);

  // Adjustments & Audit Records State in LocalStorage
  const [manualAdjustments, setManualAdjustments] = useState<LeaveBalanceAdjustment[]>(() => {
    const saved = localStorage.getItem("ethiore_leave_adjustments");
    return saved ? JSON.parse(saved) : [];
  });

  const [yearEndRecords, setYearEndRecords] = useState<YearEndProcessingRecord[]>(() => {
    const saved = localStorage.getItem("ethiore_yearend_records");
    return saved ? JSON.parse(saved) : [];
  });

  const saveAdjustments = (items: LeaveBalanceAdjustment[]) => {
    setManualAdjustments(items);
    localStorage.setItem("ethiore_leave_adjustments", JSON.stringify(items));
  };

  const saveYearEndRecords = (items: YearEndProcessingRecord[]) => {
    setYearEndRecords(items);
    localStorage.setItem("ethiore_yearend_records", JSON.stringify(items));
  };

  // Compute Employee Balances
  const computedBalances: EmployeeLeaveBalance[] = useMemo(() => {
    const results: EmployeeLeaveBalance[] = [];
    const activeEmps = employees.filter(e => e.status === "Active");
    const currentYear = leaveYearConfig.yearName || "2026";

    activeEmps.forEach(emp => {
      activeLeaveTypes.forEach(lt => {
        // Calculate sum of manual adjustments for this emp & leave type
        const adjSum = manualAdjustments
          .filter(a => a.employeeId === emp.employeeId && a.leaveTypeId === lt.id && a.leaveYear === currentYear)
          .reduce((sum, a) => sum + a.amount, 0);

        // Calculate carried forward from previous year if year end was processed
        const lastYearRecord = yearEndRecords.find(y => y.toYear === currentYear);
        let carried = 0;
        if (lastYearRecord) {
          const detail = lastYearRecord.details.find(d => d.employeeId === emp.employeeId && d.leaveType === lt.name);
          if (detail) {
            carried = detail.eligibleCarryForward;
          }
        }

        const bal = calculateEmployeeLeaveBalance(emp.employeeId, lt, currentYear, leaves, carried, adjSum);
        results.push(bal);
      });
    });

    return results;
  }, [employees, activeLeaveTypes, leaveYearConfig, leaves, manualAdjustments, yearEndRecords]);

  // ==========================================
  // COMMON MODALS & STATE (Applications)
  // ==========================================
  const [appSearchTerm, setAppSearchTerm] = useState("");
  const [appFilterType, setAppFilterType] = useState("");
  const [appFilterStatus, setAppFilterStatus] = useState("");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);

  // Application Form Fields
  const [empIdInput, setEmpIdInput] = useState("");
  const [leaveType, setLeaveType] = useState("Annual Leave");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<"Morning" | "Afternoon">("Morning");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [leaveStatus, setLeaveStatus] = useState<any>("Active");
  const [adminBypass, setAdminBypass] = useState(false);

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const activeEmployees = useMemo(() => employees.filter(e => e.status === "Active"), [employees]);

  // Selected Employee's available balance preview
  const currentSelectedBalance = useMemo(() => {
    if (!empIdInput || !leaveType) return { total: 0, utilized: 0, remaining: 0 };
    const matchedBal = computedBalances.find(b => b.employeeId === empIdInput && b.leaveTypeName === leaveType);
    if (matchedBal) {
      return {
        total: matchedBal.openingBalance,
        utilized: matchedBal.leaveUtilized,
        remaining: matchedBal.remainingBalance
      };
    }
    const ltObj = activeLeaveTypes.find(t => t.name === leaveType);
    const ent = ltObj ? ltObj.annualEntitlement : 0;
    return { total: ent, utilized: 0, remaining: ent };
  }, [empIdInput, leaveType, computedBalances, activeLeaveTypes]);

  const computedWorkingDays = useMemo(() => {
    return calculateWorkingDaysCount(
      startDate,
      endDate,
      holidayDates,
      leaveYearConfig.workingDays || ["Mon", "Tue", "Wed", "Thu", "Fri"],
      isHalfDay
    );
  }, [startDate, endDate, holidayDates, leaveYearConfig, isHalfDay]);

  const resetForm = () => {
    setEmpIdInput(activeEmployees[0]?.employeeId || "");
    setLeaveType(activeLeaveTypes[0]?.name || "Annual Leave");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
    setIsHalfDay(false);
    setHalfDayPeriod("Morning");
    setReason("");
    setRemarks("");
    setDocUrl("");
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
    setIsHalfDay(!!rec.isHalfDay);
    setHalfDayPeriod(rec.halfDayPeriod || "Morning");
    setReason(rec.reason);
    setRemarks(rec.remarks);
    setDocUrl(rec.supportingDocumentUrl || "");
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

    const empObj = employees.find(e => e.employeeId === empIdInput);
    if (!empObj || empObj.status !== "Active") {
      setFormError("Selected employee is inactive or invalid.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      setFormError("Start date cannot be after end date.");
      return;
    }

    const isOverlapping = checkLeaveOverlap(empIdInput, startDate, endDate, leaves);
    if (isOverlapping) {
      setFormError("Date collision: Employee already has an overlapping active leave record during this period.");
      return;
    }

    if (computedWorkingDays === 0) {
      setFormError("Calculated leave duration is 0 working days based on company calendar.");
      return;
    }

    // Check supporting document requirement
    const targetTypeObj = activeLeaveTypes.find(t => t.name === leaveType);
    if (targetTypeObj?.requiresSupportingDocument && !docUrl.trim()) {
      setFormError(`${leaveType} policy requires a supporting document link or reference before registration.`);
      return;
    }

    // Balance check
    if (computedWorkingDays > currentSelectedBalance.remaining && !adminBypass) {
      setFormError(`Insufficient leave balance! Requested ${computedWorkingDays} days exceeds remaining ${currentSelectedBalance.remaining} days.`);
      return;
    }

    const newRec: LeaveRecord = {
      id: `LVE_${Date.now()}`,
      employeeId: empIdInput,
      leaveType,
      startDate,
      endDate,
      daysCount: computedWorkingDays,
      isHalfDay,
      halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
      reason,
      status: "Active",
      remarks,
      supportingDocumentUrl: docUrl.trim() || undefined,
      recordedBy: currentUser?.email || "system@ethiopianre.com",
      createdDate: new Date().toISOString().replace("T", " ").substring(0, 19),
      updatedDate: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    const ok = onAddLeave(newRec);
    if (ok) {
      setFormSuccess("Leave application registered successfully!");
      onLogAction(
        "Leave",
        "Leave Created",
        newRec.employeeId,
        `Registered ${newRec.daysCount} days of ${newRec.leaveType} for ${empObj.fullName}`
      );
      setTimeout(() => {
        setAddModalOpen(false);
        resetForm();
      }, 1000);
    } else {
      setFormError("Could not create leave record.");
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

    const isOverlapping = checkLeaveOverlap(empIdInput, startDate, endDate, leaves, selectedLeave.id);
    if (isOverlapping) {
      setFormError("Date collision: Employee already has an overlapping active leave record.");
      return;
    }

    if (computedWorkingDays === 0) {
      setFormError("Calculated leave duration is 0 working days.");
      return;
    }

    const updatedRec: LeaveRecord = {
      ...selectedLeave,
      leaveType,
      startDate,
      endDate,
      daysCount: computedWorkingDays,
      isHalfDay,
      halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
      reason,
      status: leaveStatus,
      remarks,
      supportingDocumentUrl: docUrl.trim() || undefined,
      updatedDate: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    onUpdateLeave(updatedRec);
    setFormSuccess("Leave record updated successfully!");
    onLogAction(
      "Leave",
      "Leave Updated",
      updatedRec.employeeId,
      `Updated leave entry of ${leaveType} for ${empObj.fullName}`
    );
    setTimeout(() => {
      setEditModalOpen(false);
    }, 1000);
  };

  const handleCancelLeave = (rec: LeaveRecord) => {
    const confirmCheck = window.confirm(`Are you sure you want to cancel this leave application? Days will be restored to the employee's available balance.`);
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
        `Cancelled leave record for employee ID ${rec.employeeId}`
      );
    }
  };

  // ==========================================
  // BALANCE ADJUSTMENT MODAL STATE
  // ==========================================
  const [adjModalOpen, setAdjModalOpen] = useState(false);
  const [adjEmpId, setAdjEmpId] = useState("");
  const [adjLeaveType, setAdjLeaveType] = useState("Annual Leave");
  const [adjAmount, setAdjAmount] = useState(0);
  const [adjReason, setAdjReason] = useState("");

  const handleOpenAdjustment = (empId?: string, typeName?: string) => {
    setAdjEmpId(empId || activeEmployees[0]?.employeeId || "");
    setAdjLeaveType(typeName || activeLeaveTypes[0]?.name || "Annual Leave");
    setAdjAmount(0);
    setAdjReason("");
    setAdjModalOpen(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjEmpId || !adjLeaveType || adjAmount === 0 || !adjReason.trim()) {
      alert("Please specify a valid non-zero adjustment amount and a mandatory reason.");
      return;
    }

    const matchedType = activeLeaveTypes.find(t => t.name === adjLeaveType);
    const targetType = matchedType ? matchedType.id : "LT001";
    const currentYear = leaveYearConfig.yearName || "2026";

    const prevBalObj = computedBalances.find(b => b.employeeId === adjEmpId && b.leaveTypeName === adjLeaveType);
    const prevRem = prevBalObj ? prevBalObj.remainingBalance : 0;
    const newRem = Math.max(0, prevRem + adjAmount);

    const newAdj: LeaveBalanceAdjustment = {
      id: `ADJ_${Date.now()}`,
      employeeId: adjEmpId,
      leaveTypeId: targetType,
      leaveTypeName: adjLeaveType,
      leaveYear: currentYear,
      adjustmentType: "Manual Adjustment",
      amount: adjAmount,
      previousRemaining: prevRem,
      newRemaining: newRem,
      reason: adjReason.trim(),
      performedBy: currentUser?.email || "system@ethiopianre.com",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    saveAdjustments([newAdj, ...manualAdjustments]);
    onLogAction("Leave", "Balance Adjustment", adjEmpId, `Manual balance adjustment of ${adjAmount > 0 ? "+" : ""}${adjAmount} days for ${adjLeaveType}. Reason: ${adjReason}`);
    setAdjModalOpen(false);
  };

  // ==========================================
  // LEAVE CONFIGURATION MODALS & STATES
  // ==========================================
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveTypeConfig | null>(null);

  const [ltName, setLtName] = useState("");
  const [ltCode, setLtCode] = useState("");
  const [ltDesc, setLtDesc] = useState("");
  const [ltEntitlement, setLtEntitlement] = useState(30);
  const [ltPaid, setLtPaid] = useState(true);
  const [ltAccrual, setLtAccrual] = useState<"Annual" | "Monthly" | "Immediate">("Annual");
  const [ltCarryEligible, setLtCarryEligible] = useState(true);
  const [ltMaxCarry, setLtMaxCarry] = useState(10);
  const [ltExpMonths, setLtExpMonths] = useState(12);
  const [ltRequiresDoc, setLtRequiresDoc] = useState(false);
  const [ltStatus, setLtStatus] = useState<"Active" | "Inactive">("Active");

  const handleOpenTypeModal = (typeObj?: LeaveTypeConfig) => {
    if (typeObj) {
      setEditingType(typeObj);
      setLtName(typeObj.name);
      setLtCode(typeObj.code);
      setLtDesc(typeObj.description);
      setLtEntitlement(typeObj.annualEntitlement);
      setLtPaid(typeObj.isPaid);
      setLtAccrual(typeObj.accrualRule);
      setLtCarryEligible(typeObj.carryForwardEligible);
      setLtMaxCarry(typeObj.maxCarryForwardDays);
      setLtExpMonths(typeObj.expirationPeriodMonths);
      setLtRequiresDoc(typeObj.requiresSupportingDocument);
      setLtStatus(typeObj.status);
    } else {
      setEditingType(null);
      setLtName("");
      setLtCode("");
      setLtDesc("");
      setLtEntitlement(15);
      setLtPaid(true);
      setLtAccrual("Annual");
      setLtCarryEligible(false);
      setLtMaxCarry(0);
      setLtExpMonths(12);
      setLtRequiresDoc(false);
      setLtStatus("Active");
    }
    setTypeModalOpen(true);
  };

  const handleSaveTypeConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ltName.trim() || !ltCode.trim()) {
      alert("Please provide both a Name and a Code for the Leave Type.");
      return;
    }

    const updatedTypes = [...leaveTypesConfig];
    if (editingType) {
      const idx = updatedTypes.findIndex(t => t.id === editingType.id);
      if (idx !== -1) {
        updatedTypes[idx] = {
          ...editingType,
          name: ltName.trim(),
          code: ltCode.trim().toUpperCase(),
          description: ltDesc.trim(),
          annualEntitlement: Number(ltEntitlement),
          isPaid: ltPaid,
          accrualRule: ltAccrual,
          carryForwardEligible: ltCarryEligible,
          maxCarryForwardDays: ltCarryEligible ? Number(ltMaxCarry) : 0,
          expirationPeriodMonths: Number(ltExpMonths),
          requiresSupportingDocument: ltRequiresDoc,
          status: ltStatus
        };
      }
    } else {
      const newType: LeaveTypeConfig = {
        id: `LT_${Date.now()}`,
        name: ltName.trim(),
        code: ltCode.trim().toUpperCase(),
        description: ltDesc.trim(),
        annualEntitlement: Number(ltEntitlement),
        isPaid: ltPaid,
        accrualRule: ltAccrual,
        carryForwardEligible: ltCarryEligible,
        maxCarryForwardDays: ltCarryEligible ? Number(ltMaxCarry) : 0,
        expirationPeriodMonths: Number(ltExpMonths),
        requiresSupportingDocument: ltRequiresDoc,
        status: ltStatus
      };
      updatedTypes.push(newType);
    }

    const newAllocations = { ...companyConfig.leaveAllocations };
    updatedTypes.forEach(t => {
      newAllocations[t.name] = t.annualEntitlement;
    });

    const updatedCompanyConfig: CompanyConfig = {
      ...companyConfig,
      leaveAllocations: newAllocations,
      leaveTypesConfig: updatedTypes
    };

    onUpdateConfig(updatedCompanyConfig);
    onLogAction("LeaveConfig", editingType ? "Update Leave Type" : "Create Leave Type", ltName, "Updated leave type rules and entitlements");
    setTypeModalOpen(false);
  };

  // Leave Year & Working Days Form
  const [lyYearName, setLyYearName] = useState(leaveYearConfig.yearName);
  const [lyStart, setLyStart] = useState(leaveYearConfig.startDate);
  const [lyEnd, setLyEnd] = useState(leaveYearConfig.endDate);
  const [lyWorkingDays, setLyWorkingDays] = useState<string[]>(leaveYearConfig.workingDays || ["Mon", "Tue", "Wed", "Thu", "Fri"]);

  const handleSaveYearConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedYearConfig: LeaveYearConfig = {
      ...leaveYearConfig,
      yearName: lyYearName.trim(),
      startDate: lyStart,
      endDate: lyEnd,
      workingDays: lyWorkingDays
    };

    onUpdateConfig({
      ...companyConfig,
      leaveYearConfig: updatedYearConfig
    });
    onLogAction("LeaveConfig", "Update Leave Year Policy", lyYearName, `Updated leave year schedule to ${lyStart} -> ${lyEnd} with working days ${lyWorkingDays.join(",")}`);
    alert("Leave Year & Working Day configuration saved successfully!");
  };

  // Year End Carry Forward Execution Modal State
  const [yearEndModalOpen, setYearEndModalOpen] = useState(false);
  const [yeFromYear, setYeFromYear] = useState("2025");
  const [yeToYear, setYeToYear] = useState("2026");

  const yearEndPreview = useMemo(() => {
    const detailsList: YearEndProcessingRecord["details"] = [];
    let totalCarried = 0;
    let totalExpired = 0;

    activeEmployees.forEach(emp => {
      const deptObj = departments.find(d => d.id === emp.departmentId);
      activeLeaveTypes.forEach(lt => {
        // Calculate utilized in previous year
        const prevUtilized = leaves
          .filter(r => r.employeeId === emp.employeeId && r.leaveType === lt.name && r.status !== "Cancelled" && (r.startDate && r.startDate.startsWith(yeFromYear)))
          .reduce((sum, r) => sum + r.daysCount, 0);

        const prevOpening = lt.annualEntitlement;
        const unused = Math.max(0, prevOpening - prevUtilized);

        let eligibleCarry = 0;
        let expired = 0;

        if (lt.carryForwardEligible && unused > 0) {
          eligibleCarry = Math.min(unused, lt.maxCarryForwardDays);
          expired = Math.max(0, unused - eligibleCarry);
        } else {
          expired = unused;
        }

        const newOpening = lt.annualEntitlement + eligibleCarry;

        totalCarried += eligibleCarry;
        totalExpired += expired;

        detailsList.push({
          employeeId: emp.employeeId,
          employeeName: emp.fullName,
          departmentName: deptObj ? deptObj.name : emp.departmentId,
          leaveType: lt.name,
          prevOpening,
          entitlement: lt.annualEntitlement,
          utilized: prevUtilized,
          unused,
          eligibleCarryForward: eligibleCarry,
          expired,
          newOpening
        });
      });
    });

    return {
      detailsList,
      totalCarried,
      totalExpired
    };
  }, [activeEmployees, activeLeaveTypes, leaves, departments, yeFromYear]);

  const handleExecuteYearEnd = () => {
    // Check if transition already processed
    const alreadyProcessed = yearEndRecords.some(r => r.fromYear === yeFromYear && r.toYear === yeToYear);
    if (alreadyProcessed) {
      const overwrite = window.confirm(`Year-end transition from ${yeFromYear} to ${yeToYear} was previously processed. Recalculate and update transition audit records?`);
      if (!overwrite) return;
    }

    const newRecord: YearEndProcessingRecord = {
      id: `YE_${yeFromYear}_${yeToYear}_${Date.now()}`,
      fromYear: yeFromYear,
      toYear: yeToYear,
      processedDate: new Date().toISOString().replace("T", " ").substring(0, 19),
      processedBy: currentUser?.email || "contactesfaye@gmail.com",
      totalEmployeesProcessed: activeEmployees.length,
      totalCarriedForwardDays: yearEndPreview.totalCarried,
      totalExpiredDays: yearEndPreview.totalExpired,
      details: yearEndPreview.detailsList
    };

    const updatedRecords = [newRecord, ...yearEndRecords.filter(r => !(r.fromYear === yeFromYear && r.toYear === yeToYear))];
    saveYearEndRecords(updatedRecords);

    // Update Company Config year state
    onUpdateConfig({
      ...companyConfig,
      leaveYearConfig: {
        ...leaveYearConfig,
        yearName: yeToYear,
        processedYearEnd: true,
        processedDate: new Date().toISOString().replace("T", " ").substring(0, 19),
        processedBy: currentUser?.email || "contactesfaye@gmail.com"
      }
    });

    onLogAction("YearEndProcessing", "Year End Transition", `${yeFromYear}->${yeToYear}`, `Processed year-end carry forward: ${yearEndPreview.totalCarried} days carried forward, ${yearEndPreview.totalExpired} days expired across ${activeEmployees.length} employees`);
    alert(`Year-end carry forward processing completed successfully! Transferred ${yearEndPreview.totalCarried} eligible days into ${yeToYear} balances.`);
    setYearEndModalOpen(false);
  };

  // ==========================================
  // CALENDAR STATE
  // ==========================================
  const [calMonth, setCalMonth] = useState<number>(new Date().getMonth());
  const [calYear, setCalYear] = useState<number>(2026);
  const [calDeptFilter, setCalDeptFilter] = useState("");

  const daysInMonth = useMemo(() => {
    return new Date(calYear, calMonth + 1, 0).getDate();
  }, [calYear, calMonth]);

  const monthName = useMemo(() => {
    return new Date(calYear, calMonth, 1).toLocaleString("default", { month: "long" });
  }, [calYear, calMonth]);

  // Overlapping detection for calendar
  const calOverlaps = useMemo(() => {
    const activeLeaves = leaves.filter(l => l.status === "Active");
    const deptGrouped: { [dateStr: string]: { [deptId: string]: number } } = {};

    activeLeaves.forEach(l => {
      const emp = employees.find(e => e.employeeId === l.employeeId);
      if (!emp) return;
      const deptId = emp.departmentId;

      const curr = new Date(l.startDate);
      const end = new Date(l.endDate);
      while (curr <= end) {
        const dStr = curr.toISOString().split("T")[0];
        if (!deptGrouped[dStr]) deptGrouped[dStr] = {};
        deptGrouped[dStr][deptId] = (deptGrouped[dStr][deptId] || 0) + 1;
        curr.setDate(curr.getDate() + 1);
      }
    });

    const collisionDates: { date: string; deptName: string; count: number }[] = [];
    Object.entries(deptGrouped).forEach(([dStr, deptCounts]) => {
      Object.entries(deptCounts).forEach(([deptId, count]) => {
        if (count > 1) {
          const dObj = departments.find(d => d.id === deptId);
          collisionDates.push({
            date: dStr,
            deptName: dObj ? dObj.name : deptId,
            count
          });
        }
      });
    });

    return collisionDates;
  }, [leaves, employees, departments]);

  // ==========================================
  // REPORTS STATE
  // ==========================================
  const [reportType, setReportType] = useState<
    "employee" | "department" | "utilization" | "balance" | "expiration" | "yearend"
  >("yearend");
  const [reportDeptFilter, setReportDeptFilter] = useState("");

  const handleExportReportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,";
    if (reportType === "yearend") {
      csv += "Employee ID,Employee Name,Department,Previous Year Opening,Annual Entitlement,Leave Utilized,Unused Balance,Eligible Carry Forward,Expired Balance,New Year Opening\r\n";
      const latestYe = yearEndRecords[0];
      const rows = latestYe ? latestYe.details : yearEndPreview.detailsList;
      rows.forEach(r => {
        csv += `"${r.employeeId}","${r.employeeName}","${r.departmentName}","${r.prevOpening}","${r.entitlement}","${r.utilized}","${r.unused}","${r.eligibleCarryForward}","${r.expired}","${r.newOpening}"\r\n`;
      });
    } else if (reportType === "balance") {
      csv += "Employee ID,Employee Name,Department,Leave Type,Opening Balance,Annual Entitlement,Carried Forward,Utilized,Expired,Remaining Balance\r\n";
      computedBalances.forEach(b => {
        const emp = employees.find(e => e.employeeId === b.employeeId);
        const dept = emp ? departments.find(d => d.id === emp.departmentId) : null;
        csv += `"${b.employeeId}","${emp?.fullName || b.employeeId}","${dept?.name || ""}","${b.leaveTypeName}","${b.openingBalance}","${b.annualEntitlement}","${b.carriedForwardBalance}","${b.leaveUtilized}","${b.expiredLeave}","${b.remainingBalance}"\r\n`;
      });
    } else {
      csv += "Employee ID,Leave Type,Start Date,End Date,Working Days,Status,Reason\r\n";
      leaves.forEach(l => {
        csv += `"${l.employeeId}","${l.leaveType}","${l.startDate}","${l.endDate}","${l.daysCount}","${l.status}","${l.reason}"\r\n`;
      });
    }

    const encoded = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", `ethiore_leave_report_${reportType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // RENDER CONTENT BY SUBMENU TAB
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-600">
              <CalendarDays className="h-5 w-5" />
            </span>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">Corporate Leave Management System</h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-primary-custom text-accent-custom uppercase tracking-wider">
              FY {leaveYearConfig.yearName}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Ethiopian Reinsurance S.C. integrated leave management, accruals, calendar schedules, carry-forward, and expiration engine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser?.role === "Auditor" && (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              <span>Read-Only Auditor Mode</span>
            </span>
          )}
          {currentUser?.role === "Administrator" && (
            <button
              onClick={() => {
                setActiveSubTab("config");
                setYearEndModalOpen(true);
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Year-End Processing</span>
            </button>
          )}
          {currentUser?.role !== "Auditor" && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-primary-custom hover:opacity-95 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5 text-accent-custom" />
              <span>Book Leave Application</span>
            </button>
          )}
        </div>
      </div>

      {/* Submenu Tab Bar */}
      <div className="bg-white border-b border-slate-200 rounded-xl p-1 shadow-2xs flex items-center gap-1 overflow-x-auto text-xs font-bold">
        {[
          { id: "dashboard", label: "1. Leave Dashboard", icon: LayoutDashboard },
          { id: "applications", label: "2. Leave Applications", icon: FileText },
          { id: "balances", label: "3. Leave Balances", icon: Award },
          { id: "calendar", label: "4. Leave Calendar", icon: Calendar },
          { id: "config", label: "5. Leave Configuration", icon: Settings, adminOnly: true },
          { id: "reports", label: "6. Leave Reports", icon: FileSpreadsheet }
        ].map(tab => {
          if (tab.adminOnly && currentUser?.role !== "Administrator" && currentUser?.role !== "Auditor") return null;
          const IconComp = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                isActive
                  ? "bg-primary-custom text-accent-custom shadow-xs font-extrabold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <IconComp className="h-3.5 w-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================== */}
      {/* SUBMENU 1: LEAVE DASHBOARD */}
      {/* ========================================== */}
      {activeSubTab === "dashboard" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Executive Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Leaves Today</p>
                <p className="text-xl font-extrabold text-slate-800 mt-1">
                  {leaves.filter(l => {
                    const today = new Date().toISOString().split("T")[0];
                    return l.status === "Active" && l.startDate <= today && l.endDate >= today;
                  }).length} Personnel
                </p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Days Utilized YTD</p>
                <p className="text-xl font-extrabold text-slate-800 mt-1">
                  {leaves.filter(l => l.status !== "Cancelled").reduce((s, l) => s + l.daysCount, 0)} Days
                </p>
              </div>
              <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configured Leave Types</p>
                <p className="text-xl font-extrabold text-slate-800 mt-1">
                  {activeLeaveTypes.length} Active Policies
                </p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Layers className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Carried Forward Balance</p>
                <p className="text-xl font-extrabold text-slate-800 mt-1">
                  {computedBalances.reduce((s, b) => s + b.carriedForwardBalance, 0)} Days
                </p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Award className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Personnel Currently on Leave */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-600" /> Currently Active Leave Roster
                </h3>
                <button
                  onClick={() => setActiveSubTab("applications")}
                  className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
                >
                  View All Applications <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase border-b">
                      <th className="p-3">Employee</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Leave Type</th>
                      <th className="p-3">Date Range</th>
                      <th className="p-3 text-center">Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaves.filter(l => l.status === "Active").length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                          No active leave applications on schedule today.
                        </td>
                      </tr>
                    ) : (
                      leaves.filter(l => l.status === "Active").slice(0, 5).map(l => {
                        const emp = employees.find(e => e.employeeId === l.employeeId);
                        const dept = emp ? departments.find(d => d.id === emp.departmentId) : null;
                        return (
                          <tr key={l.id} className="hover:bg-slate-50/50">
                            <td className="p-3">
                              <span className="font-bold text-slate-800 block">{emp?.fullName || l.employeeId}</span>
                              <span className="text-[10px] text-primary-custom font-semibold">{l.employeeId}</span>
                            </td>
                            <td className="p-3 font-semibold text-slate-500 uppercase">{dept?.code || "N/A"}</td>
                            <td className="p-3 font-bold text-sky-600 text-[10px] uppercase">{l.leaveType}</td>
                            <td className="p-3 text-slate-600">{l.startDate} to {l.endDate}</td>
                            <td className="p-3 text-center font-bold text-slate-800">{l.daysCount} d</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Leave Distribution Progress */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-500" /> Policy Entitlements
              </h3>
              <div className="space-y-3">
                {activeLeaveTypes.map(lt => {
                  const used = leaves.filter(l => l.leaveType === lt.name && l.status !== "Cancelled").reduce((s, l) => s + l.daysCount, 0);
                  const total = lt.annualEntitlement * Math.max(1, activeEmployees.length);
                  const pct = Math.min(100, Math.round((used / (total || 1)) * 100));
                  return (
                    <div key={lt.id} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-700">{lt.name} ({lt.code})</span>
                        <span className="text-slate-500">{used} Days Utilized</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pct > 80 ? "bg-rose-500" : pct > 50 ? "bg-amber-500" : "bg-sky-500"
                          }`}
                          style={{ width: `${Math.max(5, pct)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SUBMENU 2: LEAVE APPLICATIONS */}
      {/* ========================================== */}
      {activeSubTab === "applications" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Action & Filter Toolbar */}
          <div className="bg-white border rounded-xl p-4 shadow-2xs flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Employee ID or Name..."
                  value={appSearchTerm}
                  onChange={(e) => setAppSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs ring-primary-custom"
                />
              </div>

              <select
                value={appFilterType}
                onChange={(e) => setAppFilterType(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-xs bg-white ring-primary-custom font-semibold"
              >
                <option value="">All Leave Types</option>
                {activeLeaveTypes.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>

              <select
                value={appFilterStatus}
                onChange={(e) => setAppFilterStatus(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-xs bg-white ring-primary-custom font-semibold"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              {currentUser?.role !== "Auditor" && (
                <button
                  onClick={handleOpenAdd}
                  className="px-3 py-1.5 bg-primary-custom text-white text-xs font-bold rounded-lg hover:opacity-95 flex items-center gap-1 transition-all"
                >
                  <Plus className="h-3.5 w-3.5 text-accent-custom" /> Book Leave
                </button>
              )}
            </div>
          </div>

          {/* High Density Table */}
          <div className="bg-white border rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Leave Type</th>
                    <th className="px-5 py-3">Date Range</th>
                    <th className="px-5 py-3 text-center">Working Days</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3">Reason / Ref</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaves.filter(l => {
                    const emp = employees.find(e => e.employeeId === l.employeeId);
                    const matchSearch = (emp?.fullName || l.employeeId).toLowerCase().includes(appSearchTerm.toLowerCase());
                    const matchType = appFilterType ? l.leaveType === appFilterType : true;
                    const matchStatus = appFilterStatus ? l.status === appFilterStatus : true;
                    return matchSearch && matchType && matchStatus;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                        No leave records match the specified filters.
                      </td>
                    </tr>
                  ) : (
                    leaves.filter(l => {
                      const emp = employees.find(e => e.employeeId === l.employeeId);
                      const matchSearch = (emp?.fullName || l.employeeId).toLowerCase().includes(appSearchTerm.toLowerCase());
                      const matchType = appFilterType ? l.leaveType === appFilterType : true;
                      const matchStatus = appFilterStatus ? l.status === appFilterStatus : true;
                      return matchSearch && matchType && matchStatus;
                    }).map(l => {
                      const emp = employees.find(e => e.employeeId === l.employeeId);
                      const dept = emp ? departments.find(d => d.id === emp.departmentId) : null;
                      return (
                        <tr key={l.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-3">
                            <span className="font-bold text-slate-800 block">{emp?.fullName || l.employeeId}</span>
                            <span className="text-[10px] text-primary-custom font-bold">{l.employeeId}</span>
                          </td>
                          <td className="px-5 py-3 text-slate-500 font-semibold uppercase">{dept?.code || "N/A"}</td>
                          <td className="px-5 py-3 font-bold text-sky-600 text-[10px] uppercase">{l.leaveType}</td>
                          <td className="px-5 py-3 text-slate-600 font-medium">
                            {l.startDate} to {l.endDate}
                            {l.isHalfDay && (
                              <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-bold">
                                Half-Day ({l.halfDayPeriod})
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-center font-bold text-slate-800">{l.daysCount} d</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              l.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                              l.status === "Completed" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                              "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}>
                              {l.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-500 max-w-[150px] truncate" title={l.reason}>
                            {l.reason || "-"}
                          </td>
                          <td className="px-5 py-3 text-right space-x-1 whitespace-nowrap">
                            {currentUser?.role !== "Auditor" ? (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(l)}
                                  className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded"
                                  title="Edit Application"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                {l.status !== "Cancelled" && (
                                  <button
                                    onClick={() => handleCancelLeave(l)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                    title="Cancel Application"
                                  >
                                    <Ban className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Read-Only</span>
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
        </div>
      )}

      {/* ========================================== */}
      {/* SUBMENU 3: LEAVE BALANCES */}
      {/* ========================================== */}
      {activeSubTab === "balances" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row justify-between items-center gap-3">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" /> Employee Leave Balance Register ({computedBalances.length} Records)
            </h3>
            <div className="flex items-center gap-2">
              {currentUser?.role === "Administrator" && (
                <button
                  onClick={() => handleOpenAdjustment()}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-2xs"
                >
                  <Sliders className="h-3.5 w-3.5" /> Manual Balance Adjustment
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Employee ID</th>
                    <th className="px-4 py-3">Employee Name</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Leave Type</th>
                    <th className="px-4 py-3 text-center">Opening</th>
                    <th className="px-4 py-3 text-center">Entitlement</th>
                    <th className="px-4 py-3 text-center">Carried Forward</th>
                    <th className="px-4 py-3 text-center">Utilized</th>
                    <th className="px-4 py-3 text-center">Expired</th>
                    <th className="px-4 py-3 text-center bg-slate-100/70 font-extrabold">Remaining</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {computedBalances.map(bal => {
                    const emp = employees.find(e => e.employeeId === bal.employeeId);
                    const dept = emp ? departments.find(d => d.id === emp.departmentId) : null;
                    return (
                      <tr key={bal.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold text-primary-custom">{bal.employeeId}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{emp?.fullName || bal.employeeId}</td>
                        <td className="px-4 py-3 text-slate-500 font-medium uppercase">{dept?.name || "N/A"}</td>
                        <td className="px-4 py-3 font-bold text-sky-600 text-[10px] uppercase">{bal.leaveTypeName}</td>
                        <td className="px-4 py-3 text-center text-slate-600 font-semibold">{bal.openingBalance} d</td>
                        <td className="px-4 py-3 text-center text-slate-600">{bal.annualEntitlement} d</td>
                        <td className="px-4 py-3 text-center text-indigo-600 font-bold">{bal.carriedForwardBalance} d</td>
                        <td className="px-4 py-3 text-center text-rose-600 font-bold">{bal.leaveUtilized} d</td>
                        <td className="px-4 py-3 text-center text-slate-400 font-medium">{bal.expiredLeave} d</td>
                        <td className="px-4 py-3 text-center bg-slate-50 font-extrabold text-sm text-slate-900">
                          {bal.remainingBalance} d
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleOpenAdjustment(bal.employeeId, bal.leaveTypeName)}
                            className="p-1 px-2 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 transition-all"
                            title="Adjust Balance"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SUBMENU 4: LEAVE CALENDAR */}
      {/* ========================================== */}
      {activeSubTab === "calendar" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border rounded-xl p-4 shadow-2xs flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (calMonth === 0) {
                    setCalMonth(11);
                    setCalYear(calYear - 1);
                  } else {
                    setCalMonth(calMonth - 1);
                  }
                }}
                className="p-1.5 border rounded-lg hover:bg-slate-50 font-bold text-xs"
              >
                &larr; Prev
              </button>
              <h2 className="text-sm font-extrabold text-slate-800 tracking-wide">
                {monthName} {calYear} Schedule
              </h2>
              <button
                onClick={() => {
                  if (calMonth === 11) {
                    setCalMonth(0);
                    setCalYear(calYear + 1);
                  } else {
                    setCalMonth(calMonth + 1);
                  }
                }}
                className="p-1.5 border rounded-lg hover:bg-slate-50 font-bold text-xs"
              >
                Next &rarr;
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={calDeptFilter}
                onChange={(e) => setCalDeptFilter(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-xs bg-white font-semibold"
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Overlapping Collision Banner */}
          {calOverlaps.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong>Overlapping Schedule Notice:</strong> Multiple employees in <strong>{calOverlaps[0].deptName}</strong> are scheduled on leave on {calOverlaps[0].date}.
              </span>
            </div>
          )}

          {/* Calendar Grid */}
          <div className="bg-white border rounded-xl p-4 shadow-2xs overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500 uppercase pb-2 border-b">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              <div className="grid grid-cols-7 gap-1 pt-2">
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                  const dateObj = new Date(calYear, calMonth, dayNum);
                  const dayOfWeek = dateObj.getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const holiday = holidays.find(h => h.date === dateStr);

                  // Find active leaves on this day
                  const activeOnDay = leaves.filter(l => {
                    if (l.status === "Cancelled") return false;
                    const emp = employees.find(e => e.employeeId === l.employeeId);
                    if (calDeptFilter && emp?.departmentId !== calDeptFilter) return false;
                    return l.startDate <= dateStr && l.endDate >= dateStr;
                  });

                  return (
                    <div
                      key={dayNum}
                      className={`min-h-[90px] p-1.5 border rounded-lg flex flex-col justify-between text-left transition-all ${
                        isWeekend ? "bg-slate-50/70 border-slate-100" : "bg-white border-slate-200"
                      } ${holiday ? "bg-amber-50/60 border-amber-200" : ""}`}
                    >
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className={holiday ? "text-amber-800 font-extrabold" : "text-slate-700"}>{dayNum}</span>
                        {holiday && (
                          <span className="p-0.5 bg-amber-200 text-amber-900 rounded text-[8px] font-black" title={holiday.name}>
                            Holiday
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 mt-1">
                        {activeOnDay.map(l => {
                          const emp = employees.find(e => e.employeeId === l.employeeId);
                          return (
                            <div
                              key={l.id}
                              className="p-1 bg-sky-50 border border-sky-200 text-sky-900 rounded text-[9px] font-extrabold truncate"
                              title={`${emp?.fullName} - ${l.leaveType}`}
                            >
                              {emp?.fullName?.split(" ")[0]} ({l.leaveType.split(" ")[0]})
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SUBMENU 5: LEAVE CONFIGURATION */}
      {/* ========================================== */}
      {activeSubTab === "config" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Policy Section 1: Leave Types */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary-custom" /> Configured Leave Policies & Entitlements
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Configure accruals, carry-forward caps, paid status, and documentation requirements.
                </p>
              </div>
              {currentUser?.role !== "Auditor" && (
                <button
                  onClick={() => handleOpenTypeModal()}
                  className="px-3 py-1.5 bg-primary-custom text-white text-xs font-bold rounded-lg hover:opacity-95 flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5 text-accent-custom" /> Create Leave Type
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3">Policy Name</th>
                    <th className="p-3">Code</th>
                    <th className="p-3 text-center">Entitlement</th>
                    <th className="p-3 text-center">Paid Status</th>
                    <th className="p-3 text-center">Carry-Forward Limit</th>
                    <th className="p-3 text-center">Doc Required</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaveTypesConfig.map(lt => (
                    <tr key={lt.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-800">{lt.name}</td>
                      <td className="p-3 font-bold text-primary-custom">{lt.code}</td>
                      <td className="p-3 text-center font-bold text-slate-800">{lt.annualEntitlement} Days</td>
                      <td className="p-3 text-center font-semibold">
                        {lt.isPaid ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-[10px]">Paid</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full border border-rose-200 text-[10px]">Unpaid</span>
                        )}
                      </td>
                      <td className="p-3 text-center text-slate-600">
                        {lt.carryForwardEligible ? `${lt.maxCarryForwardDays} Days Max` : "No"}
                      </td>
                      <td className="p-3 text-center font-medium">
                        {lt.requiresSupportingDocument ? "Yes (Mandatory)" : "Optional"}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          lt.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                        }`}>
                          {lt.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {currentUser?.role !== "Auditor" ? (
                          <button
                            onClick={() => handleOpenTypeModal(lt)}
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Read-Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Policy Section 2: Leave Year & Working Days */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4 text-sky-600" /> Leave Year & Working Day Schedule Policy
            </h3>
            <form onSubmit={handleSaveYearConfig} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Leave Year Name</label>
                <input
                  type="text"
                  value={lyYearName}
                  onChange={(e) => setLyYearName(e.target.value)}
                  readOnly={currentUser?.role === "Auditor"}
                  className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold read-only:bg-slate-50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={lyStart}
                  onChange={(e) => setLyStart(e.target.value)}
                  readOnly={currentUser?.role === "Auditor"}
                  className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold read-only:bg-slate-50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={lyEnd}
                  onChange={(e) => setLyEnd(e.target.value)}
                  readOnly={currentUser?.role === "Auditor"}
                  className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold read-only:bg-slate-50"
                  required
                />
              </div>

              <div className="md:col-span-3 space-y-1 pt-2">
                <label className="block text-xs font-bold text-slate-700">Company Working Days</label>
                <div className="flex flex-wrap gap-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                    <label key={day} className="flex items-center gap-1.5 px-3 py-1 border rounded-lg text-xs font-bold bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lyWorkingDays.includes(day)}
                        disabled={currentUser?.role === "Auditor"}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLyWorkingDays([...lyWorkingDays, day]);
                          } else {
                            setLyWorkingDays(lyWorkingDays.filter(d => d !== day));
                          }
                        }}
                      />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-3 flex justify-end">
                {currentUser?.role !== "Auditor" ? (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-custom text-white font-bold text-xs rounded-lg hover:opacity-95 flex items-center gap-1"
                  >
                    <Save className="h-4 w-4 text-accent-custom" /> Save Schedule Policy
                  </button>
                ) : (
                  <div className="w-full flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Read-Only Auditor Mode: Schedule rules and working days are locked.</span>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SUBMENU 6: LEAVE REPORTS */}
      {/* ========================================== */}
      {activeSubTab === "reports" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border rounded-xl p-4 shadow-2xs flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Leave Reports & Compliance</h3>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="px-3 py-1.5 border rounded-lg text-xs bg-white font-bold text-slate-800"
              >
                <option value="yearend">Year-End Carry-Forward Report</option>
                <option value="balance">Employee Leave Balance Report</option>
                <option value="employee">Employee Leave Report</option>
                <option value="department">Department Leave Report</option>
                <option value="utilization">Annual Leave Utilization Report</option>
                <option value="expiration">Leave Expiration Report</option>
              </select>

              <button
                onClick={handleExportReportCSV}
                className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 flex items-center gap-1"
              >
                <Download className="h-3.5 w-3.5" /> Export Excel
              </button>

              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-700 text-white font-bold text-xs rounded-lg hover:bg-slate-800 flex items-center gap-1"
              >
                <Printer className="h-3.5 w-3.5" /> Print PDF
              </button>
            </div>
          </div>

          {/* Report Data Table */}
          <div className="bg-white border rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              {reportType === "yearend" && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase">
                      <th className="p-3">Employee ID</th>
                      <th className="p-3">Employee Name</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Leave Type</th>
                      <th className="p-3 text-center">Prev Opening</th>
                      <th className="p-3 text-center">Entitlement</th>
                      <th className="p-3 text-center">Utilized</th>
                      <th className="p-3 text-center">Unused Balance</th>
                      <th className="p-3 text-center font-bold text-indigo-600">Eligible Carry-Forward</th>
                      <th className="p-3 text-center text-rose-600">Expired Balance</th>
                      <th className="p-3 text-center bg-slate-100 font-extrabold">New Year Opening</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {yearEndPreview.detailsList.map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-primary-custom">{d.employeeId}</td>
                        <td className="p-3 font-semibold text-slate-800">{d.employeeName}</td>
                        <td className="p-3 text-slate-500">{d.departmentName}</td>
                        <td className="p-3 font-bold text-sky-600 text-[10px] uppercase">{d.leaveType}</td>
                        <td className="p-3 text-center">{d.prevOpening} d</td>
                        <td className="p-3 text-center">{d.entitlement} d</td>
                        <td className="p-3 text-center text-rose-600 font-bold">{d.utilized} d</td>
                        <td className="p-3 text-center font-bold text-slate-700">{d.unused} d</td>
                        <td className="p-3 text-center font-extrabold text-indigo-600">{d.eligibleCarryForward} d</td>
                        <td className="p-3 text-center font-bold text-slate-400">{d.expired} d</td>
                        <td className="p-3 text-center font-extrabold bg-slate-50 text-slate-900">{d.newOpening} d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType !== "yearend" && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase">
                      <th className="p-3">Employee ID</th>
                      <th className="p-3">Leave Type</th>
                      <th className="p-3">Start Date</th>
                      <th className="p-3">End Date</th>
                      <th className="p-3 text-center">Working Days</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaves.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-primary-custom">{l.employeeId}</td>
                        <td className="p-3 font-bold text-sky-600 text-[10px] uppercase">{l.leaveType}</td>
                        <td className="p-3 text-slate-600">{l.startDate}</td>
                        <td className="p-3 text-slate-600">{l.endDate}</td>
                        <td className="p-3 text-center font-bold text-slate-800">{l.daysCount} d</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px]">
                            {l.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{l.reason || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: MANUAL BALANCE ADJUSTMENT */}
      {/* ========================================== */}
      {adjModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-primary-custom text-white px-5 py-3.5 border-b flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-wider">Manual Balance Adjustment</h3>
              <button onClick={() => setAdjModalOpen(false)} className="text-white/80 hover:text-white rounded-full p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Select Employee *</label>
                <select
                  value={adjEmpId}
                  onChange={(e) => setAdjEmpId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                  required
                >
                  {activeEmployees.map(e => (
                    <option key={e.employeeId} value={e.employeeId}>{e.fullName} ({e.employeeId})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Leave Type *</label>
                <select
                  value={adjLeaveType}
                  onChange={(e) => setAdjLeaveType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                  required
                >
                  {activeLeaveTypes.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Adjustment Days (+ or -) *</label>
                <input
                  type="number"
                  step="0.5"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold"
                  required
                />
                <span className="text-[10px] text-slate-400 block font-medium">Use positive numbers to add days, or negative numbers to deduct.</span>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Mandatory Justification / Reason *</label>
                <textarea
                  rows={2}
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Mandatory reason for balance adjustment..."
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setAdjModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-extrabold text-white bg-primary-custom hover:opacity-95 rounded-lg flex items-center gap-1"
                >
                  <Save className="h-4 w-4 text-accent-custom" /> Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: YEAR END CARRY FORWARD ENGINE */}
      {/* ========================================== */}
      {yearEndModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-primary-custom text-white px-5 py-3.5 border-b flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-amber-400" /> Automated Year-End Carry-Forward Engine
              </h3>
              <button onClick={() => setYearEndModalOpen(false)} className="text-white/80 hover:text-white rounded-full p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Previous Leave Year</label>
                  <input
                    type="text"
                    value={yeFromYear}
                    onChange={(e) => setYeFromYear(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Leave Year</label>
                  <input
                    type="text"
                    value={yeToYear}
                    onChange={(e) => setYeToYear(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs space-y-1">
                <p className="font-extrabold flex items-center gap-1">
                  <Info className="h-4 w-4 text-amber-600 shrink-0" />
                  Calculation Formula:
                </p>
                <p className="font-mono text-[11px]">
                  New Available Balance = Annual Entitlement + Eligible Carried-Forward Balance - Utilized
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Transition Preview Summary ({yearEndPreview.detailsList.length} Accounts)
                </h4>
                <div className="bg-slate-50 border rounded-lg p-3 grid grid-cols-3 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Employees</span>
                    <span className="font-extrabold text-slate-800">{activeEmployees.length} Active</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Carried Forward</span>
                    <span className="font-extrabold text-indigo-600">{yearEndPreview.totalCarried} Days</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Expired</span>
                    <span className="font-extrabold text-rose-600">{yearEndPreview.totalExpired} Days</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setYearEndModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteYearEnd}
                  className="px-4 py-1.5 text-xs font-extrabold text-slate-900 bg-amber-500 hover:bg-amber-600 rounded-lg flex items-center gap-1 shadow-2xs"
                >
                  <CheckCircle2 className="h-4 w-4" /> Execute Year-End Transition
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: LEAVE TYPE CONFIGURATION */}
      {/* ========================================== */}
      {typeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-primary-custom text-white px-5 py-3.5 border-b flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-wider">
                {editingType ? "Edit Leave Policy" : "Create New Leave Policy"}
              </h3>
              <button onClick={() => setTypeModalOpen(false)} className="text-white/80 hover:text-white rounded-full p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTypeConfig} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Policy Name *</label>
                  <input
                    type="text"
                    value={ltName}
                    onChange={(e) => setLtName(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Code *</label>
                  <input
                    type="text"
                    value={ltCode}
                    onChange={(e) => setLtCode(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Annual Entitlement (Days) *</label>
                  <input
                    type="number"
                    value={ltEntitlement}
                    onChange={(e) => setLtEntitlement(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Paid Status</label>
                  <select
                    value={ltPaid ? "Paid" : "Unpaid"}
                    onChange={(e) => setLtPaid(e.target.value === "Paid")}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold bg-white"
                  >
                    <option value="Paid">Fully Paid Leave</option>
                    <option value="Unpaid">Unpaid Leave</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Accrual Policy</label>
                  <select
                    value={ltAccrual}
                    onChange={(e) => setLtAccrual(e.target.value as any)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold bg-white"
                  >
                    <option value="Annual">Annual Upfront</option>
                    <option value="Monthly">Monthly Pro-Rata</option>
                    <option value="Immediate">Immediate Grant</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Carry Forward Eligibility</label>
                  <select
                    value={ltCarryEligible ? "Yes" : "No"}
                    onChange={(e) => setLtCarryEligible(e.target.value === "Yes")}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold bg-white"
                  >
                    <option value="Yes">Eligible for Carry-Forward</option>
                    <option value="No">Not Eligible (Use-it-or-lose-it)</option>
                  </select>
                </div>
              </div>

              {ltCarryEligible && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Max Carry Forward Days</label>
                    <input
                      type="number"
                      value={ltMaxCarry}
                      onChange={(e) => setLtMaxCarry(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Expiration Period (Months)</label>
                    <select
                      value={ltExpMonths}
                      onChange={(e) => setLtExpMonths(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold bg-white"
                    >
                      <option value={6}>6 Months</option>
                      <option value={12}>12 Months (1 Year)</option>
                      <option value={24}>24 Months (2 Years)</option>
                      <option value={0}>Never Expire</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={ltRequiresDoc}
                    onChange={(e) => setLtRequiresDoc(e.target.checked)}
                  />
                  <span>Requires Supporting Document</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setTypeModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-extrabold text-white bg-primary-custom hover:opacity-95 rounded-lg flex items-center gap-1"
                >
                  <Save className="h-4 w-4 text-accent-custom" /> Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
