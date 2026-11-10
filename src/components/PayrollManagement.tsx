import React, { useState, useMemo } from "react";
import { 
  Employee, Department, User, UserRole, CompanyConfig,
  SalaryComponent, TaxConfiguration, PayrollPeriod, EmployeeSalaryStructure,
  PayrollRecord, Payslip, PayslipDistributionLog, PayrollApproval,
  PayrollImportLog, PayrollSettings, TaxBracket, EmailActivityLog
} from "../types";
import { 
  calculateEmployeePayrollRecord, calculateEmploymentIncomeTax, 
  generatePayrollCsvTemplate, parseCsvString, validatePayrollImportRows, 
  generateErrorCsvContent, DEFAULT_TAX_CONFIG 
} from "../utils/payrollUtils";
import { sendSystemEmail } from "../utils/emailService";
import { 
  DollarSign, Calculator, Settings, Sliders, Layers, FileSpreadsheet, 
  Upload, Download, FileText, CheckCircle2, ShieldCheck, AlertTriangle, 
  Search, Plus, Edit, Trash2, Eye, Lock, Unlock, RefreshCw, Printer, 
  Mail, Send, Check, X, ArrowRight, TrendingUp, Users, Building2, 
  ShieldAlert, History, Award, CheckSquare, XCircle, Clock, ChevronRight
} from "lucide-react";

interface PayrollManagementProps {
  employees: Employee[];
  departments: Department[];
  currentUser: User | null;
  companyConfig?: CompanyConfig | null;
  initialSubTab?: string;
  onSubTabChange?: (subTab: string) => void;
  emailLogs?: EmailActivityLog[];
  // Payroll State
  salaryComponents: SalaryComponent[];
  taxConfig: TaxConfiguration | null;
  payrollPeriods: PayrollPeriod[];
  salaryStructures: EmployeeSalaryStructure[];
  payrollRecords: PayrollRecord[];
  payslips: Payslip[];
  payslipDistributionLogs: PayslipDistributionLog[];
  payrollApprovals: PayrollApproval[];
  payrollImportLogs: PayrollImportLog[];
  payrollSettings: PayrollSettings | null;
  // State Handlers
  onUpdateComponents: (components: SalaryComponent[]) => void;
  onUpdateTaxConfig: (config: TaxConfiguration) => void;
  onUpdatePeriods: (periods: PayrollPeriod[]) => void;
  onUpdateStructures: (structures: EmployeeSalaryStructure[]) => void;
  onUpdateRecords: (records: PayrollRecord[]) => void;
  onUpdatePayslips: (payslips: Payslip[]) => void;
  onUpdateDistributionLogs: (logs: PayslipDistributionLog[]) => void;
  onUpdateApprovals: (approvals: PayrollApproval[]) => void;
  onUpdateImportLogs: (logs: PayrollImportLog[]) => void;
  onUpdateSettings: (settings: PayrollSettings) => void;
  onUpdateEmailLogs?: (logs: EmailActivityLog[]) => void;
  onLogAction: (module: string, action: string, record: string, details: string) => void;
}

export default function PayrollManagement({
  employees,
  departments,
  currentUser,
  companyConfig,
  initialSubTab = "dashboard",
  onSubTabChange,
  emailLogs = [],
  salaryComponents,
  taxConfig,
  payrollPeriods,
  salaryStructures,
  payrollRecords,
  payslips,
  payslipDistributionLogs,
  payrollApprovals,
  payrollImportLogs,
  payrollSettings,
  onUpdateComponents,
  onUpdateTaxConfig,
  onUpdatePeriods,
  onUpdateStructures,
  onUpdateRecords,
  onUpdatePayslips,
  onUpdateDistributionLogs,
  onUpdateApprovals,
  onUpdateImportLogs,
  onUpdateSettings,
  onUpdateEmailLogs,
  onLogAction
}: PayrollManagementProps) {
  // Navigation Subtab state (dashboard, config, salary_setup, processing, approval, payslips, csv_import, csv_export, reports, history)
  const [activeSubTab, setActiveSubTab] = useState<string>(() => {
    let init = initialSubTab || "dashboard";
    if (init === "import") init = "csv_import";
    if (init === "export") init = "csv_export";
    return init;
  });

  // Sync activeSubTab when initialSubTab changes via parent props (e.g. left sidebar click)
  React.useEffect(() => {
    if (initialSubTab) {
      let mapped = initialSubTab;
      if (mapped === "import") mapped = "csv_import";
      if (mapped === "export") mapped = "csv_export";
      setActiveSubTab(mapped);
    }
  }, [initialSubTab]);

  const changeSubTab = (newSubTab: string) => {
    let target = newSubTab;
    if (target === "import") target = "csv_import";
    if (target === "export") target = "csv_export";
    setActiveSubTab(target);
    if (onSubTabChange) {
      onSubTabChange(target);
    }
  };

  // Read-Only check
  const isAuditor = currentUser?.role === "Auditor";
  const isAdmin = currentUser?.role === "Administrator";

  // Selected Active Period
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    const openP = payrollPeriods.find(p => p.status === "Open" || p.status === "Calculated" || p.status === "Submitted");
    return openP ? openP.id : (payrollPeriods[0]?.id || "PP_2026_01");
  });

  const selectedPeriod = useMemo(() => {
    return payrollPeriods.find(p => p.id === selectedPeriodId) || payrollPeriods[0] || {
      id: "PP_2026_01",
      periodName: "January 2026",
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      paymentDate: "2026-01-28",
      status: "Open",
      createdBy: "Admin",
      createdDate: "2026-01-01"
    };
  }, [payrollPeriods, selectedPeriodId]);

  // Active employees eligible for payroll
  const activeEmployees = useMemo(() => {
    return employees.filter(e => e.status === "Active");
  }, [employees]);

  // Current Period Payroll Records
  const currentPeriodRecords = useMemo(() => {
    return payrollRecords.filter(r => r.payrollPeriodId === selectedPeriod.id);
  }, [payrollRecords, selectedPeriod]);

  // Summary Metrics for selected period
  const periodSummary = useMemo(() => {
    const totalGross = currentPeriodRecords.reduce((s, r) => s + r.grossSalary, 0);
    const totalDeductions = currentPeriodRecords.reduce((s, r) => s + r.totalDeductions, 0);
    const totalNet = currentPeriodRecords.reduce((s, r) => s + r.netSalary, 0);
    const totalEmployerPension = currentPeriodRecords.reduce((s, r) => s + r.employerPension, 0);
    const totalIncomeTax = currentPeriodRecords.reduce((s, r) => s + r.incomeTax, 0);
    const totalEmployeePension = currentPeriodRecords.reduce((s, r) => s + r.employeePension, 0);

    return {
      totalEmployees: currentPeriodRecords.length,
      totalGross,
      totalDeductions,
      totalNet,
      totalEmployerPension,
      totalIncomeTax,
      totalEmployeePension
    };
  }, [currentPeriodRecords]);

  // ==========================================
  // VIEW 1: PAYROLL DASHBOARD STATE
  // ==========================================

  // ==========================================
  // VIEW 2: PAYROLL CONFIGURATION STATE
  // ==========================================
  const [configSubTab, setConfigSubTab] = useState<"components" | "statutory" | "periods">("components");

  // Salary Component Form
  const [compModalOpen, setCompModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<SalaryComponent | null>(null);
  const [compName, setCompName] = useState("");
  const [compCode, setCompCode] = useState("");
  const [compType, setCompType] = useState<"Earning" | "Deduction">("Earning");
  const [compMethod, setCompMethod] = useState<any>("Fixed Amount");
  const [compValue, setCompValue] = useState<number>(0);
  const [compTaxable, setCompTaxable] = useState(true);
  const [compPensionable, setCompPensionable] = useState(false);
  const [compTaxCap, setCompTaxCap] = useState<number>(0);
  const [compEffectiveDate, setCompEffectiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [compDesc, setCompDesc] = useState("");

  const handleOpenCompAdd = () => {
    setEditingComp(null);
    setCompName("");
    setCompCode("");
    setCompType("Earning");
    setCompMethod("Fixed Amount");
    setCompValue(0);
    setCompTaxable(true);
    setCompPensionable(false);
    setCompTaxCap(0);
    setCompEffectiveDate(new Date().toISOString().split("T")[0]);
    setCompDesc("");
    setCompModalOpen(true);
  };

  const handleOpenCompEdit = (c: SalaryComponent) => {
    setEditingComp(c);
    setCompName(c.name);
    setCompCode(c.code);
    setCompType(c.type);
    setCompMethod(c.calculationMethod);
    setCompValue(c.calculationValue);
    setCompTaxable(c.isTaxable);
    setCompPensionable(c.isPensionable);
    setCompTaxCap(c.taxExemptLimitETB || 0);
    setCompEffectiveDate(c.effectiveDate);
    setCompDesc(c.description);
    setCompModalOpen(true);
  };

  const handleSaveComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName.trim() || !compCode.trim()) return;

    if (editingComp) {
      const updated = salaryComponents.map(c => c.id === editingComp.id ? {
        ...c,
        name: compName.trim(),
        code: compCode.trim().toUpperCase(),
        type: compType,
        calculationMethod: compMethod,
        calculationValue: compValue,
        isTaxable: compTaxable,
        isPensionable: compPensionable,
        taxExemptLimitETB: compTaxCap > 0 ? compTaxCap : undefined,
        effectiveDate: compEffectiveDate,
        description: compDesc.trim()
      } : c);
      onUpdateComponents(updated);
      onLogAction("PayrollConfig", "Update Component", compCode, `Updated salary component ${compName}`);
    } else {
      const newComp: SalaryComponent = {
        id: `SC_${Date.now()}`,
        name: compName.trim(),
        code: compCode.trim().toUpperCase(),
        type: compType,
        calculationMethod: compMethod,
        calculationValue: compValue,
        isTaxable: compTaxable,
        isPensionable: compPensionable,
        taxExemptLimitETB: compTaxCap > 0 ? compTaxCap : undefined,
        effectiveDate: compEffectiveDate,
        status: "Active",
        description: compDesc.trim()
      };
      onUpdateComponents([...salaryComponents, newComp]);
      onLogAction("PayrollConfig", "Create Component", compCode, `Added new ${compType} component: ${compName}`);
    }
    setCompModalOpen(false);
  };

  const handleToggleCompStatus = (c: SalaryComponent) => {
    const nextStatus = c.status === "Active" ? "Inactive" : "Active";
    const updated = salaryComponents.map(item => item.id === c.id ? { ...item, status: nextStatus as any } : item);
    onUpdateComponents(updated);
    onLogAction("PayrollConfig", "Toggle Component Status", c.code, `Set component ${c.name} to ${nextStatus}`);
  };

  // Statutory Tax Rules Form
  const [eePensionRate, setEePensionRate] = useState(taxConfig.employeePensionRate * 100);
  const [erPensionRate, setErPensionRate] = useState(taxConfig.employerPensionRate * 100);
  const [transportCap, setTransportCap] = useState(taxConfig.transportTaxExemptLimit || 2200);
  const [bracketsState, setBracketsState] = useState<TaxBracket[]>(taxConfig.taxBrackets || []);

  const handleSaveTaxConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: TaxConfiguration = {
      ...taxConfig,
      employeePensionRate: eePensionRate / 100,
      employerPensionRate: erPensionRate / 100,
      transportTaxExemptLimit: transportCap,
      taxBrackets: bracketsState,
      updatedBy: currentUser?.email || "Admin",
      updatedDate: new Date().toISOString().split("T")[0]
    };
    onUpdateTaxConfig(updated);
    onLogAction("PayrollConfig", "Update Statutory Rules", "Ethiopia Tax & Pension", "Saved updated employment tax brackets and pension contribution rates");
    alert("Ethiopian statutory tax and pension configuration updated successfully!");
  };

  // Payroll Period Management Form
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [pName, setPName] = useState("");
  const [pStart, setPStart] = useState("");
  const [pEnd, setPEnd] = useState("");
  const [pPayment, setPPayment] = useState("");

  const handleOpenPeriodAdd = () => {
    setPName("");
    setPStart(new Date().toISOString().substring(0, 7) + "-01");
    setPEnd(new Date().toISOString().substring(0, 10));
    setPPayment(new Date().toISOString().substring(0, 10));
    setPeriodModalOpen(true);
  };

  const handleSavePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim() || !pStart || !pEnd) return;

    const exists = payrollPeriods.some(p => p.periodName.toLowerCase() === pName.trim().toLowerCase());
    if (exists) {
      alert("A payroll period with this name already exists.");
      return;
    }

    const newPeriod: PayrollPeriod = {
      id: `PP_${Date.now()}`,
      periodName: pName.trim(),
      startDate: pStart,
      endDate: pEnd,
      paymentDate: pPayment,
      status: "Open",
      createdBy: currentUser?.email || "Admin",
      createdDate: new Date().toISOString().split("T")[0]
    };

    onUpdatePeriods([...payrollPeriods, newPeriod]);
    setSelectedPeriodId(newPeriod.id);
    onLogAction("PayrollConfig", "Create Period", newPeriod.periodName, `Defined new monthly payroll period: ${newPeriod.startDate} -> ${newPeriod.endDate}`);
    setPeriodModalOpen(false);
  };

  const handleTogglePeriodLock = (period: PayrollPeriod) => {
    const nextStatus = period.status === "Locked" || period.status === "Closed" ? "Open" : "Locked";
    const updated = payrollPeriods.map(p => p.id === period.id ? { ...p, status: nextStatus as any } : p);
    onUpdatePeriods(updated);
    onLogAction("PayrollConfig", "Toggle Period Lock", period.periodName, `Set status of period ${period.periodName} to ${nextStatus}`);
  };

  // ==========================================
  // VIEW 3: EMPLOYEE SALARY SETUP STATE
  // ==========================================
  const [salarySearchTerm, setSalarySearchTerm] = useState("");
  const [salaryDeptFilter, setSalaryDeptFilter] = useState("");
  const [salaryModalOpen, setSalaryModalOpen] = useState(false);
  const [selectedEmpForSetup, setSelectedEmpForSetup] = useState<Employee | null>(null);

  // Setup Form fields
  const [structBasic, setStructBasic] = useState<number>(0);
  const [structGrade, setStructGrade] = useState("");
  const [structPosition, setStructPosition] = useState<number>(0);
  const [structTransport, setStructTransport] = useState<number>(0);
  const [structHousing, setStructHousing] = useState<number>(0);
  const [structResponsibility, setStructResponsibility] = useState<number>(0);
  const [structTelephone, setStructTelephone] = useState<number>(0);
  const [structOvertime, setStructOvertime] = useState<number>(0);
  const [structOtherEarnings, setStructOtherEarnings] = useState<number>(0);
  const [structLoanDeduction, setStructLoanDeduction] = useState<number>(0);
  const [structOtherDeduction, setStructOtherDeduction] = useState<number>(0);
  const [structPensionEligible, setStructPensionEligible] = useState(true);
  const [structEffectiveDate, setStructEffectiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [structRevisionReason, setStructRevisionReason] = useState("");

  const handleOpenSalarySetup = (emp: Employee) => {
    setSelectedEmpForSetup(emp);
    const existing = salaryStructures.find(s => s.employeeId === emp.employeeId);

    if (existing) {
      setStructBasic(existing.basicSalary);
      setStructGrade(existing.salaryGrade || "");
      setStructPosition(existing.positionAllowance);
      setStructTransport(existing.transportAllowance);
      setStructHousing(existing.housingAllowance);
      setStructResponsibility(existing.responsibilityAllowance);
      setStructTelephone(existing.telephoneAllowance);
      setStructOvertime(existing.overtimeAmount);
      setStructOtherEarnings(existing.otherEarnings);
      setStructLoanDeduction(existing.recurringDeductions?.["LOAN"] || 0);
      setStructOtherDeduction(existing.recurringDeductions?.["OD"] || 0);
      setStructPensionEligible(existing.isPensionEligible);
      setStructEffectiveDate(existing.effectiveDate);
      setStructRevisionReason("");
    } else {
      setStructBasic(35000);
      setStructGrade("Grade 10");
      setStructPosition(5000);
      setStructTransport(3000);
      setStructHousing(0);
      setStructResponsibility(0);
      setStructTelephone(1000);
      setStructOvertime(0);
      setStructOtherEarnings(0);
      setStructLoanDeduction(0);
      setStructOtherDeduction(0);
      setStructPensionEligible(true);
      setStructEffectiveDate(new Date().toISOString().split("T")[0]);
      setStructRevisionReason("Initial Placement");
    }
    setSalaryModalOpen(true);
  };

  const handleSaveSalarySetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpForSetup) return;

    const existing = salaryStructures.find(s => s.employeeId === selectedEmpForSetup.employeeId);

    const revisionItem = {
      id: `REV_${Date.now()}`,
      basicSalary: structBasic,
      positionAllowance: structPosition,
      effectiveDate: structEffectiveDate,
      reason: structRevisionReason.trim() || "Regular Salary Adjustment",
      updatedBy: currentUser?.fullName || "HR Officer",
      updatedDate: new Date().toISOString().split("T")[0]
    };

    const newStruct: EmployeeSalaryStructure = {
      id: existing ? existing.id : `SS_${selectedEmpForSetup.employeeId}`,
      employeeId: selectedEmpForSetup.employeeId,
      basicSalary: Number(structBasic),
      salaryGrade: structGrade.trim(),
      positionAllowance: Number(structPosition),
      transportAllowance: Number(structTransport),
      housingAllowance: Number(structHousing),
      responsibilityAllowance: Number(structResponsibility),
      telephoneAllowance: Number(structTelephone),
      overtimeAmount: Number(structOvertime),
      otherEarnings: Number(structOtherEarnings),
      recurringDeductions: {
        LOAN: Number(structLoanDeduction),
        OD: Number(structOtherDeduction)
      },
      isPensionEligible: structPensionEligible,
      effectiveDate: structEffectiveDate,
      updatedBy: currentUser?.fullName || "HR Officer",
      updatedDate: new Date().toISOString().split("T")[0],
      revisionHistory: existing ? [revisionItem, ...(existing.revisionHistory || [])] : [revisionItem]
    };

    const updatedList = existing 
      ? salaryStructures.map(s => s.employeeId === selectedEmpForSetup.employeeId ? newStruct : s)
      : [...salaryStructures, newStruct];

    onUpdateStructures(updatedList);
    onLogAction("SalarySetup", "Update Employee Structure", selectedEmpForSetup.employeeId, `Updated base salary to ${structBasic} ETB for ${selectedEmpForSetup.fullName}`);
    alert(`Salary structure configured successfully for ${selectedEmpForSetup.fullName}!`);
    setSalaryModalOpen(false);
  };

  // Revision History Modal
  const [historyEmp, setHistoryEmp] = useState<Employee | null>(null);

  // Bulk Salary Adjustment State
  const [bulkSalaryModalOpen, setBulkSalaryModalOpen] = useState(false);
  const [bulkType, setBulkType] = useState<"Percentage" | "Fixed">("Percentage");
  const [bulkValue, setBulkValue] = useState<number>(5);
  const [bulkDept, setBulkDept] = useState<string>("");

  const handleApplyBulkSalaryUpdate = () => {
    if (bulkValue <= 0) return;
    const targetEmps = activeEmployees.filter(e => !bulkDept || e.departmentId === bulkDept);
    
    let updatedCount = 0;
    const updatedStructures = salaryStructures.map(struct => {
      const isTarget = targetEmps.some(e => e.employeeId === struct.employeeId);
      if (isTarget) {
        updatedCount++;
        const newBasic = bulkType === "Percentage" 
          ? Math.round(struct.basicSalary * (1 + bulkValue / 100))
          : struct.basicSalary + bulkValue;

        return {
          ...struct,
          basicSalary: newBasic,
          updatedBy: currentUser?.fullName || "HR Admin",
          updatedDate: new Date().toISOString().split("T")[0],
          revisionHistory: [
            {
              id: `REV_BULK_${Date.now()}`,
              basicSalary: newBasic,
              positionAllowance: struct.positionAllowance,
              effectiveDate: new Date().toISOString().split("T")[0],
              reason: `Bulk ${bulkType} adjustment (+${bulkValue}${bulkType === "Percentage" ? "%" : " ETB"})`,
              updatedBy: currentUser?.fullName || "HR Admin",
              updatedDate: new Date().toISOString().split("T")[0]
            },
            ...(struct.revisionHistory || [])
          ]
        };
      }
      return struct;
    });

    onUpdateStructures(updatedStructures);
    onLogAction("SalarySetup", "Bulk Salary Revision", `Count: ${updatedCount}`, `Applied ${bulkValue}${bulkType === "Percentage" ? "%" : " ETB"} salary increase across ${updatedCount} employees`);
    alert(`Bulk salary adjustment applied to ${updatedCount} employee records!`);
    setBulkSalaryModalOpen(false);
  };

  // ==========================================
  // VIEW 4: PAYROLL PROCESSING STATE
  // ==========================================
  const [procSearchTerm, setProcSearchTerm] = useState("");
  const [procDeptFilter, setProcDeptFilter] = useState("");
  const [breakdownRecord, setBreakdownRecord] = useState<PayrollRecord | null>(null);

  const handleExecuteBulkCalculation = () => {
    if (selectedPeriod.status === "Approved" || selectedPeriod.status === "Locked") {
      alert("This payroll period is Locked / Approved and cannot be recalculated.");
      return;
    }

    const calculatedList: PayrollRecord[] = [];

    activeEmployees.forEach(emp => {
      let struct = salaryStructures.find(s => s.employeeId === emp.employeeId);
      
      // Default structure fallback if not explicitly configured
      if (!struct) {
        struct = {
          id: `SS_AUTO_${emp.employeeId}`,
          employeeId: emp.employeeId,
          basicSalary: 30000,
          positionAllowance: 4000,
          transportAllowance: 2500,
          housingAllowance: 0,
          responsibilityAllowance: 0,
          telephoneAllowance: 1000,
          overtimeAmount: 0,
          otherEarnings: 0,
          recurringDeductions: { LOAN: 0, OD: 0 },
          isPensionEligible: true,
          effectiveDate: "2026-01-01",
          updatedBy: "Auto Generator",
          updatedDate: "2026-01-01"
        };
      }

      const deptObj = departments.find(d => d.id === emp.departmentId);
      const rec = calculateEmployeePayrollRecord(
        emp,
        struct,
        selectedPeriod,
        taxConfig,
        deptObj ? deptObj.name : emp.departmentId,
        currentUser?.fullName || "HR Officer"
      );

      calculatedList.push(rec);
    });

    // Replace existing records for current period
    const remainingRecords = payrollRecords.filter(r => r.payrollPeriodId !== selectedPeriod.id);
    const newMasterRecords = [...remainingRecords, ...calculatedList];
    onUpdateRecords(newMasterRecords);

    // Update Period Status to Calculated
    const updatedPeriods = payrollPeriods.map(p => p.id === selectedPeriod.id ? { ...p, status: "Calculated" as any } : p);
    onUpdatePeriods(updatedPeriods);

    onLogAction("PayrollProcessing", "Calculate Period Payroll", selectedPeriod.periodName, `Calculated payroll ledger for ${calculatedList.length} employees. Total Net: ${calculatedList.reduce((s, r) => s + r.netSalary, 0).toLocaleString()} ETB`);
    alert(`Payroll calculation completed for ${calculatedList.length} employees in ${selectedPeriod.periodName}!`);
  };

  const handleSubmittedForApproval = () => {
    if (currentPeriodRecords.length === 0) {
      alert("Please calculate payroll before submitting for approval.");
      return;
    }

    // Check existing approval submission
    const existingAppr = payrollApprovals.find(a => a.payrollPeriodId === selectedPeriod.id);

    const newApproval: PayrollApproval = {
      id: existingAppr ? existingAppr.id : `APPR_${selectedPeriod.id}`,
      payrollPeriodId: selectedPeriod.id,
      periodName: selectedPeriod.periodName,
      submittedBy: currentUser?.email || "system@ethiopianre.com",
      submittedDate: new Date().toISOString().replace("T", " ").substring(0, 19),
      totalEmployees: periodSummary.totalEmployees,
      totalGross: periodSummary.totalGross,
      totalDeductions: periodSummary.totalDeductions,
      totalNet: periodSummary.totalNet,
      totalEmployerPension: periodSummary.totalEmployerPension,
      status: "Submitted",
      comments: "Submitted monthly payroll calculations for executive approval."
    };

    const updatedApprovals = existingAppr 
      ? payrollApprovals.map(a => a.payrollPeriodId === selectedPeriod.id ? newApproval : a)
      : [...payrollApprovals, newApproval];

    onUpdateApprovals(updatedApprovals);

    // Update Period Status
    const updatedPeriods = payrollPeriods.map(p => p.id === selectedPeriod.id ? { ...p, status: "Submitted" as any } : p);
    onUpdatePeriods(updatedPeriods);

    onLogAction("PayrollApproval", "Submit Payroll Approval", selectedPeriod.periodName, `Submitted period ${selectedPeriod.periodName} payroll for executive review (${periodSummary.totalNet.toLocaleString()} ETB Net)`);
    alert(`Payroll for ${selectedPeriod.periodName} submitted for executive approval!`);
  };

  // ==========================================
  // VIEW 5: PAYROLL APPROVAL WORKFLOW
  // ==========================================
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalComments, setApprovalComments] = useState("");

  const handleApprovePayroll = () => {
    if (!isAdmin) {
      alert("Role Restriction: Only Administrators are authorized to execute final payroll approvals.");
      return;
    }

    const currentApproval = payrollApprovals.find(a => a.payrollPeriodId === selectedPeriod.id);
    
    const updatedApproval: PayrollApproval = {
      id: currentApproval ? currentApproval.id : `APPR_${selectedPeriod.id}`,
      payrollPeriodId: selectedPeriod.id,
      periodName: selectedPeriod.periodName,
      submittedBy: currentApproval?.submittedBy || currentUser?.email || "system@ethiopianre.com",
      submittedDate: currentApproval?.submittedDate || new Date().toISOString().replace("T", " ").substring(0, 19),
      totalEmployees: periodSummary.totalEmployees,
      totalGross: periodSummary.totalGross,
      totalDeductions: periodSummary.totalDeductions,
      totalNet: periodSummary.totalNet,
      totalEmployerPension: periodSummary.totalEmployerPension,
      status: "Approved",
      actionBy: currentUser?.email || "contactesfaye@gmail.com",
      actionDate: new Date().toISOString().replace("T", " ").substring(0, 19),
      comments: approvalComments.trim() || "Approved after thorough audit."
    };

    const updatedApprovalsList = payrollApprovals.some(a => a.payrollPeriodId === selectedPeriod.id)
      ? payrollApprovals.map(a => a.payrollPeriodId === selectedPeriod.id ? updatedApproval : a)
      : [...payrollApprovals, updatedApproval];

    onUpdateApprovals(updatedApprovalsList);

    // Update Period Status to Approved & Locked
    const updatedPeriods = payrollPeriods.map(p => p.id === selectedPeriod.id ? { ...p, status: "Approved" as any } : p);
    onUpdatePeriods(updatedPeriods);

    // Auto-generate payslips for approved period
    const generatedPayslipsList: Payslip[] = currentPeriodRecords.map(r => {
      const emp = employees.find(e => e.employeeId === r.employeeId);
      const dept = departments.find(d => d.id === r.departmentId);

      return {
        id: `PS_${selectedPeriod.id}_${r.employeeId}`,
        payslipRefNo: `SLIP-${selectedPeriod.id.replace("PP_", "")}-${r.employeeId}`,
        payrollPeriodId: selectedPeriod.id,
        payrollPeriodName: selectedPeriod.periodName,
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        department: dept ? dept.name : r.departmentName,
        position: r.position,
        paymentDate: selectedPeriod.paymentDate,
        grossSalary: r.grossSalary,
        totalDeductions: r.totalDeductions,
        netSalary: r.netSalary,
        employerPension: r.employerPension,
        earningsBreakdown: [
          { name: "Basic Salary", amount: r.basicSalary },
          { name: "Position Allowance", amount: r.positionAllowance },
          { name: "Transport Allowance", amount: r.transportAllowance },
          { name: "Housing Allowance", amount: r.housingAllowance },
          { name: "Responsibility Allowance", amount: r.responsibilityAllowance },
          { name: "Telephone Allowance", amount: r.telephoneAllowance },
          { name: "Overtime", amount: r.overtime },
          { name: "Other Earnings", amount: r.otherEarnings }
        ].filter(e => e.amount > 0),
        deductionsBreakdown: [
          { name: "Employment Income Tax", amount: r.incomeTax },
          { name: "Employee Pension (7%)", amount: r.employeePension },
          { name: "Loan Repayment", amount: r.loanDeduction },
          { name: "Other Deductions", amount: r.otherDeductions }
        ].filter(d => d.amount > 0),
        generatedDate: new Date().toISOString().split("T")[0],
        generatedBy: currentUser?.fullName || "System Admin"
      };
    });

    const otherPayslips = payslips.filter(ps => ps.payrollPeriodId !== selectedPeriod.id);
    onUpdatePayslips([...otherPayslips, ...generatedPayslipsList]);

    onLogAction("PayrollApproval", "Approve Payroll", selectedPeriod.periodName, `Executive approval granted for period ${selectedPeriod.periodName}. Generated ${generatedPayslipsList.length} employee payslips.`);
    alert(`Payroll for ${selectedPeriod.periodName} approved! ${generatedPayslipsList.length} payslips generated.`);
    setApprovalModalOpen(false);
  };

  const handleRejectPayroll = () => {
    if (!isAdmin) {
      alert("Role Restriction: Only Administrators can reject submitted payroll.");
      return;
    }

    const updatedApprovals = payrollApprovals.map(a => a.payrollPeriodId === selectedPeriod.id ? {
      ...a,
      status: "Rejected" as any,
      actionBy: currentUser?.email || "contactesfaye@gmail.com",
      actionDate: new Date().toISOString().replace("T", " ").substring(0, 19),
      comments: approvalComments.trim() || "Rejected. Recalculation requested."
    } : a);

    onUpdateApprovals(updatedApprovals);

    // Reopen period
    const updatedPeriods = payrollPeriods.map(p => p.id === selectedPeriod.id ? { ...p, status: "Open" as any } : p);
    onUpdatePeriods(updatedPeriods);

    onLogAction("PayrollApproval", "Reject Payroll", selectedPeriod.periodName, `Rejected payroll submission for ${selectedPeriod.periodName}. Comments: ${approvalComments}`);
    alert(`Payroll for ${selectedPeriod.periodName} rejected and returned to Open state for corrections.`);
    setApprovalModalOpen(false);
  };

  // ==========================================
  // VIEW 6: PAYSLIP MANAGEMENT STATE
  // ==========================================
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [payslipSearchTerm, setPayslipSearchTerm] = useState("");
  const [emailStatusFilter, setEmailStatusFilter] = useState("");

  const handleSendSinglePayslipEmail = (ps: Payslip) => {
    const emp = employees.find(e => e.employeeId === ps.employeeId);
    const targetEmail = emp?.email || `${ps.employeeId.toLowerCase()}@ethiopianre.com`;

    const emailResult = sendSystemEmail({
      recipientEmployeeId: ps.employeeId,
      recipientEmail: targetEmail,
      subject: `ETHIO-RE Payslip Statement - ${ps.payrollPeriodName}`,
      sendingModule: "Payslip Distribution",
      currentUserEmail: currentUser?.email,
      config: companyConfig || { profile: {}, branding: {}, leaveAllocations: {} } as any
    });

    if (onUpdateEmailLogs) {
      onUpdateEmailLogs([emailResult.logEntry, ...(emailLogs || [])]);
    }

    const logItem: PayslipDistributionLog = {
      id: `LOG_MAIL_${Date.now()}_${ps.employeeId}`,
      employeeId: ps.employeeId,
      employeeName: ps.employeeName,
      recipientEmail: targetEmail,
      payrollPeriodId: ps.payrollPeriodId,
      payrollPeriodName: ps.payrollPeriodName,
      sendingDate: new Date().toISOString().replace("T", " ").substring(0, 19),
      deliveryStatus: emailResult.blocked ? "Failed" : "Sent",
      errorDetails: emailResult.blocked ? "Blocked – Employee Email Sending Disabled in Settings" : undefined,
      sentBy: currentUser?.email || "system@ethiopianre.com"
    };

    onUpdateDistributionLogs([logItem, ...payslipDistributionLogs]);
    onLogAction("Payslips", emailResult.blocked ? "Payslip Email Blocked" : "Send Payslip Email", ps.payslipRefNo, emailResult.message);

    if (emailResult.blocked) {
      alert(`EMAIL ACTION BLOCKED:\n\n${emailResult.message}\n\nTo enable outgoing email notifications, an Administrator must switch ON "Enable Email Sending to Registered Employees" in Administration → Email Settings.`);
    } else {
      alert(`Payslip statement for ${ps.employeeName} emailed successfully to ${targetEmail}!`);
    }
  };

  const handleBulkSendPayslips = () => {
    const periodPayslips = payslips.filter(ps => ps.payrollPeriodId === selectedPeriod.id);
    if (periodPayslips.length === 0) {
      alert("No payslips available for the selected period.");
      return;
    }

    const newDistributionLogs: PayslipDistributionLog[] = [];
    const newSystemEmailLogs: EmailActivityLog[] = [];
    let blockedCount = 0;
    let sentCount = 0;

    periodPayslips.forEach(ps => {
      const emp = employees.find(e => e.employeeId === ps.employeeId);
      const targetEmail = emp?.email || `${ps.employeeId.toLowerCase()}@ethiopianre.com`;

      const emailResult = sendSystemEmail({
        recipientEmployeeId: ps.employeeId,
        recipientEmail: targetEmail,
        subject: `ETHIO-RE Monthly Payslip Statement - ${selectedPeriod.periodName}`,
        sendingModule: "Payslip Distribution",
        currentUserEmail: currentUser?.email,
        config: companyConfig || { profile: {}, branding: {}, leaveAllocations: {} } as any
      });

      newSystemEmailLogs.push(emailResult.logEntry);
      if (emailResult.blocked) blockedCount++;
      else sentCount++;

      newDistributionLogs.push({
        id: `LOG_MAIL_${Date.now()}_${ps.employeeId}`,
        employeeId: ps.employeeId,
        employeeName: ps.employeeName,
        recipientEmail: targetEmail,
        payrollPeriodId: ps.payrollPeriodId,
        payrollPeriodName: ps.payrollPeriodName,
        sendingDate: new Date().toISOString().replace("T", " ").substring(0, 19),
        deliveryStatus: emailResult.blocked ? "Failed" : "Sent",
        errorDetails: emailResult.blocked ? "Blocked – Email Sending Disabled in Settings" : undefined,
        sentBy: currentUser?.email || "system@ethiopianre.com"
      });
    });

    if (onUpdateEmailLogs) {
      onUpdateEmailLogs([...newSystemEmailLogs, ...(emailLogs || [])]);
    }

    onUpdateDistributionLogs([...newDistributionLogs, ...payslipDistributionLogs]);
    onLogAction("Payslips", "Bulk Email Payslips", selectedPeriod.periodName, `Bulk emailed ${periodPayslips.length} payslips for period ${selectedPeriod.periodName} (${sentCount} sent, ${blockedCount} blocked)`);

    if (blockedCount > 0) {
      alert(`BULK EMAIL DISPATCH NOTICE:\n\nGlobal Employee Email Sending is currently DISABLED in Administration → Email Settings.\n\nResult: All ${blockedCount} payslip email dispatches were BLOCKED and logged under Email Activity Logs.`);
    } else {
      alert(`Bulk payslip distribution completed! ${sentCount} emails dispatched successfully.`);
    }
  };

  // ==========================================
  // VIEW 7: PAYROLL CSV IMPORT STATE
  // ==========================================
  const [importMode, setImportMode] = useState<"Salary Structure" | "Monthly Payroll">("Monthly Payroll");
  const [csvFileText, setCsvFileText] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [importParsedRows, setImportParsedRows] = useState<string[][]>([]);
  const [importValidationResult, setImportValidationResult] = useState<{
    validRecords: PayrollRecord[];
    invalidErrors: any[];
    summary: { total: number; successful: number; skipped: number; failed: number };
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvFileText(text);
      const parsed = parseCsvString(text);
      setImportParsedRows(parsed);

      const valResult = validatePayrollImportRows(
        parsed,
        activeEmployees,
        selectedPeriod.periodName,
        currentPeriodRecords
      );
      setImportValidationResult(valResult);
    };
    reader.readAsText(file);
  };

  const handleDownloadCsvTemplate = () => {
    const content = generatePayrollCsvTemplate();
    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${content}`);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EthioRe_Payroll_Import_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadErrorCsv = () => {
    if (!importValidationResult || importValidationResult.invalidErrors.length === 0) return;
    const content = generateErrorCsvContent(importValidationResult.invalidErrors);
    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${content}`);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Payroll_Import_Errors_${selectedPeriod.periodName.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteImportCommit = () => {
    if (!importValidationResult || importValidationResult.validRecords.length === 0) {
      alert("No valid employee rows to import.");
      return;
    }

    const newRecords = importValidationResult.validRecords;
    const existingOther = payrollRecords.filter(r => r.payrollPeriodId !== selectedPeriod.id);
    const combined = [...existingOther, ...newRecords];
    onUpdateRecords(combined);

    // Save import audit log
    const importLog: PayrollImportLog = {
      id: `IMP_${Date.now()}`,
      filename: csvFileName || "payroll_upload.csv",
      importMode,
      payrollPeriod: selectedPeriod.periodName,
      totalRows: importValidationResult.summary.total,
      successfulRows: importValidationResult.summary.successful,
      skippedRows: importValidationResult.summary.skipped,
      failedRows: importValidationResult.summary.failed,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      importedBy: currentUser?.email || "HR Operator",
      errors: importValidationResult.invalidErrors
    };

    onUpdateImportLogs([importLog, ...payrollImportLogs]);
    onLogAction("CSVImport", "Execute Payroll Import", csvFileName, `Successfully imported ${newRecords.length} employee records into period ${selectedPeriod.periodName}`);
    alert(`Import executed successfully! Added ${newRecords.length} records to ${selectedPeriod.periodName}.`);

    // Reset import form
    setCsvFileText("");
    setCsvFileName("");
    setImportParsedRows([]);
    setImportValidationResult(null);
  };

  // ==========================================
  // VIEW 8: PAYROLL CSV EXPORT STATE
  // ==========================================
  const [exportType, setExportType] = useState<string>("monthly_payroll");
  const [exportDept, setExportDept] = useState<string>("");

  const handleTriggerCsvExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    const periodName = selectedPeriod.periodName;

    if (exportType === "salary_structures") {
      csvContent += "Employee_ID,Full_Name,Department,Basic_Salary,Position_Allowance,Transport_Allowance,Housing_Allowance,Pension_Eligible,Effective_Date\n";
      salaryStructures.forEach(s => {
        const emp = employees.find(e => e.employeeId === s.employeeId);
        const dept = departments.find(d => d.id === emp?.departmentId);
        if (exportDept && emp?.departmentId !== exportDept) return;
        csvContent += `"${s.employeeId}","${emp?.fullName || ''}","${dept?.name || ''}","${s.basicSalary}","${s.positionAllowance}","${s.transportAllowance}","${s.housingAllowance}","${s.isPensionEligible ? 'Yes' : 'No'}","${s.effectiveDate}"\n`;
      });
    } else {
      // Monthly payroll / deductions / allowances
      csvContent += "Employee_ID,Employee_Name,Department,Position,Basic_Salary,Gross_Salary,Taxable_Earnings,Income_Tax,Employee_Pension,Loan_Deduction,Total_Deductions,Net_Salary,Employer_Pension,Status\n";
      currentPeriodRecords.forEach(r => {
        if (exportDept && r.departmentId !== exportDept) return;
        csvContent += `"${r.employeeId}","${r.employeeName}","${r.departmentName}","${r.position}","${r.basicSalary}","${r.grossSalary}","${r.taxableEarnings}","${r.incomeTax}","${r.employeePension}","${r.loanDeduction}","${r.totalDeductions}","${r.netSalary}","${r.employerPension}","${r.status}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EthioRe_${exportType}_${periodName.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onLogAction("CSVExport", "Export Payroll CSV", exportType, `Exported ${exportType} CSV for period ${periodName}`);
  };

  // ==========================================
  // VIEW 9: PAYROLL REPORTS STATE
  // ==========================================
  const [reportType, setReportType] = useState<string>("monthly_summary");
  const [reportDept, setReportDept] = useState<string>("");

  // Screen metadata map for breadcrumb, screen title, subtitle, tag, icon, and action button
  const screenMeta = useMemo(() => {
    switch (activeSubTab) {
      case "config":
        return {
          title: "Payroll Configuration",
          subTag: "Statutory Rules & Components",
          description: "Define earnings, position allowances, deductions, calculation formulas, 7% Employee / 11% Employer pension rates, and Ethiopian progressive income tax brackets.",
          icon: Sliders,
          actionButton: !isAuditor ? (
            <button
              onClick={handleOpenCompAdd}
              className="px-3.5 py-2 bg-primary-custom hover:opacity-95 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-all uppercase tracking-wider shrink-0"
            >
              <Plus className="h-4 w-4 text-accent-custom" />
              <span>Add Component</span>
            </button>
          ) : null
        };
      case "salary_setup":
        return {
          title: "Employee Salary Setup",
          subTag: "Employee Master Alignment",
          description: "Manage individual employee basic salaries, position allowances, transport, housing, and pension contribution status.",
          icon: Users,
          actionButton: (
            <button
              onClick={() => changeSubTab("csv_import")}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-all uppercase tracking-wider shrink-0"
            >
              <Upload className="h-4 w-4 text-accent-custom" />
              <span>Import Salary CSV</span>
            </button>
          )
        };
      case "processing":
        return {
          title: "Payroll Processing Engine",
          subTag: "Monthly Calculation Engine",
          description: "Run bulk monthly calculations across all active employees, review gross-to-net itemized deductions, and resolve variance warnings.",
          icon: Calculator,
          actionButton: !isAuditor ? (
            <button
              onClick={handleExecuteBulkCalculation}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-all uppercase tracking-wider shrink-0"
            >
              <Calculator className="h-4 w-4 text-white" />
              <span>Execute Bulk Calculation</span>
            </button>
          ) : null
        };
      case "approval":
        return {
          title: "Payroll Approval Workflow",
          subTag: "Executive Governance",
          description: "Executive review and multi-tier period approval. Submit calculated period, record approval comments, and lock payroll registers.",
          icon: ShieldCheck,
          actionButton: !isAuditor ? (
            <button
              onClick={() => setApprovalModalOpen(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-all uppercase tracking-wider shrink-0"
            >
              <ShieldCheck className="h-4 w-4 text-white" />
              <span>Record Approval Action</span>
            </button>
          ) : null
        };
      case "payslips":
        return {
          title: "Payslip Management & Distribution",
          subTag: "Employee Statements",
          description: "Generate itemized payslips formatted for Ethiopian Reinsurance S.C., preview print statements, and dispatch bulk email notifications.",
          icon: FileText,
          actionButton: selectedPayslip ? (
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-primary-custom text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-all uppercase tracking-wider shrink-0"
            >
              <Printer className="h-4 w-4 text-accent-custom" />
              <span>Print Selected Payslip</span>
            </button>
          ) : null
        };
      case "csv_import":
        return {
          title: "Payroll CSV Bulk Import",
          subTag: "Data Ingestion",
          description: "Upload CSV employee salary files, validate row-level structures, inspect preview modal, and commit bulk updates.",
          icon: Upload,
          actionButton: (
            <button
              onClick={handleDownloadCsvTemplate}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-all uppercase tracking-wider shrink-0"
            >
              <Download className="h-4 w-4 text-accent-custom" />
              <span>Download CSV Template</span>
            </button>
          )
        };
      case "csv_export":
        return {
          title: "Payroll CSV Export",
          subTag: "Data Extraction",
          description: "Export monthly payroll calculations, employee salary structures, or tax registers to CSV/Excel files.",
          icon: Download,
          actionButton: (
            <button
              onClick={handleTriggerCsvExport}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-all uppercase tracking-wider shrink-0"
            >
              <Download className="h-4 w-4 text-white" />
              <span>Export CSV File</span>
            </button>
          )
        };
      case "reports":
        return {
          title: "Statutory Payroll Reports",
          subTag: "Audit & Tax Statements",
          description: "Generate Ethiopian Income Tax (PIT) schedules, Pension filings, net disbursement lists, and variance audit reports.",
          icon: FileSpreadsheet,
          actionButton: (
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-primary-custom text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-all uppercase tracking-wider shrink-0"
            >
              <Printer className="h-4 w-4 text-accent-custom" />
              <span>Print Statutory Report</span>
            </button>
          )
        };
      case "history":
        return {
          title: "Payroll History & Audit Trail",
          subTag: "Historical Archive",
          description: "Historical record register of all closed, locked, and past payroll periods for Ethiopian Reinsurance S.C.",
          icon: History,
          actionButton: (
            <button
              onClick={handleTriggerCsvExport}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-all uppercase tracking-wider shrink-0"
            >
              <Download className="h-4 w-4 text-accent-custom" />
              <span>Export History Log</span>
            </button>
          )
        };
      case "dashboard":
      default:
        return {
          title: "Payroll Dashboard",
          subTag: "Executive Overview",
          description: "Consolidated monthly salary metrics, gross payroll, employee tax liabilities, and statutory pension contributions for Ethiopian Reinsurance S.C.",
          icon: TrendingUp,
          actionButton: !isAuditor ? (
            <button
              onClick={() => changeSubTab("processing")}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-all uppercase tracking-wider shrink-0"
            >
              <Calculator className="h-4 w-4 text-white" />
              <span>Execute Calculation</span>
            </button>
          ) : null
        };
    }
  }, [activeSubTab, isAuditor, selectedPayslip, salaryComponents]);

  const ScreenIconComp = screenMeta.icon;

  return (
    <div className="space-y-6">
      {/* 1. BREADCRUMB NAVIGATION */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1" aria-label="Breadcrumb">
        <span className="hover:text-primary-custom transition-colors cursor-pointer" onClick={() => changeSubTab("dashboard")}>
          Ethio-Re HRMS
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="hover:text-primary-custom transition-colors cursor-pointer" onClick={() => changeSubTab("dashboard")}>
          Payroll Management
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-primary-custom font-bold">
          {screenMeta.title}
        </span>
      </nav>

      {/* 2. DYNAMIC RIGHT-SIDE HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-start md:items-center gap-3">
          <div className="p-3 bg-primary-custom text-accent-custom rounded-xl shadow-2xs shrink-0">
            <ScreenIconComp className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight">
                {screenMeta.title}
              </h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                {screenMeta.subTag}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-3xl">
              {screenMeta.description}
            </p>
          </div>
        </div>

        {/* Global Period Selector, Status Badge & Action Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-2 border rounded-lg">
            <span className="text-[10px] font-bold uppercase text-slate-400">Payroll Period:</span>
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-white border rounded px-2 py-1 focus:ring-1 focus:ring-primary-custom"
            >
              {payrollPeriods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.periodName} ({p.status})
                </option>
              ))}
            </select>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
            selectedPeriod.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
            selectedPeriod.status === "Submitted" ? "bg-amber-50 text-amber-700 border-amber-200" :
            selectedPeriod.status === "Calculated" ? "bg-sky-50 text-sky-700 border-sky-200" :
            selectedPeriod.status === "Locked" ? "bg-purple-50 text-purple-700 border-purple-200" :
            "bg-slate-100 text-slate-700 border-slate-200"
          }`}>
            {selectedPeriod.status}
          </span>

          {screenMeta.actionButton}
        </div>
      </div>

      {/* 3. 10-SUBMENU ACCORDION TAB NAVIGATION */}
      <div className="bg-white border-b border-slate-200 rounded-xl p-1 shadow-2xs flex items-center gap-1 overflow-x-auto text-xs font-bold">
        {[
          { id: "dashboard", label: "1. Dashboard", icon: TrendingUp },
          { id: "config", label: "2. Configuration", icon: Sliders },
          { id: "salary_setup", label: "3. Employee Salary Setup", icon: Users },
          { id: "processing", label: "4. Payroll Processing", icon: Calculator },
          { id: "approval", label: "5. Payroll Approval", icon: ShieldCheck },
          { id: "payslips", label: "6. Payslip Management", icon: FileText },
          { id: "csv_import", label: "7. CSV Import", icon: Upload },
          { id: "csv_export", label: "8. CSV Export", icon: Download },
          { id: "reports", label: "9. Payroll Reports", icon: FileSpreadsheet },
          { id: "history", label: "10. Payroll History", icon: History }
        ].map(tab => {
          const IconComp = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => changeSubTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
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
      {/* SUBMENU 1: PAYROLL DASHBOARD */}
      {/* ========================================== */}
      {activeSubTab === "dashboard" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Executive Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Eligible Employees</p>
                <p className="text-xl font-extrabold text-slate-800 mt-1">
                  {periodSummary.totalEmployees} <span className="text-xs font-semibold text-slate-500">Staff</span>
                </p>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                  {selectedPeriod.periodName} Run
                </span>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Gross Payroll</p>
                <p className="text-xl font-extrabold text-slate-800 mt-1">
                  {periodSummary.totalGross.toLocaleString()} <span className="text-xs font-semibold text-slate-500">ETB</span>
                </p>
                <span className="text-[9px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                  Basic + Allowances
                </span>
              </div>
              <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Employee Deductions</p>
                <p className="text-xl font-extrabold text-slate-800 mt-1">
                  {periodSummary.totalDeductions.toLocaleString()} <span className="text-xs font-semibold text-slate-500">ETB</span>
                </p>
                <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                  Tax ({periodSummary.totalIncomeTax.toLocaleString()}) + Pension
                </span>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <Calculator className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Net Payable</p>
                <p className="text-xl font-extrabold text-emerald-700 mt-1">
                  {periodSummary.totalNet.toLocaleString()} <span className="text-xs font-semibold text-slate-500">ETB</span>
                </p>
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                  Employer Pension: {periodSummary.totalEmployerPension.toLocaleString()} ETB
                </span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Award className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Department Payroll Breakdown Table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary-custom" /> Department Payroll Allocation ({selectedPeriod.periodName})
                </h3>
                <button
                  onClick={() => setActiveSubTab("reports")}
                  className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
                >
                  View Reports <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase border-b">
                      <th className="p-3">Department</th>
                      <th className="p-3 text-center">Headcount</th>
                      <th className="p-3 text-right">Gross Total (ETB)</th>
                      <th className="p-3 text-right">Tax &amp; Pension (ETB)</th>
                      <th className="p-3 text-right font-extrabold">Net Total (ETB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {departments.map(dept => {
                      const deptRecords = currentPeriodRecords.filter(r => r.departmentId === dept.id);
                      const gross = deptRecords.reduce((s, r) => s + r.grossSalary, 0);
                      const taxPen = deptRecords.reduce((s, r) => s + r.incomeTax + r.employeePension, 0);
                      const net = deptRecords.reduce((s, r) => s + r.netSalary, 0);

                      return (
                        <tr key={dept.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">
                            {dept.name} <span className="text-[10px] text-slate-400 font-semibold">({dept.code})</span>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-700">{deptRecords.length}</td>
                          <td className="p-3 text-right text-slate-700 font-semibold">{gross.toLocaleString()} ETB</td>
                          <td className="p-3 text-right text-rose-600 font-semibold">{taxPen.toLocaleString()} ETB</td>
                          <td className="p-3 text-right font-extrabold text-emerald-700">{net.toLocaleString()} ETB</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pipeline Status Summary Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" /> Payroll Workflow Pipeline
              </h3>
              <div className="space-y-3 text-xs">
                {[
                  { step: "1. Period Opening", status: "Completed", desc: `${selectedPeriod.periodName} opened` },
                  { step: "2. Salary Setup & Sync", status: "Completed", desc: `${activeEmployees.length} employees synced` },
                  { step: "3. Bulk Calculation", status: currentPeriodRecords.length > 0 ? "Completed" : "Pending", desc: `${currentPeriodRecords.length} records calculated` },
                  { step: "4. Executive Approval", status: selectedPeriod.status === "Approved" ? "Approved" : selectedPeriod.status === "Submitted" ? "Submitted" : "Pending", desc: "Administrator verification" },
                  { step: "5. Payslip Distribution", status: payslips.length > 0 ? "Ready" : "Pending", desc: `${payslips.length} payslips generated` }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{item.step}</p>
                      <p className="text-[10px] text-slate-500">{item.desc}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                      item.status === "Completed" || item.status === "Approved" || item.status === "Ready"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SUBMENU 2: PAYROLL CONFIGURATION */}
      {/* ========================================== */}
      {activeSubTab === "config" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Subtab Selector */}
          <div className="flex border-b text-xs font-bold gap-4">
            <button
              onClick={() => setConfigSubTab("components")}
              className={`pb-2 transition-all ${configSubTab === "components" ? "border-b-2 border-primary-custom text-primary-custom" : "text-slate-500 hover:text-slate-800"}`}
            >
              A. Salary Components ({salaryComponents.length})
            </button>
            <button
              onClick={() => setConfigSubTab("statutory")}
              className={`pb-2 transition-all ${configSubTab === "statutory" ? "border-b-2 border-primary-custom text-primary-custom" : "text-slate-500 hover:text-slate-800"}`}
            >
              B. Ethiopian Tax &amp; Pension Statutory Rules
            </button>
            <button
              onClick={() => setConfigSubTab("periods")}
              className={`pb-2 transition-all ${configSubTab === "periods" ? "border-b-2 border-primary-custom text-primary-custom" : "text-slate-500 hover:text-slate-800"}`}
            >
              C. Monthly Payroll Periods ({payrollPeriods.length})
            </button>
          </div>

          {/* SUBTAB A: SALARY COMPONENTS */}
          {configSubTab === "components" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 border rounded-xl shadow-2xs">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase">Configurable Earnings &amp; Deductions</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Administrators can add, edit, or toggle components dynamically. Calculations reference these settings.</p>
                </div>
                {!isAuditor && (
                  <button
                    onClick={handleOpenCompAdd}
                    className="px-3.5 py-1.5 bg-primary-custom text-white text-xs font-bold rounded-lg hover:opacity-95 flex items-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5 text-accent-custom" /> Add New Component
                  </button>
                )}
              </div>

              <div className="bg-white border rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-3">Component Name</th>
                      <th className="p-3">Code</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Calculation Method</th>
                      <th className="p-3 text-center">Taxable</th>
                      <th className="p-3 text-center">Pensionable</th>
                      <th className="p-3">Effective Date</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salaryComponents.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-800">
                          {c.name}
                          {c.isSystemDefault && <span className="ml-1.5 text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">Default</span>}
                        </td>
                        <td className="p-3 font-bold text-primary-custom">{c.code}</td>
                        <td className="p-3 font-semibold">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.type === "Earning" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}>
                            {c.type}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">{c.calculationMethod}</td>
                        <td className="p-3 text-center font-bold">
                          {c.isTaxable ? <span className="text-amber-700">Yes</span> : <span className="text-slate-400">Exempt</span>}
                        </td>
                        <td className="p-3 text-center font-bold">
                          {c.isPensionable ? <span className="text-blue-700">Yes</span> : <span className="text-slate-400">No</span>}
                        </td>
                        <td className="p-3 text-slate-500 font-medium">{c.effectiveDate}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          {!isAuditor ? (
                            <>
                              <button
                                onClick={() => handleOpenCompEdit(c)}
                                className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded"
                                title="Edit Component"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleCompStatus(c)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title={c.status === "Active" ? "Deactivate" : "Activate"}
                              >
                                <ShieldAlert className="h-3.5 w-3.5" />
                              </button>
                            </>
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
          )}

          {/* SUBTAB B: STATUTORY TAX RULES */}
          {configSubTab === "statutory" && (
            <div className="space-y-6">
              <div className="bg-white p-5 border rounded-xl shadow-2xs space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" /> Ethiopian Progressive Employment Income Tax Brackets (Proclamation 979/2016)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Rates and deduction offsets are completely configurable without altering codebase files.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="p-3">Bracket</th>
                        <th className="p-3">Monthly Taxable Income Range (ETB)</th>
                        <th className="p-3 text-center">Tax Rate (%)</th>
                        <th className="p-3 text-right">Deduction Offset (ETB)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bracketsState.map((b, i) => (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">Bracket {i + 1}</td>
                          <td className="p-3 font-bold text-primary-custom">
                            {b.minIncome.toLocaleString()} ETB – {b.maxIncome ? `${b.maxIncome.toLocaleString()} ETB` : "Above"}
                          </td>
                          <td className="p-3 text-center font-extrabold text-amber-700">{(b.taxRate * 100).toFixed(0)}%</td>
                          <td className="p-3 text-right font-semibold text-slate-700">{b.deductionETB.toFixed(2)} ETB</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <form onSubmit={handleSaveTaxConfig} className="pt-4 border-t space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase">Statutory Pension &amp; Exemption Limits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Employee Pension Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={eePensionRate}
                        onChange={(e) => setEePensionRate(Number(e.target.value))}
                        readOnly={isAuditor}
                        className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold"
                        required
                      />
                      <span className="text-[10px] text-slate-400">Default statutory rate: 7%</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Employer Pension Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={erPensionRate}
                        onChange={(e) => setErPensionRate(Number(e.target.value))}
                        readOnly={isAuditor}
                        className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold"
                        required
                      />
                      <span className="text-[10px] text-slate-400">Default statutory rate: 11%</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Transport Tax-Exempt Cap (ETB)</label>
                      <input
                        type="number"
                        value={transportCap}
                        onChange={(e) => setTransportCap(Number(e.target.value))}
                        readOnly={isAuditor}
                        className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold"
                        required
                      />
                      <span className="text-[10px] text-slate-400">Max tax-exempt transport allowance</span>
                    </div>
                  </div>

                  {!isAuditor && (
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-custom text-white font-bold text-xs rounded-lg hover:opacity-95 flex items-center gap-1.5 shadow-2xs"
                      >
                        <CheckCircle2 className="h-4 w-4 text-accent-custom" /> Save Statutory Rules
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* SUBTAB C: PAYROLL PERIODS */}
          {configSubTab === "periods" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 border rounded-xl shadow-2xs">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase">Monthly Payroll Processing Periods</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Open, close, and lock payroll periods to govern calculation execution.</p>
                </div>
                {!isAuditor && (
                  <button
                    onClick={handleOpenPeriodAdd}
                    className="px-3.5 py-1.5 bg-primary-custom text-white text-xs font-bold rounded-lg hover:opacity-95 flex items-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5 text-accent-custom" /> Define New Period
                  </button>
                )}
              </div>

              <div className="bg-white border rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-3">Period Name</th>
                      <th className="p-3">Start Date</th>
                      <th className="p-3">End Date</th>
                      <th className="p-3">Disbursement Date</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3">Created By</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payrollPeriods.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-800">{p.periodName}</td>
                        <td className="p-3 text-slate-600 font-medium">{p.startDate}</td>
                        <td className="p-3 text-slate-600 font-medium">{p.endDate}</td>
                        <td className="p-3 text-primary-custom font-bold">{p.paymentDate}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            p.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            p.status === "Locked" ? "bg-purple-50 text-purple-700 border-purple-200" :
                            "bg-sky-50 text-sky-700 border-sky-200"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 font-medium">{p.createdBy}</td>
                        <td className="p-3 text-right">
                          {!isAuditor && (
                            <button
                              onClick={() => handleTogglePeriodLock(p)}
                              className="p-1 px-2 text-[10px] font-bold border rounded bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1 justify-end ml-auto"
                            >
                              {p.status === "Locked" ? <Unlock className="h-3 w-3 text-emerald-600" /> : <Lock className="h-3 w-3 text-rose-600" />}
                              <span>{p.status === "Locked" ? "Unlock Period" : "Lock Period"}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* SUBMENU 3: EMPLOYEE SALARY SETUP */}
      {/* ========================================== */}
      {activeSubTab === "salary_setup" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border rounded-xl p-4 shadow-2xs flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Employee ID or Name..."
                  value={salarySearchTerm}
                  onChange={(e) => setSalarySearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs ring-primary-custom"
                />
              </div>

              <select
                value={salaryDeptFilter}
                onChange={(e) => setSalaryDeptFilter(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-xs bg-white font-semibold"
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {!isAuditor && (
              <button
                onClick={() => setBulkSalaryModalOpen(true)}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <Sliders className="h-3.5 w-3.5" /> Bulk Salary Adjustment
              </button>
            )}
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Department &amp; Title</th>
                    <th className="px-4 py-3 text-right">Basic Salary (ETB)</th>
                    <th className="px-4 py-3 text-right">Position Allowance</th>
                    <th className="px-4 py-3 text-right">Transport Allowance</th>
                    <th className="px-4 py-3 text-center">Pension Eligible</th>
                    <th className="px-4 py-3">Effective Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeEmployees.filter(emp => {
                    const matchSearch = emp.fullName.toLowerCase().includes(salarySearchTerm.toLowerCase()) || emp.employeeId.toLowerCase().includes(salarySearchTerm.toLowerCase());
                    const matchDept = salaryDeptFilter ? emp.departmentId === salaryDeptFilter : true;
                    return matchSearch && matchDept;
                  }).map(emp => {
                    const struct = salaryStructures.find(s => s.employeeId === emp.employeeId);
                    const dept = departments.find(d => d.id === emp.departmentId);

                    return (
                      <tr key={emp.employeeId} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-800 block">{emp.fullName}</span>
                          <span className="text-[10px] font-bold text-primary-custom">{emp.employeeId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800 block">{emp.position}</span>
                          <span className="text-[10px] text-slate-500">{dept?.name || "General"}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                          {struct ? struct.basicSalary.toLocaleString() : "Not Set"} ETB
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700 font-semibold">
                          {struct ? struct.positionAllowance.toLocaleString() : "0"} ETB
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700 font-semibold">
                          {struct ? struct.transportAllowance.toLocaleString() : "0"} ETB
                        </td>
                        <td className="px-4 py-3 text-center">
                          {struct?.isPensionEligible !== false ? (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full text-[10px]">Yes (7%)</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 font-bold rounded-full text-[10px]">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-medium">
                          {struct ? struct.effectiveDate : emp.hireDate}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                          {!isAuditor ? (
                            <button
                              onClick={() => handleOpenSalarySetup(emp)}
                              className="p-1.5 text-xs font-bold bg-primary-custom hover:opacity-95 text-white rounded-lg inline-flex items-center gap-1 shadow-2xs"
                            >
                              <Edit className="h-3 w-3" /> Setup Salary
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Read-Only</span>
                          )}

                          {struct?.revisionHistory && struct.revisionHistory.length > 0 && (
                            <button
                              onClick={() => setHistoryEmp(emp)}
                              className="p-1 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded inline-block"
                              title="Salary Revision History"
                            >
                              <History className="h-3.5 w-3.5" />
                            </button>
                          )}
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
      {/* SUBMENU 4: PAYROLL PROCESSING */}
      {/* ========================================== */}
      {activeSubTab === "processing" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border rounded-xl p-4 shadow-2xs flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <span className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                <Calculator className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase">Monthly Payroll Processing Engine</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Period: <strong>{selectedPeriod.periodName}</strong> | Status: <strong>{selectedPeriod.status}</strong>
                </p>
              </div>
            </div>

            {!isAuditor && selectedPeriod.status !== "Approved" && selectedPeriod.status !== "Locked" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExecuteBulkCalculation}
                  className="px-3.5 py-1.5 bg-primary-custom text-white text-xs font-bold rounded-lg hover:opacity-95 flex items-center gap-1.5 shadow-2xs"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-accent-custom" /> Calculate All Active Staff
                </button>
                {currentPeriodRecords.length > 0 && (
                  <button
                    onClick={handleSubmittedForApproval}
                    className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-1.5 shadow-2xs"
                  >
                    <Send className="h-3.5 w-3.5" /> Submit for Approval
                  </button>
                )}
              </div>
            )}
          </div>

          {/* High-density Calculation Table */}
          <div className="bg-white border rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3 text-right">Basic Salary</th>
                    <th className="px-4 py-3 text-right">Gross Salary</th>
                    <th className="px-4 py-3 text-right">Taxable Income</th>
                    <th className="px-4 py-3 text-right">Income Tax</th>
                    <th className="px-4 py-3 text-right">Employee Pension (7%)</th>
                    <th className="px-4 py-3 text-right">Other Deductions</th>
                    <th className="px-4 py-3 text-right font-extrabold text-emerald-800">Net Salary (ETB)</th>
                    <th className="px-4 py-3 text-right">Employer Pension (11%)</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentPeriodRecords.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-12 text-center text-slate-400">
                        <Calculator className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-xs text-slate-600">No payroll calculations logged for period {selectedPeriod.periodName}.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Click "Calculate All Active Staff" above to run statutory payroll.</p>
                      </td>
                    </tr>
                  ) : (
                    currentPeriodRecords.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-800 block">{r.employeeName}</span>
                          <span className="text-[10px] font-bold text-primary-custom">{r.employeeId}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-semibold">{r.departmentName}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">{r.basicSalary.toLocaleString()} ETB</td>
                        <td className="px-4 py-3 text-right font-extrabold text-slate-900">{r.grossSalary.toLocaleString()} ETB</td>
                        <td className="px-4 py-3 text-right text-slate-600">{r.taxableEarnings.toLocaleString()} ETB</td>
                        <td className="px-4 py-3 text-right text-rose-600 font-bold">{r.incomeTax.toLocaleString()} ETB</td>
                        <td className="px-4 py-3 text-right text-blue-600 font-bold">{r.employeePension.toLocaleString()} ETB</td>
                        <td className="px-4 py-3 text-right text-slate-600">{(r.loanDeduction + r.otherDeductions).toLocaleString()} ETB</td>
                        <td className="px-4 py-3 text-right font-black text-emerald-700 bg-emerald-50/50">{r.netSalary.toLocaleString()} ETB</td>
                        <td className="px-4 py-3 text-right text-indigo-700 font-bold">{r.employerPension.toLocaleString()} ETB</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setBreakdownRecord(r)}
                            className="p-1 px-2 text-[10px] font-bold border rounded bg-slate-50 hover:bg-slate-100 text-sky-700"
                            title="View Calculation Breakdown"
                          >
                            Breakdown
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SUBMENU 5: PAYROLL APPROVAL WORKFLOW */}
      {/* ========================================== */}
      {activeSubTab === "approval" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white p-6 border rounded-xl shadow-2xs space-y-4">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" /> Executive Payroll Approval Portal
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Review summary figures, audit breakdowns, and authorize monthly disbursement.</p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                selectedPeriod.status === "Approved" ? "bg-emerald-100 text-emerald-800 border-emerald-300" :
                selectedPeriod.status === "Submitted" ? "bg-amber-100 text-amber-800 border-amber-300" :
                "bg-slate-100 text-slate-700 border-slate-200"
              }`}>
                Status: {selectedPeriod.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 border rounded-xl">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Period Name</span>
                <p className="text-sm font-extrabold text-slate-800 mt-0.5">{selectedPeriod.periodName}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Calculated Staff</span>
                <p className="text-sm font-extrabold text-slate-800 mt-0.5">{periodSummary.totalEmployees} Employees</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Gross</span>
                <p className="text-sm font-extrabold text-slate-800 mt-0.5">{periodSummary.totalGross.toLocaleString()} ETB</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Net Payable</span>
                <p className="text-sm font-extrabold text-emerald-700 mt-0.5">{periodSummary.totalNet.toLocaleString()} ETB</p>
              </div>
            </div>

            {isAdmin && selectedPeriod.status !== "Approved" && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-amber-900">Administrator Approval Authorization</h4>
                <textarea
                  rows={2}
                  placeholder="Enter approval or audit comments..."
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-lg bg-white"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleRejectPayroll}
                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg border border-rose-200"
                  >
                    Reject &amp; Return
                  </button>
                  <button
                    onClick={handleApprovePayroll}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve Payroll &amp; Lock Period
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SUBMENU 6: PAYSLIP MANAGEMENT */}
      {/* ========================================== */}
      {activeSubTab === "payslips" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border rounded-xl p-4 shadow-2xs flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase">Employee Payslip Generation &amp; Email Distribution</h3>
                <p className="text-[11px] text-slate-500 font-medium">Period: {selectedPeriod.periodName} ({payslips.filter(ps => ps.payrollPeriodId === selectedPeriod.id).length} Payslips Available)</p>
              </div>
            </div>

            {!isAuditor && (
              <button
                onClick={handleBulkSendPayslips}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs"
              >
                <Mail className="h-3.5 w-3.5" /> Email All Payslips ({selectedPeriod.periodName})
              </button>
            )}
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3">Ref No</th>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Department</th>
                    <th className="p-3 text-right">Gross Salary</th>
                    <th className="p-3 text-right">Total Deductions</th>
                    <th className="p-3 text-right font-extrabold">Net Salary (ETB)</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payslips.filter(ps => ps.payrollPeriodId === selectedPeriod.id).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400">
                        <FileText className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-xs text-slate-600">No payslips generated for {selectedPeriod.periodName}.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Payslips are automatically generated upon executive payroll approval.</p>
                      </td>
                    </tr>
                  ) : (
                    payslips.filter(ps => ps.payrollPeriodId === selectedPeriod.id).map(ps => (
                      <tr key={ps.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-primary-custom">{ps.payslipRefNo}</td>
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block">{ps.employeeName}</span>
                          <span className="text-[10px] text-slate-500">{ps.employeeId}</span>
                        </td>
                        <td className="p-3 text-slate-600 font-semibold">{ps.department}</td>
                        <td className="p-3 text-right text-slate-800 font-semibold">{ps.grossSalary.toLocaleString()} ETB</td>
                        <td className="p-3 text-right text-rose-600 font-semibold">{ps.totalDeductions.toLocaleString()} ETB</td>
                        <td className="p-3 text-right font-extrabold text-emerald-700">{ps.netSalary.toLocaleString()} ETB</td>
                        <td className="p-3 text-center space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedPayslip(ps)}
                            className="p-1 px-2 text-[10px] font-bold bg-primary-custom text-white rounded hover:opacity-95"
                          >
                            View / Print
                          </button>
                          {!isAuditor && (
                            <button
                              onClick={() => handleSendSinglePayslipEmail(ps)}
                              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded inline-block"
                              title="Email Payslip"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SUBMENU 7: PAYROLL CSV IMPORT */}
      {/* ========================================== */}
      {activeSubTab === "csv_import" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white p-6 border rounded-xl shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-2">
                  <Upload className="h-4 w-4 text-sky-600" /> Dedicated Payroll CSV Bulk Import Engine
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Upload CSV file containing employee payroll or salary setup rows. All valid rows are batch imported.</p>
              </div>

              <button
                onClick={handleDownloadCsvTemplate}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 border border-slate-200"
              >
                <Download className="h-3.5 w-3.5 text-sky-600" /> Download CSV Template
              </button>
            </div>

            {/* Drag and drop Upload Box */}
            {!isAuditor ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50 space-y-3">
                <Upload className="h-10 w-10 mx-auto text-sky-500" />
                <p className="text-xs font-bold text-slate-700">Select or Drag CSV File for {selectedPeriod.periodName}</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="block mx-auto text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary-custom file:text-white hover:file:opacity-95"
                />
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold">
                Read-Only Auditor Mode: CSV import capability is restricted.
              </div>
            )}

            {/* Validation Results & Preview */}
            {importValidationResult && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Rows</span>
                    <p className="text-base font-extrabold text-slate-800 mt-0.5">{importValidationResult.summary.total}</p>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-center">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Valid Rows</span>
                    <p className="text-base font-extrabold text-emerald-800 mt-0.5">{importValidationResult.summary.successful}</p>
                  </div>
                  <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 text-center">
                    <span className="text-[10px] font-bold text-rose-600 uppercase">Errors</span>
                    <p className="text-base font-extrabold text-rose-800 mt-0.5">{importValidationResult.summary.failed}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    {importValidationResult.summary.failed > 0 && (
                      <button
                        onClick={handleDownloadErrorCsv}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-2xs"
                      >
                        <Download className="h-3.5 w-3.5" /> Download Error CSV
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setCsvFileText("");
                      setImportValidationResult(null);
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteImportCommit}
                    disabled={importValidationResult.validRecords.length === 0}
                    className="px-4 py-2 bg-primary-custom hover:opacity-95 text-white font-bold text-xs rounded-lg disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                  >
                    <CheckCircle2 className="h-4 w-4 text-accent-custom" /> Confirm &amp; Import All Valid Records
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SUBMENU 8: PAYROLL CSV EXPORT */}
      {/* ========================================== */}
      {activeSubTab === "csv_export" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white p-6 border rounded-xl shadow-2xs space-y-4 max-w-2xl">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-2 border-b pb-3">
              <Download className="h-4 w-4 text-primary-custom" /> Export Payroll Data
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Export Data Category</label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  className="w-full p-2 border rounded-lg font-bold bg-white"
                >
                  <option value="monthly_payroll">Monthly Payroll Calculation Ledger</option>
                  <option value="salary_structures">All Employee Salary Configurations</option>
                  <option value="deductions_summary">Payroll Deductions Summary</option>
                  <option value="allowances_summary">Payroll Allowances Summary</option>
                  <option value="pension_summary">Employer Pension Contributions Summary</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter by Department</label>
                <select
                  value={exportDept}
                  onChange={(e) => setExportDept(e.target.value)}
                  className="w-full p-2 border rounded-lg font-semibold bg-white"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  onClick={handleTriggerCsvExport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="h-4 w-4" /> Download Export CSV File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SUBMENU 9: PAYROLL REPORTS */}
      {/* ========================================== */}
      {activeSubTab === "reports" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white p-6 border rounded-xl shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-primary-custom text-accent-custom rounded-lg">
                  <FileSpreadsheet className="h-5 w-5" />
                </span>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase">Ethio-Re Statutory Payroll Reports Center</h3>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="h-3.5 w-3.5" /> Print / Save PDF
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              <div className="w-64">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full p-2 border rounded-lg font-bold bg-white"
                >
                  <option value="monthly_summary">1. Monthly Payroll Summary</option>
                  <option value="tax_schedule">2. Employment Income Tax (PIT) Schedule</option>
                  <option value="pension_schedule">3. Pension Contribution Schedule (7% + 11%)</option>
                  <option value="net_disbursement">4. Net Salary Disbursement Report</option>
                  <option value="variance_report">5. Payroll Variance Analysis Report</option>
                  <option value="email_distribution">6. Payslip Email Distribution Log</option>
                </select>
              </div>
            </div>

            {/* Printable Report Canvas */}
            <div className="bg-white border p-8 rounded-xl shadow-2xs printable-canvas space-y-6">
              <div className="border-b-2 border-primary-custom pb-4 flex justify-between items-center">
                <div>
                  <h1 className="font-black text-slate-800 text-base uppercase">ETHIOPIAN REINSURANCE SHARE COMPANY</h1>
                  <p className="text-xs font-bold text-primary-custom">{reportType.toUpperCase().replace("_", " ")} REPORT • {selectedPeriod.periodName}</p>
                </div>
                <div className="text-right text-[10px] text-slate-400 font-semibold">
                  <p>Date Generated: {new Date().toISOString().split("T")[0]}</p>
                  <p>Currency: ETB</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b text-[10px] font-bold text-slate-600 uppercase">
                      <th className="p-2.5">Employee ID</th>
                      <th className="p-2.5">Full Name</th>
                      <th className="p-2.5">Department</th>
                      <th className="p-2.5 text-right">Basic Salary</th>
                      <th className="p-2.5 text-right">Gross Salary</th>
                      <th className="p-2.5 text-right">Income Tax</th>
                      <th className="p-2.5 text-right">Employee Pension</th>
                      <th className="p-2.5 text-right font-extrabold">Net Salary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-800">
                    {currentPeriodRecords.map(r => (
                      <tr key={r.id}>
                        <td className="p-2.5 font-bold text-primary-custom">{r.employeeId}</td>
                        <td className="p-2.5 font-bold">{r.employeeName}</td>
                        <td className="p-2.5 text-slate-600">{r.departmentName}</td>
                        <td className="p-2.5 text-right font-semibold">{r.basicSalary.toLocaleString()} ETB</td>
                        <td className="p-2.5 text-right font-bold">{r.grossSalary.toLocaleString()} ETB</td>
                        <td className="p-2.5 text-right text-rose-600 font-bold">{r.incomeTax.toLocaleString()} ETB</td>
                        <td className="p-2.5 text-right text-blue-600 font-bold">{r.employeePension.toLocaleString()} ETB</td>
                        <td className="p-2.5 text-right font-black text-emerald-800">{r.netSalary.toLocaleString()} ETB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SUBMENU 10: PAYROLL HISTORY */}
      {/* ========================================== */}
      {activeSubTab === "history" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white p-4 border rounded-xl shadow-2xs">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-2">
              <History className="h-4 w-4 text-primary-custom" /> Historical Payroll &amp; Audit Log
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Archive of all approved and closed monthly payroll periods.</p>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase">
                  <th className="p-3">Period</th>
                  <th className="p-3">Approved Date</th>
                  <th className="p-3">Approved By</th>
                  <th className="p-3 text-center">Staff Count</th>
                  <th className="p-3 text-right">Total Net Disbursement</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollPeriods.map(p => {
                  const pRecords = payrollRecords.filter(r => r.payrollPeriodId === p.id);
                  const net = pRecords.reduce((s, r) => s + r.netSalary, 0);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-800">{p.periodName}</td>
                      <td className="p-3 text-slate-500">{p.approvedDate || p.createdDate}</td>
                      <td className="p-3 text-slate-600 font-semibold">{p.approvedBy || p.createdBy}</td>
                      <td className="p-3 text-center font-bold text-slate-800">{pRecords.length}</td>
                      <td className="p-3 text-right font-extrabold text-emerald-700">{net.toLocaleString()} ETB</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px] border border-emerald-200">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 1: SALARY COMPONENT ADD/EDIT */}
      {/* ========================================== */}
      {compModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-primary-custom text-white px-5 py-3.5 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase">{editingComp ? "Edit Salary Component" : "Create Salary Component"}</h3>
              <button onClick={() => setCompModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveComponent} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Component Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Hardship Allowance"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Code *</label>
                  <input
                    type="text"
                    placeholder="HA"
                    value={compCode}
                    onChange={(e) => setCompCode(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type *</label>
                  <select
                    value={compType}
                    onChange={(e) => setCompType(e.target.value as any)}
                    className="w-full px-3 py-1.5 border rounded-lg font-bold"
                  >
                    <option value="Earning">Earning</option>
                    <option value="Deduction">Deduction</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Calculation Method</label>
                <select
                  value={compMethod}
                  onChange={(e) => setCompMethod(e.target.value as any)}
                  className="w-full px-3 py-1.5 border rounded-lg font-semibold"
                >
                  <option value="Fixed Amount">Fixed Amount</option>
                  <option value="Percentage">Percentage</option>
                  <option value="Based on Basic Salary">Based on Basic Salary</option>
                  <option value="Formula-Based">Formula-Based</option>
                </select>
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compTaxable}
                    onChange={(e) => setCompTaxable(e.target.checked)}
                  />
                  <span>Is Taxable</span>
                </label>

                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compPensionable}
                    onChange={(e) => setCompPensionable(e.target.checked)}
                  />
                  <span>Is Pensionable</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setCompModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary-custom text-white font-bold rounded-lg shadow-2xs"
                >
                  Save Component
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: PAYROLL PERIOD ADD */}
      {/* ========================================== */}
      {periodModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-primary-custom text-white px-5 py-3.5 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase">Define Monthly Payroll Period</h3>
              <button onClick={() => setPeriodModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSavePeriod} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Period Name *</label>
                <input
                  type="text"
                  placeholder="e.g. March 2026"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={pStart}
                    onChange={(e) => setPStart(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={pEnd}
                    onChange={(e) => setPEnd(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment / Disbursement Date</label>
                <input
                  type="date"
                  value={pPayment}
                  onChange={(e) => setPPayment(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg font-bold"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setPeriodModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary-custom text-white font-bold rounded-lg shadow-2xs"
                >
                  Create Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: INDIVIDUAL SALARY SETUP MODAL */}
      {/* ========================================== */}
      {salaryModalOpen && selectedEmpForSetup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-primary-custom text-white px-5 py-3.5 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold uppercase">Configure Employee Salary Structure</h3>
                <p className="text-[10px] text-accent-custom font-semibold">{selectedEmpForSetup.fullName} ({selectedEmpForSetup.employeeId})</p>
              </div>
              <button onClick={() => setSalaryModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSalarySetup} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Basic Salary (ETB) *</label>
                  <input
                    type="number"
                    value={structBasic}
                    onChange={(e) => setStructBasic(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border rounded-lg font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Salary Grade / Step</label>
                  <input
                    type="text"
                    placeholder="e.g. Grade 12"
                    value={structGrade}
                    onChange={(e) => setStructGrade(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Position Allowance</label>
                  <input
                    type="number"
                    value={structPosition}
                    onChange={(e) => setStructPosition(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transport Allowance</label>
                  <input
                    type="number"
                    value={structTransport}
                    onChange={(e) => setStructTransport(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Housing Allowance</label>
                  <input
                    type="number"
                    value={structHousing}
                    onChange={(e) => setStructHousing(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Staff Loan Installment (ETB)</label>
                  <input
                    type="number"
                    value={structLoanDeduction}
                    onChange={(e) => setStructLoanDeduction(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Effective Date *</label>
                  <input
                    type="date"
                    value={structEffectiveDate}
                    onChange={(e) => setStructEffectiveDate(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pensionCheck"
                  checked={structPensionEligible}
                  onChange={(e) => setStructPensionEligible(e.target.checked)}
                />
                <label htmlFor="pensionCheck" className="font-bold cursor-pointer text-slate-800">
                  Pension Contribution Eligible (Enforces 7% Employee / 11% Employer statutory rates)
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Salary Revision Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Annual merit raise / promotion adjustment"
                  value={structRevisionReason}
                  onChange={(e) => setStructRevisionReason(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSalaryModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary-custom text-white font-bold rounded-lg shadow-2xs"
                >
                  Save Salary Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 4: BULK SALARY ADJUSTMENT MODAL */}
      {/* ========================================== */}
      {bulkSalaryModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-amber-500 text-slate-900 px-5 py-3.5 flex justify-between items-center">
              <h3 className="text-xs font-extrabold uppercase">Bulk Salary Adjustment</h3>
              <button onClick={() => setBulkSalaryModalOpen(false)} className="text-slate-900/80 hover:text-slate-900">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Department</label>
                <select
                  value={bulkDept}
                  onChange={(e) => setBulkDept(e.target.value)}
                  className="w-full p-2 border rounded-lg font-semibold bg-white"
                >
                  <option value="">All Departments ({activeEmployees.length} Staff)</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Adjustment Type</label>
                  <select
                    value={bulkType}
                    onChange={(e) => setBulkType(e.target.value as any)}
                    className="w-full p-2 border rounded-lg font-bold bg-white"
                  >
                    <option value="Percentage">Percentage (%) Increase</option>
                    <option value="Fixed">Fixed Amount (ETB) Increase</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Value *</label>
                  <input
                    type="number"
                    value={bulkValue}
                    onChange={(e) => setBulkValue(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setBulkSalaryModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkSalaryUpdate}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold rounded-lg shadow-2xs"
                >
                  Apply Bulk Adjustment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 5: PAYSLIP VIEW / PRINT MODAL */}
      {/* ========================================== */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[90vh] flex flex-col">
            <div className="bg-primary-custom text-white px-5 py-3.5 flex justify-between items-center shrink-0">
              <h3 className="text-xs font-bold uppercase">Official Salary Payslip – Ethiopian Reinsurance S.C.</h3>
              <button onClick={() => setSelectedPayslip(null)} className="text-white/80 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-xs printable-canvas">
              {/* Branded Letterhead */}
              <div className="border-b-2 border-primary-custom pb-4 flex justify-between items-center">
                <div>
                  <h2 className="font-extrabold text-sm text-slate-900 uppercase">ETHIOPIAN REINSURANCE SHARE COMPANY</h2>
                  <p className="text-[10px] text-accent-custom font-extrabold uppercase">Confidential Salary Remuneration Statement</p>
                </div>
                <div className="text-right text-[10px] text-slate-500 font-bold">
                  <p>Ref: <span className="font-mono text-primary-custom">{selectedPayslip.payslipRefNo}</span></p>
                  <p>Payment Date: {selectedPayslip.paymentDate}</p>
                </div>
              </div>

              {/* Employee & Period Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Employee ID &amp; Name</span>
                  <p className="font-extrabold text-slate-800 mt-0.5">{selectedPayslip.employeeName} ({selectedPayslip.employeeId})</p>
                  <p className="text-[10px] text-slate-500">{selectedPayslip.position}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Department &amp; Period</span>
                  <p className="font-extrabold text-slate-800 mt-0.5">{selectedPayslip.department}</p>
                  <p className="text-[10px] text-primary-custom font-bold">{selectedPayslip.payrollPeriodName}</p>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Earnings */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-800 text-xs border-b pb-1 uppercase text-emerald-800">Earnings Breakdown</h4>
                  <div className="space-y-1">
                    {selectedPayslip.earningsBreakdown.map((item, i) => (
                      <div key={i} className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600 font-medium">{item.name}</span>
                        <span className="font-bold text-slate-800">{item.amount.toLocaleString()} ETB</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 border-t-2 border-emerald-500 font-extrabold text-slate-900 bg-emerald-50/50 px-2 rounded">
                      <span>Total Gross Salary</span>
                      <span>{selectedPayslip.grossSalary.toLocaleString()} ETB</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-800 text-xs border-b pb-1 uppercase text-rose-800">Deductions Breakdown</h4>
                  <div className="space-y-1">
                    {selectedPayslip.deductionsBreakdown.map((item, i) => (
                      <div key={i} className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600 font-medium">{item.name}</span>
                        <span className="font-bold text-rose-600">{item.amount.toLocaleString()} ETB</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 border-t-2 border-rose-500 font-extrabold text-slate-900 bg-rose-50/50 px-2 rounded">
                      <span>Total Deductions</span>
                      <span>{selectedPayslip.totalDeductions.toLocaleString()} ETB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary Highlight Banner */}
              <div className="p-4 bg-primary-custom text-white rounded-xl flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-accent-custom uppercase">Net Remuneration Paid</span>
                  <p className="text-xl font-black">{selectedPayslip.netSalary.toLocaleString()} ETB</p>
                </div>
                <div className="text-right text-[10px] text-slate-300 font-semibold">
                  <p>Employer Pension (11%): {selectedPayslip.employerPension.toLocaleString()} ETB</p>
                  <p className="italic text-slate-400">Calculated separately per statutory rules</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-between items-center shrink-0">
              <span className="text-[10px] text-slate-400 font-bold">Generated: {selectedPayslip.generatedDate}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" /> Print / PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 6: CALCULATION BREAKDOWN MODAL */}
      {/* ========================================== */}
      {breakdownRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-primary-custom text-white px-5 py-3.5 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold uppercase">Payroll Calculation Audit Breakdown</h3>
                <p className="text-[10px] text-accent-custom font-semibold">{breakdownRecord.employeeName} ({breakdownRecord.employeeId})</p>
              </div>
              <button onClick={() => setBreakdownRecord(null)} className="text-white/80 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border rounded-lg space-y-1.5 font-mono">
                <p>1. Basic Salary: {breakdownRecord.basicSalary.toLocaleString()} ETB</p>
                <p>2. Gross Earnings: {breakdownRecord.grossSalary.toLocaleString()} ETB</p>
                <p>3. Tax-Exempt Exemptions: -{breakdownRecord.taxExemptEarnings.toLocaleString()} ETB</p>
                <p className="font-bold text-primary-custom">4. Taxable Income: {breakdownRecord.taxableEarnings.toLocaleString()} ETB</p>
                <p className="text-rose-600 font-bold">5. Employment Income Tax: {breakdownRecord.incomeTax.toLocaleString()} ETB</p>
                <p className="text-blue-600 font-bold">6. Employee Pension (7%): {breakdownRecord.employeePension.toLocaleString()} ETB</p>
                <p className="font-bold text-emerald-700">7. Net Salary: {breakdownRecord.netSalary.toLocaleString()} ETB</p>
                <p className="text-indigo-700">8. Employer Pension (11%): {breakdownRecord.employerPension.toLocaleString()} ETB</p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setBreakdownRecord(null)}
                  className="px-4 py-1.5 bg-primary-custom text-white font-bold text-xs rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
