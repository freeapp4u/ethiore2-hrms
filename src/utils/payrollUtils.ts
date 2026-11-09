import { 
  Employee, EmployeeSalaryStructure, TaxConfiguration, SalaryComponent, 
  PayrollRecord, TaxBracket, PayrollImportError, PayrollPeriod 
} from "../types";

// ==========================================
// DEFAULT ETHIOPIAN TAX & STATUTORY RATES
// ==========================================

export const DEFAULT_ETHIOPIAN_TAX_BRACKETS: TaxBracket[] = [
  { id: "TB1", minIncome: 0, maxIncome: 600, taxRate: 0.00, deductionETB: 0 },
  { id: "TB2", minIncome: 601, maxIncome: 1650, taxRate: 0.10, deductionETB: 60.00 },
  { id: "TB3", minIncome: 1651, maxIncome: 3200, taxRate: 0.15, deductionETB: 142.50 },
  { id: "TB4", minIncome: 3201, maxIncome: 5250, taxRate: 0.20, deductionETB: 302.50 },
  { id: "TB5", minIncome: 5251, maxIncome: 7800, taxRate: 0.25, deductionETB: 565.00 },
  { id: "TB6", minIncome: 7801, maxIncome: 10900, taxRate: 0.30, deductionETB: 955.00 },
  { id: "TB7", minIncome: 10901, maxIncome: null, taxRate: 0.35, deductionETB: 1500.00 }
];

export const DEFAULT_TAX_CONFIG: TaxConfiguration = {
  id: "TAX_ETHIOPIA_DEFAULT",
  taxBrackets: DEFAULT_ETHIOPIAN_TAX_BRACKETS,
  employeePensionRate: 0.07, // 7%
  employerPensionRate: 0.11, // 11%
  transportTaxExemptLimit: 2200, // 2,200 ETB
  effectiveDate: "2026-01-01",
  status: "Active",
  updatedBy: "System Admin",
  updatedDate: "2026-01-01"
};

// ==========================================
// CALCULATIONS
// ==========================================

/**
 * Calculates Employment Income Tax based on progressive brackets
 */
export function calculateEmploymentIncomeTax(
  taxableIncome: number,
  brackets: TaxBracket[] = DEFAULT_ETHIOPIAN_TAX_BRACKETS
): number {
  if (taxableIncome <= 600) return 0;

  // Sort brackets by minIncome ascending
  const sorted = [...brackets].sort((a, b) => a.minIncome - b.minIncome);

  for (const b of sorted) {
    const min = b.minIncome;
    const max = b.maxIncome;

    if (taxableIncome >= min && (max === null || taxableIncome <= max)) {
      const tax = (taxableIncome * b.taxRate) - b.deductionETB;
      return Math.max(0, Math.round(tax * 100) / 100);
    }
  }

  // Fallback for highest income bracket if sorted check overflows
  const topBracket = sorted[sorted.length - 1];
  if (topBracket) {
    const tax = (taxableIncome * topBracket.taxRate) - topBracket.deductionETB;
    return Math.max(0, Math.round(tax * 100) / 100);
  }

  return 0;
}

/**
 * Calculate Transport Allowance tax-exempt portion
 * In Ethiopian labor law, transport allowance is tax exempt up to 1/4 of basic salary or max cap (e.g. 2,200 ETB).
 */
export function calculateTransportTaxExemptAmount(
  basicSalary: number,
  transportAllowance: number,
  exemptCapETB: number = 2200
): number {
  if (transportAllowance <= 0) return 0;
  const quarterBasic = basicSalary * 0.25;
  const maxExempt = Math.min(quarterBasic, exemptCapETB);
  return Math.min(transportAllowance, maxExempt);
}

/**
 * Compute full payroll record for an employee given salary structure & tax rules
 */
export function calculateEmployeePayrollRecord(
  employee: Employee,
  structure: EmployeeSalaryStructure,
  period: { id: string; periodName: string },
  taxConfig: TaxConfiguration = DEFAULT_TAX_CONFIG,
  departmentName: string = "General Department",
  calculatedBy: string = "HR Officer"
): PayrollRecord {
  const basicSalary = Number(structure.basicSalary || 0);
  const positionAllowance = Number(structure.positionAllowance || 0);
  const transportAllowance = Number(structure.transportAllowance || 0);
  const housingAllowance = Number(structure.housingAllowance || 0);
  const responsibilityAllowance = Number(structure.responsibilityAllowance || 0);
  const telephoneAllowance = Number(structure.telephoneAllowance || 0);
  const overtime = Number(structure.overtimeAmount || 0);
  const otherEarnings = Number(structure.otherEarnings || 0);

  // Earnings Summary
  const grossSalary = Math.round((
    basicSalary + positionAllowance + transportAllowance + housingAllowance +
    responsibilityAllowance + telephoneAllowance + overtime + otherEarnings
  ) * 100) / 100;

  // Tax Exempt Exemptions
  const transportExempt = calculateTransportTaxExemptAmount(
    basicSalary, 
    transportAllowance, 
    taxConfig.transportTaxExemptLimit || 2200
  );
  
  const taxExemptEarnings = Math.round(transportExempt * 100) / 100;
  const taxableEarnings = Math.max(0, Math.round((grossSalary - taxExemptEarnings) * 100) / 100);

  // Income Tax calculation using progressive brackets
  const incomeTax = calculateEmploymentIncomeTax(taxableEarnings, taxConfig.taxBrackets);

  // Pension Calculations (7% Employee, 11% Employer calculated on Basic Salary)
  const employeePensionRate = taxConfig.employeePensionRate ?? 0.07;
  const employerPensionRate = taxConfig.employerPensionRate ?? 0.11;

  const employeePension = structure.isPensionEligible 
    ? Math.round((basicSalary * employeePensionRate) * 100) / 100 
    : 0;

  const employerPension = structure.isPensionEligible 
    ? Math.round((basicSalary * employerPensionRate) * 100) / 100 
    : 0;

  // Deductions Summary
  const loanDeduction = Number(structure.recurringDeductions?.["LOAN"] || 0);
  const otherDeductions = Number(structure.recurringDeductions?.["OD"] || 0);

  const totalDeductions = Math.round((
    incomeTax + employeePension + loanDeduction + otherDeductions
  ) * 100) / 100;

  const netSalary = Math.max(0, Math.round((grossSalary - totalDeductions) * 100) / 100);

  return {
    id: `PR_${period.id}_${employee.employeeId}`,
    payrollPeriodId: period.id,
    payrollPeriodName: period.periodName,
    employeeId: employee.employeeId,
    employeeName: employee.fullName,
    departmentId: employee.departmentId,
    departmentName,
    position: employee.position,
    basicSalary,
    positionAllowance,
    transportAllowance,
    housingAllowance,
    responsibilityAllowance,
    telephoneAllowance,
    overtime,
    otherEarnings,
    grossSalary,
    taxableEarnings,
    taxExemptEarnings,
    incomeTax,
    employeePension,
    loanDeduction,
    otherDeductions,
    totalDeductions,
    netSalary,
    employerPension,
    status: "Calculated",
    calculatedDate: new Date().toISOString().replace("T", " ").substring(0, 19),
    calculatedBy
  };
}

// ==========================================
// CSV PARSER & TEMPLATES
// ==========================================

export const PAYROLL_CSV_HEADERS = [
  "Employee_ID",
  "Employee_Name",
  "Department",
  "Payroll_Period",
  "Basic_Salary",
  "Position_Allowance",
  "Transport_Allowance",
  "Housing_Allowance",
  "Responsibility_Allowance",
  "Telephone_Allowance",
  "Overtime",
  "Other_Earnings",
  "Income_Tax",
  "Employee_Pension",
  "Loan_Deduction",
  "Other_Deductions"
];

/**
 * Generate CSV template string for Payroll Import
 */
export function generatePayrollCsvTemplate(): string {
  const headers = PAYROLL_CSV_HEADERS.join(",");
  const sampleRow = [
    "EMP001",
    "Abebe Kebede Worku",
    "Underwriting Department",
    "January 2026",
    "45000",
    "5000",
    "3000",
    "4000",
    "2000",
    "1000",
    "0",
    "0",
    "12352.50",
    "3150.00",
    "0",
    "0"
  ].join(",");

  const commentRow = "# IMPORTANT NOTICE: Remove this sample row before uploading actual company payroll records.";
  return `${commentRow}\n${headers}\n${sampleRow}`;
}

/**
 * Robust CSV parser that correctly handles quoted values, newlines, and trailing spaces
 */
export function parseCsvString(csvText: string): string[][] {
  const lines = csvText.split(/\r\n|\n|\r/);
  const rows: string[][] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith("#")) continue;

    const row: string[] = [];
    let insideQuote = false;
    let field = "";

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(field.trim());
        field = "";
      } else {
        field += char;
      }
    }
    row.push(field.trim());
    if (row.length > 0 && row.some(cell => cell.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Validates parsed CSV rows against Employee Master and Payroll Rules
 */
export function validatePayrollImportRows(
  rows: string[][],
  existingEmployees: Employee[],
  selectedPeriodName: string,
  existingRecords: PayrollRecord[] = []
): {
  validRecords: PayrollRecord[];
  invalidErrors: PayrollImportError[];
  summary: { total: number; successful: number; skipped: number; failed: number };
} {
  if (rows.length < 2) {
    return {
      validRecords: [],
      invalidErrors: [{ rowNumber: 1, employeeId: "N/A", errorMessage: "CSV file is empty or missing headers." }],
      summary: { total: 0, successful: 0, skipped: 0, failed: 1 }
    };
  }

  const headerRow = rows[0].map(h => h.replace(/[^a-zA-Z0-9_]/g, "").toUpperCase());
  const dataRows = rows.slice(1);

  const empIdIdx = headerRow.findIndex(h => h.includes("EMPLOYEEID") || h.includes("EMPLOYEE_ID"));
  const basicIdx = headerRow.findIndex(h => h.includes("BASIC"));
  const posIdx = headerRow.findIndex(h => h.includes("POSITION"));
  const transIdx = headerRow.findIndex(h => h.includes("TRANSPORT"));
  const houseIdx = headerRow.findIndex(h => h.includes("HOUSING"));
  const respIdx = headerRow.findIndex(h => h.includes("RESPONSIBILITY"));
  const telIdx = headerRow.findIndex(h => h.includes("TELEPHONE"));
  const otIdx = headerRow.findIndex(h => h.includes("OVERTIME"));
  const otherEarnIdx = headerRow.findIndex(h => h.includes("OTHEREARNINGS") || h.includes("OTHER_EARNINGS"));
  const loanIdx = headerRow.findIndex(h => h.includes("LOAN"));
  const otherDedIdx = headerRow.findIndex(h => h.includes("OTHERDEDUCTIONS") || h.includes("OTHER_DEDUCTIONS"));

  const validRecords: PayrollRecord[] = [];
  const invalidErrors: PayrollImportError[] = [];
  const seenEmpIdsInFile = new Set<string>();

  dataRows.forEach((row, index) => {
    const rowNum = index + 2; // header is row 1
    
    // Skip sample row if left by user
    if (row[0] === "EMP001" && row[1]?.includes("Abebe Kebede")) {
      return;
    }

    const empId = (empIdIdx !== -1 ? row[empIdIdx] : row[0])?.trim() || "";

    if (!empId) {
      invalidErrors.push({
        rowNumber: rowNum,
        employeeId: "MISSING",
        errorMessage: "Employee ID column cannot be blank."
      });
      return;
    }

    // Check duplicate inside same CSV file
    if (seenEmpIdsInFile.has(empId)) {
      invalidErrors.push({
        rowNumber: rowNum,
        employeeId: empId,
        errorMessage: `Duplicate record for Employee ID ${empId} in the same upload file.`
      });
      return;
    }
    seenEmpIdsInFile.add(empId);

    // Validate employee against Employee Master
    const emp = existingEmployees.find(e => e.employeeId.toUpperCase() === empId.toUpperCase());
    if (!emp) {
      invalidErrors.push({
        rowNumber: rowNum,
        employeeId: empId,
        errorMessage: `Employee ID ${empId} not found in Employee Master.`
      });
      return;
    }

    if (emp.status === "Inactive") {
      invalidErrors.push({
        rowNumber: rowNum,
        employeeId: empId,
        errorMessage: `Employee ${emp.fullName} (${empId}) is currently marked Inactive.`
      });
      return;
    }

    // Check duplicate record in existing payroll period database
    const alreadyProcessed = existingRecords.some(
      r => r.employeeId.toUpperCase() === empId.toUpperCase() && r.payrollPeriodName === selectedPeriodName
    );
    if (alreadyProcessed) {
      invalidErrors.push({
        rowNumber: rowNum,
        employeeId: empId,
        errorMessage: `Payroll record already exists for ${empId} in period ${selectedPeriodName}.`
      });
      return;
    }

    // Extract numeric fields
    const getNum = (idx: number, fallback = 0) => {
      if (idx === -1 || !row[idx]) return fallback;
      const clean = row[idx].replace(/[^0-9.-]/g, "");
      const num = parseFloat(clean);
      return isNaN(num) ? fallback : num;
    };

    const basicSalary = getNum(basicIdx, 0);
    if (basicSalary <= 0) {
      invalidErrors.push({
        rowNumber: rowNum,
        employeeId: empId,
        errorMessage: `Invalid Basic Salary (${row[basicIdx] || "0"}). Must be greater than 0.`
      });
      return;
    }

    const positionAllowance = getNum(posIdx, 0);
    const transportAllowance = getNum(transIdx, 0);
    const housingAllowance = getNum(houseIdx, 0);
    const responsibilityAllowance = getNum(respIdx, 0);
    const telephoneAllowance = getNum(telIdx, 0);
    const overtime = getNum(otIdx, 0);
    const otherEarnings = getNum(otherEarnIdx, 0);
    const loanDeduction = getNum(loanIdx, 0);
    const otherDeductions = getNum(otherDedIdx, 0);

    // Form mock structure
    const tempStructure: EmployeeSalaryStructure = {
      id: `S_${emp.employeeId}`,
      employeeId: emp.employeeId,
      basicSalary,
      positionAllowance,
      transportAllowance,
      housingAllowance,
      responsibilityAllowance,
      telephoneAllowance,
      overtimeAmount: overtime,
      otherEarnings,
      recurringDeductions: {
        LOAN: loanDeduction,
        OD: otherDeductions
      },
      isPensionEligible: true,
      effectiveDate: new Date().toISOString().split("T")[0],
      updatedBy: "CSV Import",
      updatedDate: new Date().toISOString().split("T")[0]
    };

    const periodMock = {
      id: `PP_${selectedPeriodName.replace(/\s+/g, "_")}`,
      periodName: selectedPeriodName
    };

    const rec = calculateEmployeePayrollRecord(
      emp,
      tempStructure,
      periodMock,
      DEFAULT_TAX_CONFIG,
      "Imported Department",
      "CSV Bulk Import"
    );

    rec.isImported = true;
    validRecords.push(rec);
  });

  const total = dataRows.length;
  const failed = invalidErrors.length;
  const successful = validRecords.length;

  return {
    validRecords,
    invalidErrors,
    summary: {
      total,
      successful,
      skipped: 0,
      failed
    }
  };
}

/**
 * Generate Error CSV download content
 */
export function generateErrorCsvContent(errors: PayrollImportError[]): string {
  let csv = "Row_Number,Employee_ID,Error_Description\n";
  errors.forEach(err => {
    csv += `"${err.rowNumber}","${err.employeeId}","${err.errorMessage.replace(/"/g, '""')}"\n`;
  });
  return csv;
}
