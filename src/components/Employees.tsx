import React, { useState } from "react";
import { Employee, Department, User, FamilyMember } from "../types";
import { 
  Plus, Search, SlidersHorizontal, Eye, Edit, UserX, UserCheck, 
  X, Save, FileSpreadsheet, Printer, Download, EyeOff, FileText, ExternalLink, Heart,
  Upload, CheckCircle2, AlertCircle, FileUp, RefreshCw
} from "lucide-react";

interface ParsedImportRow {
  rowIndex: number;
  raw: Record<string, string>;
  employeeObj?: Employee;
  isValid: boolean;
  errors: string[];
}

function parseCSVText(text: string): string[][] {
  const lines: string[][] = [];
  const rawLines = text.split(/\r\n|\n|\r/);
  for (let rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const row: string[] = [];
    let insideQuote = false;
    let entry = "";
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim().replace(/^"|"$/g, ''));
        entry = "";
      } else {
        entry += char;
      }
    }
    row.push(entry.trim().replace(/^"|"$/g, ''));
    lines.push(row);
  }
  return lines;
}

interface EmployeesProps {
  employees: Employee[];
  departments: Department[];
  familyMembers?: FamilyMember[];
  currentUser: User | null;
  onAddEmployee: (emp: Employee) => boolean;
  onUpdateEmployee: (emp: Employee) => void;
  onAddFamilyMember?: (fm: FamilyMember) => boolean;
  onLogAction: (module: string, action: string, record: string, details: string) => void;
}

export default function Employees({
  employees,
  departments,
  familyMembers = [],
  currentUser,
  onAddEmployee,
  onUpdateEmployee,
  onAddFamilyMember,
  onLogAction
}: EmployeesProps) {
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("Active"); // Default to Active

  // CSV Import States
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importSummaryOpen, setImportSummaryOpen] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [importRows, setImportRows] = useState<ParsedImportRow[]>([]);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState(0);
  const [importFailCount, setImportFailCount] = useState(0);
  const [importDuplicateCount, setImportDuplicateCount] = useState(0);

  // Dialog States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Drive File Associations State
  const [driveAssocs, setDriveAssocs] = useState<any[]>([]);
  React.useEffect(() => {
    if (detailModalOpen && selectedEmployee) {
      const saved = localStorage.getItem("drive_associations");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const filtered = parsed.filter((a: any) => a.targetType === "Employee" && a.targetId === selectedEmployee.employeeId);
          setDriveAssocs(filtered);
        } catch (err) {
          console.error(err);
        }
      }
    } else {
      setDriveAssocs([]);
    }
  }, [detailModalOpen, selectedEmployee]);

  // Form States
  const [employeeId, setEmployeeId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [altPhoneNumber, setAltPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [position, setPosition] = useState("");
  const [employmentType, setEmploymentType] = useState<"Permanent" | "Contract" | "Temporary" | "Intern">("Permanent");
  const [hireDate, setHireDate] = useState("");
  const [empStatus, setEmpStatus] = useState<"Active" | "Inactive">("Active");
  const [category, setCategory] = useState("");

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Get only active departments for enrollment dropdown
  const activeDepartments = departments.filter(d => d.status === "Active");

  // Filtered List
  const filteredEmployees = employees.filter(emp => {
    const matchSearch = 
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchDept = filterDepartment ? emp.departmentId === filterDepartment : true;
    const matchType = filterType ? emp.employmentType === filterType : true;
    const matchStatus = filterStatus ? emp.status === filterStatus : true;

    return matchSearch && matchDept && matchType && matchStatus;
  });

  const resetForm = () => {
    setEmployeeId("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setGender("Male");
    setDob("");
    setEmail("");
    setPhoneNumber("");
    setAltPhoneNumber("");
    setAddress("");
    setDepartmentId(activeDepartments[0]?.id || "");
    setPosition("");
    setEmploymentType("Permanent");
    setHireDate(new Date().toISOString().split("T")[0]);
    setEmpStatus("Active");
    setCategory("");
    setFormError("");
    setFormSuccess("");
  };

  const handleOpenAdd = () => {
    resetForm();
    // Auto-generate employee ID
    const nextId = employees.length + 1;
    const paddedId = `EMP${nextId.toString().padStart(3, "0")}`;
    setEmployeeId(paddedId);
    setAddModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEmployeeId(emp.employeeId);
    setFirstName(emp.firstName);
    setMiddleName(emp.middleName);
    setLastName(emp.lastName);
    setGender(emp.gender);
    setDob(emp.dob);
    setEmail(emp.email);
    setPhoneNumber(emp.phoneNumber);
    setAltPhoneNumber(emp.altPhoneNumber || "");
    setAddress(emp.address);
    setDepartmentId(emp.departmentId);
    setPosition(emp.position);
    setEmploymentType(emp.employmentType);
    setHireDate(emp.hireDate);
    setEmpStatus(emp.status);
    setCategory(emp.category || "");
    setFormError("");
    setFormSuccess("");
    setEditModalOpen(true);
  };

  const handleOpenView = (emp: Employee) => {
    setSelectedEmployee(emp);
    setDetailModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!employeeId.trim() || !firstName.trim() || !lastName.trim() || !departmentId) {
      setFormError("Employee ID, First/Last Name, and Department are required.");
      return;
    }

    // Verify uniqueness of ID
    const isIdDuplicate = employees.some(emp => emp.employeeId.toUpperCase() === employeeId.trim().toUpperCase());
    if (isIdDuplicate) {
      setFormError(`Employee ID '${employeeId}' is already registered. Please provide a unique ID.`);
      return;
    }

    const newEmp: Employee = {
      employeeId: employeeId.trim().toUpperCase(),
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      fullName: `${firstName.trim()} ${middleName.trim() ? middleName.trim() + " " : ""}${lastName.trim()}`,
      gender,
      dob,
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      altPhoneNumber: altPhoneNumber.trim(),
      address: address.trim(),
      departmentId,
      position: position.trim(),
      employmentType,
      hireDate,
      status: empStatus,
      category: category.trim(),
      createdDate: new Date().toISOString().replace("T", " ").substring(0, 19),
      createdBy: currentUser?.email || "hr@ethio-re.com",
      updatedDate: new Date().toISOString().replace("T", " ").substring(0, 19),
      updatedBy: currentUser?.email || "hr@ethio-re.com"
    };

    const success = onAddEmployee(newEmp);
    if (success) {
      setFormSuccess("Employee registered successfully!");
      onLogAction(
        "Employee",
        "Employee Created",
        newEmp.employeeId,
        `Enrolled employee ${newEmp.fullName} in ${newEmp.departmentId}`
      );
      setTimeout(() => {
        setAddModalOpen(false);
        resetForm();
      }, 1000);
    } else {
      setFormError("Could not enroll employee. Make sure the database constraints are satisfied.");
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!firstName.trim() || !lastName.trim() || !departmentId) {
      setFormError("First Name, Last Name, and Department are required.");
      return;
    }

    if (!selectedEmployee) return;

    const updatedEmp: Employee = {
      ...selectedEmployee,
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      fullName: `${firstName.trim()} ${middleName.trim() ? middleName.trim() + " " : ""}${lastName.trim()}`,
      gender,
      dob,
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      altPhoneNumber: altPhoneNumber.trim(),
      address: address.trim(),
      departmentId,
      position: position.trim(),
      employmentType,
      hireDate,
      status: empStatus,
      category: category.trim(),
      updatedDate: new Date().toISOString().replace("T", " ").substring(0, 19),
      updatedBy: currentUser?.email || "hr@ethio-re.com"
    };

    onUpdateEmployee(updatedEmp);
    setFormSuccess("Employee folder updated successfully!");
    onLogAction(
      "Employee",
      "Employee Updated",
      updatedEmp.employeeId,
      `Updated employee parameters for ${updatedEmp.fullName}`
    );
    setTimeout(() => {
      setEditModalOpen(false);
    }, 1000);
  };

  const handleToggleStatus = (emp: Employee) => {
    const nextStatus: "Active" | "Inactive" = emp.status === "Active" ? "Inactive" : "Active";
    const updated = {
      ...emp,
      status: nextStatus,
      updatedDate: new Date().toISOString().replace("T", " ").substring(0, 19),
      updatedBy: currentUser?.email || "hr@ethio-re.com"
    };
    onUpdateEmployee(updated);
    onLogAction(
      "Employee",
      nextStatus === "Active" ? "Employee Activated" : "Employee Deactivated",
      emp.employeeId,
      `Toggled status of ${emp.fullName} to ${nextStatus}`
    );
  };

  // Download CSV Import Template
  const handleDownloadTemplate = () => {
    const headers = [
      "EmployeeID", "FirstName", "MiddleName", "LastName", "Gender",
      "DateOfBirth", "EmploymentDate", "Email", "PhoneNumber",
      "DepartmentCode", "JobTitle", "EmploymentType", "EmploymentStatus", "BasicSalary"
    ].join(",");
    
    const sampleComment = "# ETHIO-RE HRMS EMPLOYEE BULK IMPORT TEMPLATE\r\n# WARNING: Please delete this sample row (EMP999) before uploading actual employee records!";
    const sampleRow = [
      "EMP999", "Abebe", "Kebede", "Tessema", "Male",
      "1992-04-15", "2026-01-01", "abebe.kebede@ethiopianre.com", "+251-911-000000",
      "HRAD", "Senior Underwriter", "Permanent", "Active", "25000"
    ].join(",");

    const csvContent = `${sampleComment}\r\n${headers}\r\n${sampleRow}\r\n`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ethiore_employee_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Upload and Parse CSV File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsProcessingImport(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) {
        setIsProcessingImport(false);
        return;
      }

      const lines = parseCSVText(text);
      if (lines.length < 2) {
        alert("Uploaded CSV file is empty or missing valid headers.");
        setIsProcessingImport(false);
        return;
      }

      const header = lines[0].map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
      const dataLines = lines.slice(1);

      const parsed: ParsedImportRow[] = [];
      const seenEmpIdsInCsv = new Set<string>();
      let dupCount = 0;

      dataLines.forEach((row, idx) => {
        if (row.length === 0 || (row.length === 1 && !row[0].trim())) return;

        const raw: Record<string, string> = {};
        header.forEach((hName, colIdx) => {
          raw[hName] = row[colIdx] ? row[colIdx].trim() : "";
        });

        // Extract key fields with fallback aliases
        const empId = (raw["employeeid"] || raw["id"] || raw["empid"] || "").toUpperCase();
        const fName = raw["firstname"] || raw["first"] || raw["name"] || "";
        const mName = raw["middlename"] || raw["middle"] || "";
        const lName = raw["lastname"] || raw["last"] || "";
        const gInput = (raw["gender"] || "Male").trim();
        const dobInput = raw["dateofbirth"] || raw["dob"] || raw["birthdate"] || "1990-01-01";
        const hireInput = raw["employmentdate"] || raw["hiredate"] || raw["employmentdate"] || new Date().toISOString().split("T")[0];
        const emailInput = raw["email"] || raw["workemail"] || "";
        const phoneInput = raw["phonenumber"] || raw["phone"] || raw["contact"] || "+251-900-000000";
        const deptCodeInput = (raw["departmentcode"] || raw["department"] || raw["deptcode"] || "").toUpperCase();
        const positionInput = raw["jobtitle"] || raw["position"] || raw["title"] || "Staff Officer";
        const empTypeInput = raw["employmenttype"] || raw["type"] || "Permanent";
        const empStatusInput = raw["employmentstatus"] || raw["status"] || "Active";
        const salaryInput = raw["basicsalary"] || raw["salary"] || "";

        const rowErrors: string[] = [];

        // 1. Mandatory Employee ID
        if (!empId) {
          rowErrors.push("EmployeeID is mandatory and missing.");
        } else {
          // Check for sample placeholder record
          if (empId === "EMP999") {
            rowErrors.push("Sample placeholder row (EMP999) must be removed before actual import.");
          }
          // Uniqueness check within CSV
          if (seenEmpIdsInCsv.has(empId)) {
            rowErrors.push(`Duplicate EmployeeID '${empId}' within uploaded CSV file.`);
            dupCount++;
          } else {
            seenEmpIdsInCsv.add(empId);
          }

          // Uniqueness check against existing system records
          const existsInSystem = employees.some(e => e.employeeId.toUpperCase() === empId);
          if (existsInSystem) {
            rowErrors.push(`EmployeeID '${empId}' is already registered in existing Employee Master.`);
            dupCount++;
          }
        }

        // 2. Mandatory Names
        if (!fName) rowErrors.push("FirstName is required.");
        if (!lName) rowErrors.push("LastName is required.");

        // 3. Department Code validation
        let matchedDeptId = "";
        if (!deptCodeInput) {
          rowErrors.push("DepartmentCode is required.");
        } else {
          const matchedDept = departments.find(d => 
            d.code.toUpperCase() === deptCodeInput || d.id.toUpperCase() === deptCodeInput
          );
          if (matchedDept) {
            matchedDeptId = matchedDept.id;
          } else {
            rowErrors.push(`DepartmentCode '${deptCodeInput}' does not exist in Department Admin.`);
          }
        }

        // 4. Gender Validation
        let genderVal: "Male" | "Female" = "Male";
        if (gInput.toLowerCase().startsWith("f")) {
          genderVal = "Female";
        } else if (gInput.toLowerCase().startsWith("m")) {
          genderVal = "Male";
        } else {
          rowErrors.push(`Invalid Gender '${gInput}'. Must be Male or Female.`);
        }

        // 5. Employment Type Validation
        let typeVal: "Permanent" | "Contract" | "Temporary" | "Intern" = "Permanent";
        const typeNorm = empTypeInput.toLowerCase();
        if (typeNorm.includes("perm")) typeVal = "Permanent";
        else if (typeNorm.includes("cont")) typeVal = "Contract";
        else if (typeNorm.includes("temp")) typeVal = "Temporary";
        else if (typeNorm.includes("intern")) typeVal = "Intern";
        else {
          rowErrors.push(`Invalid EmploymentType '${empTypeInput}'. Must be Permanent, Contract, Temporary, or Intern.`);
        }

        // 6. Status Validation
        let statusVal: "Active" | "Inactive" = "Active";
        if (empStatusInput.toLowerCase().startsWith("in")) {
          statusVal = "Inactive";
        }

        // 7. Salary Numeric Validation
        if (salaryInput && isNaN(Number(salaryInput))) {
          rowErrors.push(`BasicSalary '${salaryInput}' must be numeric.`);
        }

        const fullNameVal = `${fName} ${mName ? mName + " " : ""}${lName}`.trim();
        const isValid = rowErrors.length === 0;

        let employeeObj: Employee | undefined = undefined;
        if (isValid) {
          employeeObj = {
            employeeId: empId,
            firstName: fName,
            middleName: mName,
            lastName: lName,
            fullName: fullNameVal,
            gender: genderVal,
            dob: dobInput,
            email: emailInput,
            phoneNumber: phoneInput,
            address: "Addis Ababa, Ethiopia",
            departmentId: matchedDeptId,
            position: positionInput,
            employmentType: typeVal,
            hireDate: hireInput,
            status: statusVal,
            category: salaryInput ? `Salary: ETB ${Number(salaryInput).toLocaleString()}` : "",
            createdDate: new Date().toISOString().replace("T", " ").substring(0, 19),
            createdBy: currentUser?.email || "hr@ethio-re.com",
            updatedDate: new Date().toISOString().replace("T", " ").substring(0, 19),
            updatedBy: currentUser?.email || "hr@ethio-re.com"
          };
        }

        parsed.push({
          rowIndex: idx + 2,
          raw: {
            empId, fName, mName, lName, gender: genderVal, dobInput, hireInput,
            emailInput, phoneInput, deptCodeInput, positionInput, empTypeInput, empStatusInput, salaryInput
          },
          employeeObj,
          isValid,
          errors: rowErrors
        });
      });

      setImportRows(parsed);
      setImportDuplicateCount(dupCount);
      setIsProcessingImport(false);
    };
    reader.readAsText(file);
  };

  // Download Rejected / Error CSV Log
  const handleDownloadRejectedCSV = () => {
    const rejectedRows = importRows.filter(r => !r.isValid);
    if (rejectedRows.length === 0) {
      alert("No rejected records found.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,RowNumber,EmployeeID,FirstName,LastName,DepartmentCode,ValidationErrors\r\n";
    rejectedRows.forEach(r => {
      const errs = r.errors.join("; ").replace(/"/g, '""');
      csvContent += `"${r.rowIndex}","${r.raw.empId || ""}","${r.raw.fName || ""}","${r.raw.lName || ""}","${r.raw.deptCodeInput || ""}","${errs}"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ethiore_rejected_import_records.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Execute Bulk Import for Valid Records
  const handleExecuteImport = () => {
    const validRows = importRows.filter(r => r.isValid && r.employeeObj);
    if (validRows.length === 0) {
      alert("No valid employee records to import.");
      return;
    }

    let success = 0;
    let fail = 0;

    validRows.forEach(r => {
      if (r.employeeObj) {
        const ok = onAddEmployee(r.employeeObj);
        if (ok) {
          success++;
        } else {
          fail++;
        }
      }
    });

    onLogAction(
      "Employee",
      "Bulk Employee CSV Import",
      `${success} Records`,
      `Operator ${currentUser?.email} executed bulk CSV import. Successfully imported ${success} employees, ${fail} failed.`
    );

    setImportSuccessCount(success);
    setImportFailCount(fail + (importRows.length - validRows.length));
    setImportModalOpen(false);
    setImportSummaryOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Employee ID,Full Name,Gender,Department,Position,Employment Type,Status,Email,Phone,Hire Date\r\n";
    
    filteredEmployees.forEach(e => {
      const deptName = departments.find(d => d.id === e.departmentId)?.name || e.departmentId;
      csvContent += `"${e.employeeId}","${e.fullName}","${e.gender}","${deptName}","${e.position}","${e.employmentType}","${e.status}","${e.email}","${e.phoneNumber}","${e.hireDate}"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ethiore_employees_${filterStatus || "all"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Employee Directory</h2>
          <p className="text-xs text-slate-500 mt-1">Manage, search, and register operational personnel folders.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setImportRows([]);
              setSelectedFileName("");
              setImportModalOpen(true);
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            id="btn-import-employees-trigger"
          >
            <Upload className="h-4 w-4" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-all"
            id="btn-export-employees"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-all"
            id="btn-print-employees"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            <span>Print List</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex-2 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 bg-primary-custom hover:opacity-95 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            id="btn-add-employee-trigger"
          >
            <Plus className="h-4 w-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border rounded-lg p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Employee ID, Name, Job Title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-xs ring-primary-custom"
            />
          </div>
          
          {/* Department Filter */}
          <div className="w-full md:w-48">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="w-full md:w-40">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom"
            >
              <option value="">All Types</option>
              <option value="Permanent">Permanent</option>
              <option value="Contract">Contract</option>
              <option value="Temporary">Temporary</option>
              <option value="Intern">Intern</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-40">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom font-bold"
            >
              <option value="Active">Active Folders</option>
              <option value="Inactive">Inactive/Archived</option>
              <option value="">All Employee folders</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white border rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3">Employee ID</th>
                <th className="px-6 py-3">Full Name</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Job Title / Position</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                    No employees matching filter requirements found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => {
                  const dept = departments.find(d => d.id === emp.departmentId);
                  return (
                    <tr key={emp.employeeId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-primary-custom">{emp.employeeId}</td>
                      <td className="px-6 py-3.5 font-semibold text-slate-800">{emp.fullName}</td>
                      <td className="px-6 py-3.5 text-slate-600 font-medium">{dept ? dept.name : emp.departmentId}</td>
                      <td className="px-6 py-3.5 text-slate-600 font-medium">{emp.position}</td>
                      <td className="px-6 py-3.5">
                        <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                          {emp.employmentType}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 font-medium">{emp.phoneNumber}</td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.status === "Active" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenView(emp)}
                          className="p-1 text-slate-400 hover:text-primary-custom hover:bg-slate-100 rounded-md transition-colors inline-block"
                          title="View Personnel Folder"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-md transition-colors inline-block"
                          title="Edit Folder"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(emp)}
                          className={`p-1 rounded-md transition-colors inline-block ${
                            emp.status === "Active" 
                              ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50" 
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={emp.status === "Active" ? "Deactivate Employee" : "Reactivate Employee"}
                        >
                          {emp.status === "Active" ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EMPLOYEE MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-primary-custom text-white px-6 py-4 flex items-center justify-between border-b">
              <h3 className="font-extrabold text-sm tracking-wide uppercase">Enroll New Employee Folder</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-white/80 hover:text-white rounded-full p-1 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-6">
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

              {/* Grid 1: Basic Identifiers */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b pb-1">1. Basic Identification</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Employee ID *</label>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-bold ring-primary-custom"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Gender *</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as "Male" | "Female")}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom"
                      required
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Date of Birth *</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">First Name *</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Middle Name</label>
                    <input
                      type="text"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Last Name *</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Grid 2: Contact Info */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b pb-1">2. Contact Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Work Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Phone Number *</label>
                    <input
                      type="text"
                      placeholder="+251-9..."
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Alternative Phone</label>
                    <input
                      type="text"
                      value={altPhoneNumber}
                      onChange={(e) => setAltPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Residential Address *</label>
                  <input
                    type="text"
                    placeholder="Woreda, House No, Area Name..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                    required
                  />
                </div>
              </div>

              {/* Grid 3: Assignment & Contract */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b pb-1">3. Employment &amp; Structural Placement</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Department Placement *</label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom font-bold"
                      required
                    >
                      {activeDepartments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Job Title / Position *</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Underwriter"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Employment Type *</label>
                    <select
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom font-semibold"
                      required
                    >
                      <option value="Permanent">Permanent</option>
                      <option value="Contract">Contract</option>
                      <option value="Temporary">Temporary</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Hire Date *</label>
                    <input
                      type="date"
                      value={hireDate}
                      onChange={(e) => setHireDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Employee Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Executive, Officer"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-extrabold text-white bg-primary-custom hover:opacity-90 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Save className="h-4 w-4 text-accent-custom" />
                  Save Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-primary-custom text-white px-6 py-4 flex items-center justify-between border-b">
              <h3 className="font-extrabold text-sm tracking-wide uppercase">Edit Employee Folder: {employeeId}</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-white/80 hover:text-white rounded-full p-1 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
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

              {/* Section 1 */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b pb-1">1. Identity &amp; Bio</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Gender *</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as "Male" | "Female")}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom"
                      required
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Date of Birth *</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">First Name *</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Middle Name</label>
                    <input
                      type="text"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Last Name *</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b pb-1">2. Contacts</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Work Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Phone Number *</label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Alternative Phone</label>
                    <input
                      type="text"
                      value={altPhoneNumber}
                      onChange={(e) => setAltPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Residential Address *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                    required
                  />
                </div>
              </div>

              {/* Section 3 */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b pb-1">3. Placement &amp; Lifecycle</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Department Assignment *</label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom font-bold"
                      required
                    >
                      {activeDepartments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Job Title / Position *</label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Employment Type *</label>
                    <select
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom font-semibold"
                      required
                    >
                      <option value="Permanent">Permanent</option>
                      <option value="Contract">Contract</option>
                      <option value="Temporary">Temporary</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Hire Date *</label>
                    <input
                      type="date"
                      value={hireDate}
                      onChange={(e) => setHireDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Employment Status</label>
                    <select
                      value={empStatus}
                      onChange={(e) => setEmpStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom font-bold"
                    >
                      <option value="Active">Active Folder</option>
                      <option value="Inactive">Inactive Folder</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-extrabold text-white bg-primary-custom hover:opacity-90 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Save className="h-4 w-4 text-accent-custom" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PERSONNEL FOLDER MODAL */}
      {detailModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header banner */}
            <div className="bg-primary-custom text-white px-6 py-5 border-b flex justify-between items-start">
              <div>
                <span className="inline-block text-[9px] font-bold bg-accent-custom text-slate-900 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
                  {selectedEmployee.employeeId}
                </span>
                <h3 className="font-extrabold text-base tracking-tight leading-none text-white">{selectedEmployee.fullName}</h3>
                <p className="text-xs text-slate-300 mt-1 font-semibold uppercase">{selectedEmployee.position}</p>
              </div>
              <button 
                onClick={() => setDetailModalOpen(false)} 
                className="text-white/80 hover:text-white rounded-full p-1.5 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Profile body details */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Side 1: General Info */}
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Biological Info</p>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                      <div>
                        <span className="text-slate-400 block">Gender</span>
                        <span className="font-bold text-slate-800">{selectedEmployee.gender}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Date of Birth</span>
                        <span className="font-bold text-slate-800">{selectedEmployee.dob}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact Files</p>
                    <div className="space-y-2 mt-2 text-xs">
                      <div>
                        <span className="text-slate-400 block">Email Address</span>
                        <span className="font-bold text-slate-800">{selectedEmployee.email || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Phone Numbers</span>
                        <span className="font-bold text-slate-800">{selectedEmployee.phoneNumber}</span>
                        {selectedEmployee.altPhoneNumber && (
                          <span className="text-slate-500 font-medium block">Alt: {selectedEmployee.altPhoneNumber}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-400 block">Address Coordinates</span>
                        <span className="font-bold text-slate-800">{selectedEmployee.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side 2: Corporate details */}
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Employment Details</p>
                    <div className="space-y-2 mt-2 text-xs">
                      <div>
                        <span className="text-slate-400 block">Department</span>
                        <span className="font-bold text-slate-800 text-sm">
                          {departments.find(d => d.id === selectedEmployee.departmentId)?.name || selectedEmployee.departmentId}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Contract Type</span>
                        <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block">
                          {selectedEmployee.employmentType}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Date of Hiring</span>
                        <span className="font-bold text-slate-800">{selectedEmployee.hireDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Status</span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                          selectedEmployee.status === "Active" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {selectedEmployee.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Internal Audit Footprint</p>
                    <div className="grid grid-cols-2 gap-3 mt-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Created By</span>
                        <span className="font-semibold text-slate-600 truncate block">{selectedEmployee.createdBy}</span>
                        <span className="text-[10px] text-slate-400 block font-medium">{selectedEmployee.createdDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Last Updated By</span>
                        <span className="font-semibold text-slate-600 truncate block">{selectedEmployee.updatedBy}</span>
                        <span className="text-[10px] text-slate-400 block font-medium">{selectedEmployee.updatedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Registered Family Members & Medical Benefits */}
                  <div className="pt-4 border-t border-slate-100 col-span-2">
                    {(() => {
                      const empFms = familyMembers.filter(fm => fm.employeeId === selectedEmployee.employeeId);
                      return (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                              <Heart className="h-3 w-3 text-rose-500" />
                              <span>Registered Family Members &amp; Medical Dependents ({empFms.length})</span>
                            </p>
                          </div>
                          {empFms.length === 0 ? (
                            <p className="text-[11px] text-slate-400 font-medium italic">No family members registered under this employee's medical pool.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {empFms.map(fm => (
                                <div key={fm.id} className="p-2 bg-slate-50 border border-slate-200/70 rounded-lg flex items-center justify-between text-xs">
                                  <div>
                                    <span className="font-bold text-slate-800">{fm.fullName}</span>
                                    <span className="ml-2 text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">{fm.relationship}</span>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                      {fm.gender} • DOB: {fm.dob} {fm.phoneNumber ? `• Phone: ${fm.phoneNumber}` : ""}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                      fm.medicalEligibility ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                                    }`}>
                                      {fm.medicalEligibility ? "Eligible" : "Ineligible"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Google Drive Attachments Integration */}
                  <div className="pt-4 border-t border-slate-100 col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Google Drive Linked Documents ({driveAssocs.length})</p>
                    {driveAssocs.length === 0 ? (
                      <p className="text-[11px] text-slate-400 mt-1 font-medium italic">No personnel files or contracts linked yet from Google Drive.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {driveAssocs.map((assoc) => (
                          <div key={assoc.id} className="p-2 bg-slate-50 border border-slate-200/60 rounded-lg flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-4 w-4 text-sky-500 shrink-0" />
                              <span className="font-semibold text-slate-700 truncate block max-w-[150px]" title={assoc.fileName}>
                                {assoc.fileName}
                              </span>
                            </div>
                            {assoc.webViewLink && (
                              <a
                                href={assoc.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded transition-all shrink-0"
                                title="Open in Google Drive"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  handleOpenEdit(selectedEmployee);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-primary-custom hover:opacity-90 rounded-lg"
              >
                Edit Folder
              </button>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg"
              >
                Close Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK CSV IMPORT MODAL */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="bg-primary-custom text-white px-6 py-4 flex items-center justify-between border-b shrink-0">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-accent-custom" />
                <h3 className="font-extrabold text-sm tracking-wide uppercase">Bulk Import Employee Folders via CSV</h3>
              </div>
              <button onClick={() => setImportModalOpen(false)} className="text-white/80 hover:text-white rounded-full p-1 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Step 1: Template Download & File Upload Area */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-xs font-bold text-slate-800">1. Download System Template &amp; Select File</h4>
                  <p className="text-[11px] text-slate-500">
                    Use our standardized CSV template with Department codes and required fields. Remove the sample row (EMP999) before uploading.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg shadow-2xs transition-all"
                  >
                    <Download className="h-4 w-4 text-primary-custom" />
                    <span>Download CSV Template</span>
                  </button>
                </div>
              </div>

              {/* Upload Drop Zone / Input */}
              <div className="border-2 border-dashed border-slate-300 hover:border-primary-custom rounded-xl p-6 text-center transition-colors bg-white">
                <FileUp className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Select CSV file for batch processing</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Supports standard UTF-8 encoded .csv files</p>
                <div className="mt-3 flex justify-center">
                  <label className="cursor-pointer px-4 py-2 bg-primary-custom hover:opacity-90 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-2">
                    <Upload className="h-4 w-4 text-accent-custom" />
                    <span>Choose CSV File</span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {selectedFileName && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Selected File: {selectedFileName}</span>
                  </div>
                )}
              </div>

              {/* Step 2: Validation Metrics & Summary Counters */}
              {isProcessingImport && (
                <div className="flex items-center justify-center py-6 gap-2 text-slate-600 text-xs font-bold">
                  <RefreshCw className="h-5 w-5 animate-spin text-primary-custom" />
                  <span>Parsing and validating employee CSV rows...</span>
                </div>
              )}

              {importRows.length > 0 && !isProcessingImport && (
                <div className="space-y-4">
                  {/* Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Found</span>
                      <span className="text-lg font-extrabold text-slate-800">{importRows.length}</span>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase block">Valid &amp; Ready</span>
                      <span className="text-lg font-extrabold text-emerald-700">
                        {importRows.filter(r => r.isValid).length}
                      </span>
                    </div>
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-center">
                      <span className="text-[10px] font-bold text-rose-600 uppercase block">Invalid / Errors</span>
                      <span className="text-lg font-extrabold text-rose-700">
                        {importRows.filter(r => !r.isValid).length}
                      </span>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                      <span className="text-[10px] font-bold text-amber-600 uppercase block">Duplicate IDs</span>
                      <span className="text-lg font-extrabold text-amber-700">{importDuplicateCount}</span>
                    </div>
                  </div>

                  {/* Step 3: Row-by-Row Preview Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 border-b flex justify-between items-center">
                      <h5 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Import Preview &amp; Audit Log Validation</h5>
                      <span className="text-[11px] text-slate-500 font-medium">Row-by-Row Verification</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase sticky top-0">
                          <tr>
                            <th className="px-3 py-2">Row</th>
                            <th className="px-3 py-2">Emp ID</th>
                            <th className="px-3 py-2">Name</th>
                            <th className="px-3 py-2">Dept</th>
                            <th className="px-3 py-2">Gender</th>
                            <th className="px-3 py-2">Type</th>
                            <th className="px-3 py-2 text-center">Status</th>
                            <th className="px-3 py-2">Validation Errors</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {importRows.map((row) => (
                            <tr key={row.rowIndex} className={row.isValid ? "hover:bg-slate-50" : "bg-rose-50/40"}>
                              <td className="px-3 py-2 font-mono text-slate-500">{row.rowIndex}</td>
                              <td className="px-3 py-2 font-bold text-slate-800">{row.raw.empId || "-"}</td>
                              <td className="px-3 py-2 font-semibold text-slate-700">
                                {row.raw.fName} {row.raw.lName}
                              </td>
                              <td className="px-3 py-2 text-slate-600">{row.raw.deptCodeInput || "-"}</td>
                              <td className="px-3 py-2 text-slate-600">{row.raw.gender}</td>
                              <td className="px-3 py-2 text-slate-600">{row.raw.empTypeInput}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  row.isValid 
                                    ? "bg-emerald-100 text-emerald-800" 
                                    : "bg-rose-100 text-rose-800"
                                }`}>
                                  {row.isValid ? "Valid" : "Invalid"}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-[11px] text-rose-700 font-medium max-w-xs">
                                {row.isValid ? (
                                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 inline" /> Ready for Import
                                  </span>
                                ) : (
                                  <div className="space-y-0.5">
                                    {row.errors.map((err, errIdx) => (
                                      <div key={errIdx} className="flex items-start gap-1">
                                        <AlertCircle className="h-3 w-3 text-rose-500 shrink-0 mt-0.5" />
                                        <span>{err}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {importRows.some(r => !r.isValid) && (
                  <button
                    onClick={handleDownloadRejectedCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-all"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Rejected Log CSV</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importRows.filter(r => r.isValid).length === 0}
                  onClick={handleExecuteImport}
                  className="px-5 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-white" />
                  <span>Confirm &amp; Import Valid Records ({importRows.filter(r => r.isValid).length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT EXECUTION SUMMARY MODAL */}
      {importSummaryOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-primary-custom text-white px-6 py-4 flex items-center justify-between border-b">
              <h3 className="font-extrabold text-sm tracking-wide uppercase">Bulk Import Completion</h3>
              <button onClick={() => setImportSummaryOpen(false)} className="text-white/80 hover:text-white rounded-full p-1 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <h4 className="text-base font-extrabold text-slate-800">CSV Bulk Import Processed</h4>
              <p className="text-xs text-slate-500">
                The employee import process has finished executing against the Firestore database.
              </p>

              <div className="grid grid-cols-2 gap-3 py-2">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase block">Successfully Imported</span>
                  <span className="text-xl font-extrabold text-emerald-700">{importSuccessCount}</span>
                </div>
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Skipped / Failed</span>
                  <span className="text-xl font-extrabold text-slate-700">{importFailCount}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-lg border text-left">
                <strong>Audit Record:</strong> All created employee profiles have been registered in Employee Master and logged to Central Audit Log under current session user ({currentUser?.email}).
              </p>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t flex justify-center">
              <button
                onClick={() => setImportSummaryOpen(false)}
                className="px-6 py-2 text-xs font-bold text-white bg-primary-custom hover:opacity-90 rounded-lg shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
