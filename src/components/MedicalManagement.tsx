import React, { useState, useEffect, useMemo } from "react";
import { 
  Employee, Department, CompanyConfig, User,
  FamilyMember, MedicalExpense, MedicalPolicyConfig, RelationshipType 
} from "../types";
import { 
  Plus, Search, Edit, Trash2, Calendar, Check, X, Save, 
  FileSpreadsheet, Printer, RefreshCw, Calculator, Ban, Info, AlertTriangle,
  LayoutDashboard, FileText, CheckCircle2, ShieldAlert, Clock, ArrowRight,
  Sliders, Settings, ChevronRight, Download, Filter, UserCheck, Layers, Award,
  HeartPulse, UserPlus, Users, DollarSign, ExternalLink, ShieldCheck, Stethoscope, Building2
} from "lucide-react";

interface MedicalManagementProps {
  medicalExpenses: MedicalExpense[];
  familyMembers: FamilyMember[];
  employees: Employee[];
  departments: Department[];
  companyConfig: CompanyConfig;
  currentUser: User | null;
  initialSubTab?: string;
  onAddMedicalExpense: (record: MedicalExpense) => boolean;
  onUpdateMedicalExpense: (record: MedicalExpense) => void;
  onDeleteMedicalExpense: (id: string) => void;
  onAddFamilyMember: (record: FamilyMember) => boolean;
  onUpdateFamilyMember: (record: FamilyMember) => void;
  onDeleteFamilyMember?: (id: string) => boolean;
  onUpdateConfig: (config: CompanyConfig) => void;
  onLogAction: (module: string, action: string, record: string, details: string) => void;
}

export default function MedicalManagement({
  medicalExpenses,
  familyMembers,
  employees,
  departments,
  companyConfig,
  currentUser,
  initialSubTab = "dashboard",
  onAddMedicalExpense,
  onUpdateMedicalExpense,
  onDeleteMedicalExpense,
  onAddFamilyMember,
  onUpdateFamilyMember,
  onDeleteFamilyMember,
  onUpdateConfig,
  onLogAction
}: MedicalManagementProps) {
  // Navigation Subtab state (dashboard, claims, family, policy, reports)
  const [activeSubTab, setActiveSubTab] = useState<string>(() => {
    if (initialSubTab && ["dashboard", "claims", "family", "policy", "reports"].includes(initialSubTab)) {
      return initialSubTab;
    }
    return "dashboard";
  });

  useEffect(() => {
    if (initialSubTab && ["dashboard", "claims", "family", "policy", "reports"].includes(initialSubTab)) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Policy configuration with fallback
  const medicalPolicy: MedicalPolicyConfig = useMemo(() => {
    return companyConfig.medicalPolicyConfig || {
      defaultFamilyAllocationETB: 100000,
      employeeAllocationUnlimited: true,
      requiresInvoiceNumber: true,
      currencySymbol: "ETB"
    };
  }, [companyConfig]);

  const activeEmployees = useMemo(() => employees.filter(e => {
    if (e.status !== "Active") return false;
    if (currentUser?.role === "Employee") {
      return e.email.toLowerCase() === currentUser.email.toLowerCase() || e.employeeId === currentUser.employeeId;
    }
    return true;
  }), [employees, currentUser]);

  // Calculate per-employee medical summary (Employee Expenses, Family Expenses, Remaining Allocation)
  const employeeMedicalSummaries = useMemo(() => {
    const defaultAllocation = medicalPolicy.defaultFamilyAllocationETB || 100000;
    const isEmployee = currentUser?.role === "Employee";
    return activeEmployees.map(emp => {
      if (isEmployee && emp.employeeId !== currentUser?.employeeId) return null;
      const empExpenses = medicalExpenses
        .filter(m => m.employeeId === emp.employeeId && m.beneficiaryType === "Employee")
        .reduce((sum, m) => sum + (m.amountETB || 0), 0);

      const familyExpenses = medicalExpenses
        .filter(m => m.employeeId === emp.employeeId && m.beneficiaryType === "Family Member")
        .reduce((sum, m) => sum + (m.amountETB || 0), 0);

      const empFamilyMembers = familyMembers.filter(f => f.employeeId === emp.employeeId && f.status === "Active");

      const remainingAllocation = Math.max(0, defaultAllocation - familyExpenses);
      const isOverdrawn = familyExpenses > defaultAllocation;

      return {
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        departmentId: emp.departmentId,
        empExpenses,
        familyExpenses,
        totalExpenses: empExpenses + familyExpenses,
        allocatedFamilyLimit: defaultAllocation,
        remainingAllocation,
        isOverdrawn,
        activeFamilyCount: empFamilyMembers.length
      };
    }).filter(Boolean) as any[];
  }, [activeEmployees, medicalExpenses, familyMembers, medicalPolicy, currentUser]);

  // Total organization-wide medical metrics
  const totalMetrics = useMemo(() => {
    const isEmployee = currentUser?.role === "Employee";
    const myEmpId = currentUser?.employeeId;

    const filteredExpenses = isEmployee 
      ? medicalExpenses.filter(m => m.employeeId === myEmpId)
      : medicalExpenses;

    const filteredFamilyMembers = isEmployee
      ? familyMembers.filter(f => f.employeeId === myEmpId)
      : familyMembers;

    const totalEmpMedical = filteredExpenses
      .filter(m => m.beneficiaryType === "Employee")
      .reduce((sum, m) => sum + (m.amountETB || 0), 0);

    const totalFamilyMedical = filteredExpenses
      .filter(m => m.beneficiaryType === "Family Member")
      .reduce((sum, m) => sum + (m.amountETB || 0), 0);

    const totalCombined = totalEmpMedical + totalFamilyMedical;
    const totalFamilyAllocated = (isEmployee ? 1 : activeEmployees.length) * (medicalPolicy.defaultFamilyAllocationETB || 100000);
    const totalFamilyRemaining = Math.max(0, totalFamilyAllocated - totalFamilyMedical);

    return {
      totalEmpMedical,
      totalFamilyMedical,
      totalCombined,
      totalFamilyAllocated,
      totalFamilyRemaining,
      activeFamilyMembersCount: filteredFamilyMembers.filter(f => f.status === "Active").length
    };
  }, [medicalExpenses, familyMembers, activeEmployees, medicalPolicy, currentUser]);

  // ==========================================
  // CLAIMS REGISTER STATE & MODALS
  // ==========================================
  const [claimSearchTerm, setClaimSearchTerm] = useState("");
  const [claimBeneficiaryFilter, setClaimBeneficiaryFilter] = useState("");
  const [claimDeptFilter, setClaimDeptFilter] = useState("");

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<MedicalExpense | null>(null);

  // Claim Form State
  const [claimEmpId, setClaimEmpId] = useState("");
  const [claimBenType, setClaimBenType] = useState<"Employee" | "Family Member">("Family Member");
  const [claimFamilyMemberId, setClaimFamilyMemberId] = useState("");
  const [claimService, setClaimService] = useState("");
  const [claimFacility, setClaimFacility] = useState("");
  const [claimDate, setClaimDate] = useState(new Date().toISOString().split("T")[0]);
  const [claimInvoiceNo, setClaimInvoiceNo] = useState("");
  const [claimAmount, setClaimAmount] = useState<number | "">("");
  const [claimDocUrl, setClaimDocUrl] = useState("");
  const [claimRemarks, setClaimRemarks] = useState("");
  const [claimAdminBypass, setClaimAdminBypass] = useState(false);

  const [claimError, setClaimError] = useState("");
  const [claimSuccess, setClaimSuccess] = useState("");

  // Available family members for selected employee
  const availableFamilyMembers = useMemo(() => {
    if (!claimEmpId) return [];
    return familyMembers.filter(f => f.employeeId === claimEmpId && f.status === "Active" && f.medicalEligibility);
  }, [claimEmpId, familyMembers]);

  // Selected employee's remaining family allocation preview
  const selectedEmpFamilyAllocationState = useMemo(() => {
    if (!claimEmpId) return { allocated: 100000, currentUsed: 0, remaining: 100000 };
    const empSummary = employeeMedicalSummaries.find(s => s.employeeId === claimEmpId);
    if (empSummary) {
      // If editing existing claim, subtract existing claim amount from used to check available room
      let used = empSummary.familyExpenses;
      if (selectedClaim && selectedClaim.beneficiaryType === "Family Member" && selectedClaim.employeeId === claimEmpId) {
        used = Math.max(0, used - selectedClaim.amountETB);
      }
      return {
        allocated: empSummary.allocatedFamilyLimit,
        currentUsed: used,
        remaining: Math.max(0, empSummary.allocatedFamilyLimit - used)
      };
    }
    return { allocated: 100000, currentUsed: 0, remaining: 100000 };
  }, [claimEmpId, employeeMedicalSummaries, selectedClaim]);

  const resetClaimForm = () => {
    const firstEmp = activeEmployees[0]?.employeeId || "";
    setClaimEmpId(firstEmp);
    setClaimBenType("Family Member");
    const empFams = familyMembers.filter(f => f.employeeId === firstEmp && f.status === "Active");
    setClaimFamilyMemberId(empFams[0]?.id || "");
    setClaimService("");
    setClaimFacility("");
    setClaimDate(new Date().toISOString().split("T")[0]);
    setClaimInvoiceNo("");
    setClaimAmount("");
    setClaimDocUrl("");
    setClaimRemarks("");
    setClaimAdminBypass(false);
    setClaimError("");
    setClaimSuccess("");
  };

  const handleOpenClaimAdd = () => {
    setSelectedClaim(null);
    resetClaimForm();
    setClaimModalOpen(true);
  };

  const handleOpenClaimEdit = (rec: MedicalExpense) => {
    setSelectedClaim(rec);
    setClaimEmpId(rec.employeeId);
    setClaimBenType(rec.beneficiaryType);
    setClaimFamilyMemberId(rec.familyMemberId || "");
    setClaimService(rec.medicalService);
    setClaimFacility(rec.facilityName);
    setClaimDate(rec.expenseDate);
    setClaimInvoiceNo(rec.invoiceNumber);
    setClaimAmount(rec.amountETB);
    setClaimDocUrl(rec.supportingDocumentUrl || "");
    setClaimRemarks(rec.remarks || "");
    setClaimAdminBypass(false);
    setClaimError("");
    setClaimSuccess("");
    setClaimModalOpen(true);
  };

  const handleSaveClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError("");
    setClaimSuccess("");

    if (!claimEmpId || !claimService.trim() || !claimFacility.trim() || !claimDate || !claimAmount || Number(claimAmount) <= 0) {
      setClaimError("Please fill out all required fields with a valid expense amount in ETB.");
      return;
    }

    if (medicalPolicy.requiresInvoiceNumber && !claimInvoiceNo.trim()) {
      setClaimError("Company policy requires a valid Invoice / Receipt Number.");
      return;
    }

    const empObj = employees.find(e => e.employeeId === claimEmpId);
    if (!empObj) {
      setClaimError("Invalid Employee ID.");
      return;
    }

    let benName = empObj.fullName;
    let rel: "Self" | RelationshipType = "Self";

    if (claimBenType === "Family Member") {
      const famObj = familyMembers.find(f => f.id === claimFamilyMemberId);
      if (!famObj) {
        setClaimError("Please select an eligible family member beneficiary.");
        return;
      }
      benName = famObj.fullName;
      rel = famObj.relationship;

      // Allocation check
      const amt = Number(claimAmount);
      if (amt > selectedEmpFamilyAllocationState.remaining && !claimAdminBypass) {
        setClaimError(`Medical expense of ${amt.toLocaleString()} ETB exceeds the employee's remaining family allocation of ${selectedEmpFamilyAllocationState.remaining.toLocaleString()} ETB.`);
        return;
      }
    }

    const newClaim: MedicalExpense = {
      id: selectedClaim ? selectedClaim.id : `MED_${Date.now()}`,
      employeeId: claimEmpId,
      employeeName: empObj.fullName,
      beneficiaryType: claimBenType,
      familyMemberId: claimBenType === "Family Member" ? claimFamilyMemberId : undefined,
      beneficiaryName: benName,
      relationship: rel,
      medicalService: claimService.trim(),
      facilityName: claimFacility.trim(),
      expenseDate: claimDate,
      invoiceNumber: claimInvoiceNo.trim(),
      amountETB: Number(claimAmount),
      supportingDocumentUrl: claimDocUrl.trim() || undefined,
      remarks: claimRemarks.trim(),
      recordedBy: currentUser?.email || "system@ethiopianre.com",
      createdDate: selectedClaim ? selectedClaim.createdDate : new Date().toISOString().replace("T", " ").substring(0, 19),
      updatedDate: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    if (selectedClaim) {
      onUpdateMedicalExpense(newClaim);
      setClaimSuccess("Medical expense claim updated successfully!");
      onLogAction("Medical", "Update Expense Claim", newClaim.id, `Updated claim for ${newClaim.beneficiaryName} (${newClaim.amountETB} ETB)`);
    } else {
      const ok = onAddMedicalExpense(newClaim);
      if (ok) {
        setClaimSuccess("Medical expense claim recorded successfully!");
        onLogAction("Medical", "Create Expense Claim", newClaim.id, `Recorded medical claim of ${newClaim.amountETB} ETB for ${newClaim.beneficiaryName} at ${newClaim.facilityName}`);
      } else {
        setClaimError("Could not save claim record.");
      }
    }

    setTimeout(() => {
      setClaimModalOpen(false);
    }, 1000);
  };

  const handleDeleteClaim = (rec: MedicalExpense) => {
    const confirmCheck = window.confirm(`Are you sure you want to delete medical expense claim #${rec.invoiceNumber} (${rec.amountETB.toLocaleString()} ETB)?`);
    if (confirmCheck) {
      onDeleteMedicalExpense(rec.id);
      onLogAction("Medical", "Delete Expense Claim", rec.id, `Deleted claim #${rec.invoiceNumber} for ${rec.beneficiaryName}`);
    }
  };

  // ==========================================
  // FAMILY MEMBER REGISTRY STATE & MODALS
  // ==========================================
  const [famSearchTerm, setFamSearchTerm] = useState("");
  const [famRelFilter, setFamRelFilter] = useState("");
  const [famStatusFilter, setFamStatusFilter] = useState("");

  const [famModalOpen, setFamModalOpen] = useState(false);
  const [selectedFam, setSelectedFam] = useState<FamilyMember | null>(null);

  // Family Form State
  const [famEmpId, setFamEmpId] = useState("");
  const [famFullName, setFamFullName] = useState("");
  const [famRelationship, setFamRelationship] = useState<RelationshipType>("Spouse");
  const [famGender, setFamGender] = useState<"Male" | "Female">("Female");
  const [famDob, setFamDob] = useState("1990-01-01");
  const [famPhone, setFamPhone] = useState("");
  const [famEligibility, setFamEligibility] = useState(true);
  const [famStatus, setFamStatus] = useState<"Active" | "Inactive">("Active");

  const [famError, setFamError] = useState("");
  const [famSuccess, setFamSuccess] = useState("");

  const resetFamForm = () => {
    setFamEmpId(activeEmployees[0]?.employeeId || "");
    setFamFullName("");
    setFamRelationship("Spouse");
    setFamGender("Female");
    setFamDob("1992-01-01");
    setFamPhone("");
    setFamEligibility(true);
    setFamStatus("Active");
    setFamError("");
    setFamSuccess("");
  };

  const handleOpenFamAdd = (empId?: string) => {
    setSelectedFam(null);
    resetFamForm();
    if (empId) setFamEmpId(empId);
    setFamModalOpen(true);
  };

  const handleOpenFamEdit = (fam: FamilyMember) => {
    setSelectedFam(fam);
    setFamEmpId(fam.employeeId);
    setFamFullName(fam.fullName);
    setFamRelationship(fam.relationship);
    setFamGender(fam.gender);
    setFamDob(fam.dob);
    setFamPhone(fam.phoneNumber || "");
    setFamEligibility(fam.medicalEligibility);
    setFamStatus(fam.status);
    setFamError("");
    setFamSuccess("");
    setFamModalOpen(true);
  };

  const handleSaveFamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFamError("");
    setFamSuccess("");

    if (!famEmpId || !famFullName.trim() || !famDob) {
      setFamError("Please fill out all required fields for the family member.");
      return;
    }

    const empObj = employees.find(e => e.employeeId === famEmpId);
    if (!empObj) {
      setFamError("Invalid Employee ID.");
      return;
    }

    const newFam: FamilyMember = {
      id: selectedFam ? selectedFam.id : `FAM_${Date.now()}`,
      employeeId: famEmpId,
      fullName: famFullName.trim(),
      relationship: famRelationship,
      gender: famGender,
      dob: famDob,
      phoneNumber: famPhone.trim() || undefined,
      medicalEligibility: famEligibility,
      status: famStatus,
      createdDate: selectedFam ? selectedFam.createdDate : new Date().toISOString().replace("T", " ").substring(0, 19),
      updatedDate: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    if (selectedFam) {
      onUpdateFamilyMember(newFam);
      setFamSuccess("Family member record updated!");
      onLogAction("Medical", "Update Family Member", newFam.id, `Updated family record of ${newFam.fullName} (${newFam.relationship}) for employee ${empObj.fullName}`);
    } else {
      const ok = onAddFamilyMember(newFam);
      if (ok) {
        setFamSuccess("Family member registered successfully!");
        onLogAction("Medical", "Create Family Member", newFam.id, `Registered family member ${newFam.fullName} (${newFam.relationship}) for employee ${empObj.fullName}`);
      } else {
        setFamError("Could not save family record.");
      }
    }

    setTimeout(() => {
      setFamModalOpen(false);
    }, 1000);
  };

  const handleToggleFamStatus = (fam: FamilyMember) => {
    const updatedStatus = fam.status === "Active" ? "Inactive" : "Active";
    const confirmCheck = window.confirm(`Change ${fam.fullName}'s status to ${updatedStatus}?`);
    if (confirmCheck) {
      const updated = { ...fam, status: updatedStatus as any, updatedDate: new Date().toISOString().replace("T", " ").substring(0, 19) };
      onUpdateFamilyMember(updated);
      onLogAction("Medical", "Toggle Family Status", fam.id, `Set status of ${fam.fullName} to ${updatedStatus}`);
    }
  };

  // ==========================================
  // POLICY CONFIGURATION STATE (Admin)
  // ==========================================
  const [polDefaultAlloc, setPolDefaultAlloc] = useState<number>(medicalPolicy.defaultFamilyAllocationETB);
  const [polReqInvoice, setPolReqInvoice] = useState<boolean>(medicalPolicy.requiresInvoiceNumber);

  const handleSavePolicySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (polDefaultAlloc < 0) {
      alert("Allocation amount must be a positive number.");
      return;
    }

    const updatedConfig: CompanyConfig = {
      ...companyConfig,
      medicalPolicyConfig: {
        ...medicalPolicy,
        defaultFamilyAllocationETB: Number(polDefaultAlloc),
        requiresInvoiceNumber: polReqInvoice,
        updatedBy: currentUser?.email || "contactesfaye@gmail.com",
        updatedDate: new Date().toISOString().replace("T", " ").substring(0, 19)
      }
    };

    onUpdateConfig(updatedConfig);
    onLogAction("MedicalPolicy", "Update Policy", "Family Allocation", `Updated default family aggregate allocation to ${Number(polDefaultAlloc).toLocaleString()} ETB per employee`);
    alert("Medical Benefit Policy updated successfully!");
  };

  // ==========================================
  // REPORTS STATE & EXPORT
  // ==========================================
  const [reportView, setReportView] = useState<"summary" | "beneficiary" | "department" | "claims">("summary");

  const handleExportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,";
    if (reportView === "summary") {
      csv += "Employee ID,Employee Name,Department,Employee Medical Expenses (ETB),Family Medical Expenses (ETB),Total Expenses (ETB),Configured Family Allocation (ETB),Remaining Family Allocation (ETB)\r\n";
      employeeMedicalSummaries.forEach(s => {
        const dObj = departments.find(d => d.id === s.departmentId);
        csv += `"${s.employeeId}","${s.fullName}","${dObj?.name || ""}","${s.empExpenses}","${s.familyExpenses}","${s.totalExpenses}","${s.allocatedFamilyLimit}","${s.remainingAllocation}"\r\n`;
      });
    } else {
      csv += "Claim ID,Employee ID,Employee Name,Beneficiary Type,Beneficiary Name,Relationship,Service,Facility,Date,Invoice No,Amount ETB\r\n";
      medicalExpenses.forEach(m => {
        csv += `"${m.id}","${m.employeeId}","${m.employeeName}","${m.beneficiaryType}","${m.beneficiaryName}","${m.relationship}","${m.medicalService}","${m.facilityName}","${m.expenseDate}","${m.invoiceNumber}","${m.amountETB}"\r\n`;
      });
    }

    const encoded = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", `ethiore_medical_report_${reportView}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-50 rounded-lg border border-rose-200 text-rose-600">
              <HeartPulse className="h-5 w-5" />
            </span>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">Family Members &amp; Medical Expense Management</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Ethiopian Reinsurance S.C. healthcare benefit administration, family dependent registry, and claim reimbursement tracker.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser?.role === "Auditor" && (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              <span>Read-Only Auditor Mode</span>
            </span>
          )}
          {currentUser?.role !== "Auditor" && (
            <>
              <button
                onClick={() => handleOpenFamAdd()}
                className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <UserPlus className="h-3.5 w-3.5 text-sky-600" />
                <span>Add Family Member</span>
              </button>
              <button
                onClick={() => handleOpenClaimAdd()}
                className="px-3.5 py-1.5 bg-primary-custom hover:opacity-95 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5 text-accent-custom" />
                <span>Record Expense Claim</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Submenu Tab Bar */}
      <div className="bg-white border-b border-slate-200 rounded-xl p-1 shadow-2xs flex items-center gap-1 overflow-x-auto text-xs font-bold">
        {[
          { id: "dashboard", label: "1. Medical Dashboard", icon: LayoutDashboard },
          { id: "claims", label: "2. Expense Claims Register", icon: FileText },
          { id: "family", label: "3. Family Members Registry", icon: Users },
          { id: "policy", label: "4. Policy Settings", icon: Settings, adminOnly: true },
          { id: "reports", label: "5. Medical Reports", icon: FileSpreadsheet }
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
      {/* SUBMENU 1: MEDICAL DASHBOARD */}
      {/* ========================================== */}
      {activeSubTab === "dashboard" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Employee Medical</p>
                <p className="text-xl font-extrabold text-slate-800 mt-1">
                  {totalMetrics.totalEmpMedical.toLocaleString()} <span className="text-xs font-semibold text-slate-500">ETB</span>
                </p>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                  Unlimited Allocation Tier
                </span>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Stethoscope className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Family Medical</p>
                <p className="text-xl font-extrabold text-slate-800 mt-1">
                  {totalMetrics.totalFamilyMedical.toLocaleString()} <span className="text-xs font-semibold text-slate-500">ETB</span>
                </p>
                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                  Shared Family Pool
                </span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <HeartPulse className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Family Cap / Emp</p>
                <p className="text-xl font-extrabold text-slate-800 mt-1">
                  {medicalPolicy.defaultFamilyAllocationETB.toLocaleString()} <span className="text-xs font-semibold text-slate-500">ETB</span>
                </p>
                <span className="text-[9px] font-semibold text-slate-500 block mt-1">
                  Aggregated per Employee
                </span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Award className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Dependents</p>
                <p className="text-xl font-extrabold text-slate-800 mt-1">
                  {totalMetrics.activeFamilyMembersCount} Members
                </p>
                <span className="text-[9px] font-semibold text-slate-500 block mt-1">
                  Linked Family Records
                </span>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Expense Claims Table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4 w-4 text-rose-600" /> Recent Medical Expense Claims
                </h3>
                <button
                  onClick={() => setActiveSubTab("claims")}
                  className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
                >
                  View All Claims <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase border-b">
                      <th className="p-3">Employee</th>
                      <th className="p-3">Beneficiary</th>
                      <th className="p-3">Service &amp; Facility</th>
                      <th className="p-3 text-right">Amount (ETB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {medicalExpenses.filter(m => {
                      const isEmployee = currentUser?.role === "Employee";
                      const isMyRecord = !isEmployee || m.employeeId === currentUser?.employeeId;
                      return isMyRecord;
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">
                          No medical expense claims logged yet.
                        </td>
                      </tr>
                    ) : (
                      medicalExpenses.filter(m => {
                        const isEmployee = currentUser?.role === "Employee";
                        const isMyRecord = !isEmployee || m.employeeId === currentUser?.employeeId;
                        return isMyRecord;
                      }).slice(0, 5).map(m => (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <span className="font-bold text-slate-800 block">{m.employeeName}</span>
                            <span className="text-[10px] text-primary-custom font-bold">{m.employeeId}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-800 block">{m.beneficiaryName}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-block ${
                              m.beneficiaryType === "Employee" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}>
                              {m.beneficiaryType} ({m.relationship})
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">
                            <span className="font-semibold text-slate-700 block max-w-[200px] truncate" title={m.medicalService}>
                              {m.medicalService}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{m.facilityName} • {m.expenseDate}</span>
                          </td>
                          <td className="p-3 text-right font-extrabold text-slate-900">
                            {m.amountETB.toLocaleString()} ETB
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Employee Family Allocation Overview Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" /> Family Allocation Summary
              </h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {employeeMedicalSummaries.map(s => {
                  const pct = Math.min(100, Math.round((s.familyExpenses / s.allocatedFamilyLimit) * 100));
                  return (
                    <div key={s.employeeId} className="p-3 bg-slate-50 border rounded-lg space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">{s.fullName}</span>
                        <span className="text-[10px] font-extrabold text-primary-custom">{s.employeeId}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                        <span>Utilized: <strong className="text-amber-700">{s.familyExpenses.toLocaleString()} ETB</strong></span>
                        <span>Remaining: <strong className="text-emerald-700">{s.remainingAllocation.toLocaleString()} ETB</strong></span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct > 90 ? "bg-rose-500" : pct > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.max(4, pct)}%` }}
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
      {/* SUBMENU 2: EXPENSE CLAIMS REGISTER */}
      {/* ========================================== */}
      {activeSubTab === "claims" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border rounded-xl p-4 shadow-2xs flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Employee, Beneficiary, Facility, Invoice #..."
                  value={claimSearchTerm}
                  onChange={(e) => setClaimSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs ring-primary-custom"
                />
              </div>

              <select
                value={claimBeneficiaryFilter}
                onChange={(e) => setClaimBeneficiaryFilter(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-xs bg-white font-semibold"
              >
                <option value="">All Beneficiary Types</option>
                <option value="Employee">Employee Only</option>
                <option value="Family Member">Family Member Only</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={handleOpenClaimAdd}
                className="px-3.5 py-1.5 bg-primary-custom text-white text-xs font-bold rounded-lg hover:opacity-95 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5 text-accent-custom" /> Record Expense Claim
              </button>
            </div>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Beneficiary</th>
                    <th className="px-4 py-3">Medical Service</th>
                    <th className="px-4 py-3">Facility / Hospital</th>
                    <th className="px-4 py-3">Invoice # &amp; Date</th>
                    <th className="px-4 py-3 text-right">Amount (ETB)</th>
                    <th className="px-4 py-3 text-center">Receipt</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medicalExpenses.filter(m => {
                    if (currentUser?.role === "Employee") {
                      const myEmp = employees.find(e => e.email.toLowerCase() === currentUser.email.toLowerCase());
                      const isMyRecord = (myEmp && m.employeeId === myEmp.employeeId) || 
                                         (currentUser.employeeId && m.employeeId === currentUser.employeeId) ||
                                         m.recordedBy === currentUser.email;
                      if (!isMyRecord) return false;
                    }
                    const matchSearch = 
                      m.employeeName.toLowerCase().includes(claimSearchTerm.toLowerCase()) ||
                      m.employeeId.toLowerCase().includes(claimSearchTerm.toLowerCase()) ||
                      m.beneficiaryName.toLowerCase().includes(claimSearchTerm.toLowerCase()) ||
                      m.facilityName.toLowerCase().includes(claimSearchTerm.toLowerCase()) ||
                      m.invoiceNumber.toLowerCase().includes(claimSearchTerm.toLowerCase());
                    const matchBen = claimBeneficiaryFilter ? m.beneficiaryType === claimBeneficiaryFilter : true;
                    return matchSearch && matchBen;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                        No medical expense claims match the current filters.
                      </td>
                    </tr>
                  ) : (
                    medicalExpenses.filter(m => {
                      if (currentUser?.role === "Employee") {
                        const myEmp = employees.find(e => e.email.toLowerCase() === currentUser.email.toLowerCase());
                        const isMyRecord = (myEmp && m.employeeId === myEmp.employeeId) || 
                                           (currentUser.employeeId && m.employeeId === currentUser.employeeId) ||
                                           m.recordedBy === currentUser.email;
                        if (!isMyRecord) return false;
                      }
                      const matchSearch = 
                        m.employeeName.toLowerCase().includes(claimSearchTerm.toLowerCase()) ||
                        m.employeeId.toLowerCase().includes(claimSearchTerm.toLowerCase()) ||
                        m.beneficiaryName.toLowerCase().includes(claimSearchTerm.toLowerCase()) ||
                        m.facilityName.toLowerCase().includes(claimSearchTerm.toLowerCase()) ||
                        m.invoiceNumber.toLowerCase().includes(claimSearchTerm.toLowerCase());
                      const matchBen = claimBeneficiaryFilter ? m.beneficiaryType === claimBeneficiaryFilter : true;
                      return matchSearch && matchBen;
                    }).map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-800 block">{m.employeeName}</span>
                          <span className="text-[10px] font-bold text-primary-custom">{m.employeeId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800 block">{m.beneficiaryName}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-block ${
                            m.beneficiaryType === "Employee" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}>
                            {m.beneficiaryType} ({m.relationship})
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700 max-w-[180px] truncate" title={m.medicalService}>
                          {m.medicalService}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{m.facilityName}</td>
                        <td className="px-4 py-3 text-slate-600">
                          <span className="font-bold text-slate-800 block">{m.invoiceNumber}</span>
                          <span className="text-[10px] text-slate-400">{m.expenseDate}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                          {m.amountETB.toLocaleString()} ETB
                        </td>
                        <td className="px-4 py-3 text-center">
                          {m.supportingDocumentUrl ? (
                            <a
                              href={m.supportingDocumentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-sky-600 hover:text-sky-800 inline-block"
                              title="View Supporting Receipt"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="text-slate-300 text-[10px]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                          {currentUser?.role !== "Auditor" ? (
                            <>
                              <button
                                onClick={() => handleOpenClaimEdit(m)}
                                className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded"
                                title="Edit Claim"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClaim(m)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="Delete Claim"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Read-Only</span>
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
      {/* SUBMENU 3: FAMILY MEMBERS REGISTRY */}
      {/* ========================================== */}
      {activeSubTab === "family" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border rounded-xl p-4 shadow-2xs flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Employee ID, Family Name..."
                  value={famSearchTerm}
                  onChange={(e) => setFamSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs ring-primary-custom"
                />
              </div>

              <select
                value={famRelFilter}
                onChange={(e) => setFamRelFilter(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-xs bg-white font-semibold"
              >
                <option value="">All Relationships</option>
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Parent">Parent</option>
                <option value="Dependent">Dependent</option>
                <option value="Other">Other</option>
              </select>

              <select
                value={famStatusFilter}
                onChange={(e) => setFamStatusFilter(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-xs bg-white font-semibold"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={() => handleOpenFamAdd()}
                className="px-3.5 py-1.5 bg-primary-custom text-white text-xs font-bold rounded-lg hover:opacity-95 flex items-center gap-1"
              >
                <UserPlus className="h-3.5 w-3.5 text-accent-custom" /> Register Family Member
              </button>
            </div>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Family Member Name</th>
                    <th className="px-4 py-3">Relationship</th>
                    <th className="px-4 py-3">Gender &amp; DOB</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3 text-center">Medical Eligibility</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right font-extrabold">Total Expenses (ETB)</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {familyMembers.filter(f => {
                    if (currentUser?.role === "Employee") {
                      const myEmp = employees.find(e => e.email.toLowerCase() === currentUser.email.toLowerCase());
                      const isMyRecord = (myEmp && f.employeeId === myEmp.employeeId) || 
                                         (currentUser.employeeId && f.employeeId === currentUser.employeeId);
                      if (!isMyRecord) return false;
                    }
                    const emp = employees.find(e => e.employeeId === f.employeeId);
                    const matchSearch = 
                      f.fullName.toLowerCase().includes(famSearchTerm.toLowerCase()) ||
                      f.employeeId.toLowerCase().includes(famSearchTerm.toLowerCase()) ||
                      (emp?.fullName || "").toLowerCase().includes(famSearchTerm.toLowerCase());
                    const matchRel = famRelFilter ? f.relationship === famRelFilter : true;
                    const matchStat = famStatusFilter ? f.status === famStatusFilter : true;
                    return matchSearch && matchRel && matchStat;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                        No family members registered match current search.
                      </td>
                    </tr>
                  ) : (
                    familyMembers.filter(f => {
                      if (currentUser?.role === "Employee") {
                        const myEmp = employees.find(e => e.email.toLowerCase() === currentUser.email.toLowerCase());
                        const isMyRecord = (myEmp && f.employeeId === myEmp.employeeId) || 
                                           (currentUser.employeeId && f.employeeId === currentUser.employeeId);
                        if (!isMyRecord) return false;
                      }
                      const emp = employees.find(e => e.employeeId === f.employeeId);
                      const matchSearch = 
                        f.fullName.toLowerCase().includes(famSearchTerm.toLowerCase()) ||
                        f.employeeId.toLowerCase().includes(famSearchTerm.toLowerCase()) ||
                        (emp?.fullName || "").toLowerCase().includes(famSearchTerm.toLowerCase());
                      const matchRel = famRelFilter ? f.relationship === famRelFilter : true;
                      const matchStat = famStatusFilter ? f.status === famStatusFilter : true;
                      return matchSearch && matchRel && matchStat;
                    }).map(f => {
                      const emp = employees.find(e => e.employeeId === f.employeeId);
                      const famExpenses = medicalExpenses
                        .filter(m => m.familyMemberId === f.id)
                        .reduce((sum, m) => sum + m.amountETB, 0);
                      return (
                        <tr key={f.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-800 block">{emp?.fullName || f.employeeId}</span>
                            <span className="text-[10px] font-bold text-primary-custom">{f.employeeId}</span>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-800">{f.fullName}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-bold rounded-full text-[10px]">
                              {f.relationship}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <span>{f.gender}</span> • <span className="font-semibold">{f.dob}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-medium">{f.phoneNumber || "-"}</td>
                          <td className="px-4 py-3 text-center">
                            {f.medicalEligibility ? (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px] border border-emerald-200">
                                Eligible
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-full text-[10px] border border-rose-200">
                                Ineligible
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              f.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                            }`}>
                              {f.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                            {famExpenses.toLocaleString()} ETB
                          </td>
                          <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                            {currentUser?.role !== "Auditor" ? (
                              <>
                                <button
                                  onClick={() => handleOpenFamEdit(f)}
                                  className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded"
                                  title="Edit Details"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleFamStatus(f)}
                                  className={`p-1 rounded ${f.status === "Active" ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"}`}
                                  title={f.status === "Active" ? "Deactivate" : "Activate"}
                                >
                                  <ShieldAlert className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete family member ${f.fullName}?`)) {
                                      onDeleteFamilyMember && onDeleteFamilyMember(f.id);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded"
                                  title="Delete Record"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
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
      {/* SUBMENU 4: POLICY CONFIGURATION (Admin & Auditor) */}
      {/* ========================================== */}
      {activeSubTab === "policy" && (currentUser?.role === "Administrator" || currentUser?.role === "Auditor") && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4 max-w-2xl">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-3">
              <Settings className="h-4 w-4 text-primary-custom" /> Medical Benefit Policy Configuration
            </h3>

            <form onSubmit={handleSavePolicySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Default Family Aggregate Medical Allocation (ETB) *
                </label>
                <input
                  type="number"
                  value={polDefaultAlloc}
                  onChange={(e) => setPolDefaultAlloc(Number(e.target.value))}
                  readOnly={currentUser?.role === "Auditor"}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold ring-primary-custom read-only:bg-slate-50"
                  required
                />
                <span className="text-[10px] text-slate-400 block font-medium">
                  This aggregate allocation applies per employee and is shared across all registered family dependents.
                </span>
              </div>

              <div className="p-3 bg-slate-50 border rounded-lg space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">Employee Tier: Unlimited Allocation</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Medical expenses incurred directly by employees are unlimited and do not reduce the family aggregate allocation pool.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={polReqInvoice}
                    disabled={currentUser?.role === "Auditor"}
                    onChange={(e) => setPolReqInvoice(e.target.checked)}
                  />
                  <span>Enforce Mandatory Invoice / Receipt Number for All Claims</span>
                </label>
              </div>

              <div className="flex justify-end pt-3 border-t">
                {currentUser?.role !== "Auditor" ? (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-custom text-white font-bold text-xs rounded-lg hover:opacity-95 flex items-center gap-1.5"
                  >
                    <Save className="h-4 w-4 text-accent-custom" /> Save Policy Configuration
                  </button>
                ) : (
                  <div className="w-full flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Read-Only Auditor Mode: Benefit policy settings are locked.</span>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SUBMENU 5: MEDICAL REPORTS */}
      {/* ========================================== */}
      {activeSubTab === "reports" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border rounded-xl p-4 shadow-2xs flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Medical Expense Compliance &amp; Audit Reports</h3>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={reportView}
                onChange={(e) => setReportView(e.target.value as any)}
                className="px-3 py-1.5 border rounded-lg text-xs bg-white font-bold text-slate-800"
              >
                <option value="summary">Employee Family Allocation Summary</option>
                <option value="claims">All Medical Expense Claims Log</option>
              </select>

              <button
                onClick={handleExportCSV}
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

          <div className="bg-white border rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              {reportView === "summary" && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase">
                      <th className="p-3">Employee ID</th>
                      <th className="p-3">Employee Name</th>
                      <th className="p-3">Department</th>
                      <th className="p-3 text-right">Emp Medical (ETB)</th>
                      <th className="p-3 text-right">Family Medical (ETB)</th>
                      <th className="p-3 text-right">Total Expenses (ETB)</th>
                      <th className="p-3 text-right">Configured Family Cap</th>
                      <th className="p-3 text-right bg-slate-100 font-extrabold">Remaining Family Pool</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employeeMedicalSummaries.map(s => {
                      const dObj = departments.find(d => d.id === s.departmentId);
                      return (
                        <tr key={s.employeeId} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-primary-custom">{s.employeeId}</td>
                          <td className="p-3 font-semibold text-slate-800">{s.fullName}</td>
                          <td className="p-3 text-slate-500 font-medium">{dObj?.name || "N/A"}</td>
                          <td className="p-3 text-right text-blue-700 font-bold">{s.empExpenses.toLocaleString()} ETB</td>
                          <td className="p-3 text-right text-amber-700 font-bold">{s.familyExpenses.toLocaleString()} ETB</td>
                          <td className="p-3 text-right font-extrabold text-slate-900">{s.totalExpenses.toLocaleString()} ETB</td>
                          <td className="p-3 text-right text-slate-600 font-semibold">{s.allocatedFamilyLimit.toLocaleString()} ETB</td>
                          <td className="p-3 text-right font-extrabold bg-slate-50 text-emerald-700">{s.remainingAllocation.toLocaleString()} ETB</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {reportView === "claims" && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase">
                      <th className="p-3">Claim ID</th>
                      <th className="p-3">Employee ID</th>
                      <th className="p-3">Beneficiary</th>
                      <th className="p-3">Medical Service</th>
                      <th className="p-3">Facility</th>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Amount (ETB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {medicalExpenses.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-primary-custom">{m.id}</td>
                        <td className="p-3 font-semibold text-slate-800">{m.employeeId}</td>
                        <td className="p-3 font-semibold text-slate-800">{m.beneficiaryName} ({m.relationship})</td>
                        <td className="p-3 text-slate-600">{m.medicalService}</td>
                        <td className="p-3 text-slate-600">{m.facilityName}</td>
                        <td className="p-3 font-bold text-slate-800">{m.invoiceNumber}</td>
                        <td className="p-3 text-slate-500">{m.expenseDate}</td>
                        <td className="p-3 text-right font-extrabold text-slate-900">{m.amountETB.toLocaleString()} ETB</td>
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
      {/* MODAL: EXPENSE CLAIM REGISTRATION */}
      {/* ========================================== */}
      {claimModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-primary-custom text-white px-5 py-3.5 border-b flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-wider">
                {selectedClaim ? "Edit Medical Expense Claim" : "Record Medical Expense Claim"}
              </h3>
              <button onClick={() => setClaimModalOpen(false)} className="text-white/80 hover:text-white rounded-full p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClaimSubmit} className="p-5 space-y-4">
              {claimError && (
                <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold">
                  {claimError}
                </div>
              )}
              {claimSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                  {claimSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Select Employee *</label>
                  <select
                    value={claimEmpId}
                    onChange={(e) => {
                      setClaimEmpId(e.target.value);
                      const fams = familyMembers.filter(f => f.employeeId === e.target.value && f.status === "Active");
                      setClaimFamilyMemberId(fams[0]?.id || "");
                    }}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold bg-white"
                    required
                  >
                    {activeEmployees.map(e => (
                      <option key={e.employeeId} value={e.employeeId}>{e.fullName} ({e.employeeId})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Beneficiary Type *</label>
                  <select
                    value={claimBenType}
                    onChange={(e) => setClaimBenType(e.target.value as any)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold bg-white"
                    required
                  >
                    <option value="Family Member">Family Member</option>
                    <option value="Employee">Employee (Self)</option>
                  </select>
                </div>
              </div>

              {claimBenType === "Family Member" && (
                <div className="space-y-1 bg-slate-50 p-3 rounded-lg border">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Family Beneficiary *</label>
                  {availableFamilyMembers.length === 0 ? (
                    <div className="text-xs text-rose-600 font-semibold flex items-center justify-between">
                      <span>No eligible active family members registered for this employee.</span>
                      <button
                        type="button"
                        onClick={() => {
                          setClaimModalOpen(false);
                          handleOpenFamAdd(claimEmpId);
                        }}
                        className="underline text-sky-600 text-[11px]"
                      >
                        Register Member
                      </button>
                    </div>
                  ) : (
                    <select
                      value={claimFamilyMemberId}
                      onChange={(e) => setClaimFamilyMemberId(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold bg-white"
                      required
                    >
                      {availableFamilyMembers.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.fullName} ({f.relationship} • DOB: {f.dob})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Allocation Preview Widget */}
              {claimBenType === "Family Member" && claimEmpId && (
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-xs flex justify-between items-center text-amber-900 font-medium">
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-amber-700">Family Allocation Pool</span>
                    <span className="font-extrabold">{selectedEmpFamilyAllocationState.allocated.toLocaleString()} ETB</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] uppercase font-bold text-amber-700">Remaining Available</span>
                    <span className="font-extrabold text-emerald-800 text-sm">{selectedEmpFamilyAllocationState.remaining.toLocaleString()} ETB</span>
                  </div>
                </div>
              )}

              {claimBenType === "Employee" && (
                <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg text-xs text-blue-900 font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Employee tier: Covered under <strong>Unlimited Medical Allocation Policy</strong>.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="block text-xs font-bold text-slate-700">Medical Service / Treatment Description *</label>
                  <input
                    type="text"
                    value={claimService}
                    onChange={(e) => setClaimService(e.target.value)}
                    placeholder="e.g. Outpatient Consultation, Prescriptions, Dental..."
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Hospital / Clinic Name *</label>
                  <input
                    type="text"
                    value={claimFacility}
                    onChange={(e) => setClaimFacility(e.target.value)}
                    placeholder="e.g. Nordic Medical Centre"
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Expense Date *</label>
                  <input
                    type="date"
                    value={claimDate}
                    onChange={(e) => setClaimDate(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Invoice / Receipt Number *</label>
                  <input
                    type="text"
                    value={claimInvoiceNo}
                    onChange={(e) => setClaimInvoiceNo(e.target.value)}
                    placeholder="e.g. INV-99012"
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold"
                    required={medicalPolicy.requiresInvoiceNumber}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Expense Amount (ETB) *</label>
                  <input
                    type="number"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-extrabold text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Overdraft Admin Bypass Option */}
              {claimBenType === "Family Member" && Number(claimAmount) > selectedEmpFamilyAllocationState.remaining && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    Claim amount exceeds remaining family allocation of {selectedEmpFamilyAllocationState.remaining.toLocaleString()} ETB.
                  </p>
                  {currentUser?.role === "Administrator" ? (
                    <label className="flex items-center gap-2 mt-2 cursor-pointer border-t pt-2 border-amber-200">
                      <input
                        type="checkbox"
                        checked={claimAdminBypass}
                        onChange={(e) => setClaimAdminBypass(e.target.checked)}
                      />
                      <span className="font-bold text-slate-800">Bypass Allocation Limit (Admin Override Exemption)</span>
                    </label>
                  ) : (
                    <p className="text-[10px] text-slate-500 font-semibold">
                      * Only Administrators can authorize claims exceeding the remaining family allocation pool.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Supporting Invoice / Receipt URL (Optional)</label>
                <input
                  type="url"
                  value={claimDocUrl}
                  onChange={(e) => setClaimDocUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-1.5 border rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setClaimModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-extrabold text-white bg-primary-custom hover:opacity-95 rounded-lg flex items-center gap-1"
                >
                  <Save className="h-4 w-4 text-accent-custom" /> Save Claim Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: FAMILY MEMBER REGISTRATION */}
      {/* ========================================== */}
      {famModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-primary-custom text-white px-5 py-3.5 border-b flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-wider">
                {selectedFam ? "Edit Family Member Record" : "Register Family Member"}
              </h3>
              <button onClick={() => setFamModalOpen(false)} className="text-white/80 hover:text-white rounded-full p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFamSubmit} className="p-5 space-y-4">
              {famError && (
                <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold">
                  {famError}
                </div>
              )}
              {famSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                  {famSuccess}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Link to Employee *</label>
                <select
                  value={famEmpId}
                  onChange={(e) => setFamEmpId(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold bg-white"
                  required
                >
                  {activeEmployees.map(e => (
                    <option key={e.employeeId} value={e.employeeId}>{e.fullName} ({e.employeeId})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Family Member Full Name *</label>
                <input
                  type="text"
                  value={famFullName}
                  onChange={(e) => setFamFullName(e.target.value)}
                  placeholder="Full name of dependent/family member"
                  className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Relationship *</label>
                  <select
                    value={famRelationship}
                    onChange={(e) => setFamRelationship(e.target.value as any)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold bg-white"
                    required
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Dependent">Dependent</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Gender *</label>
                  <select
                    value={famGender}
                    onChange={(e) => setFamGender(e.target.value as any)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold bg-white"
                    required
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Date of Birth *</label>
                  <input
                    type="date"
                    value={famDob}
                    onChange={(e) => setFamDob(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={famPhone}
                    onChange={(e) => setFamPhone(e.target.value)}
                    placeholder="+251-9..."
                    className="w-full px-3 py-1.5 border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={famEligibility}
                    onChange={(e) => setFamEligibility(e.target.checked)}
                  />
                  <span>Medical Benefit Eligible</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Status:</span>
                  <select
                    value={famStatus}
                    onChange={(e) => setFamStatus(e.target.value as any)}
                    className="px-2 py-1 border rounded text-xs font-bold bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setFamModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-extrabold text-white bg-primary-custom hover:opacity-95 rounded-lg flex items-center gap-1"
                >
                  <Save className="h-4 w-4 text-accent-custom" /> Save Member Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
