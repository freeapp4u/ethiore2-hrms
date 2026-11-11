import { LeaveRecord, LeaveTypeConfig, LeaveYearConfig, EmployeeLeaveBalance } from "../types";

const DAY_MAP: { [key: number]: string } = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat"
};

/**
 * Calculates working days count between startDate and endDate (inclusive),
 * excluding configured non-working days and registered public holidays.
 * Supports half-day leave (returns 0.5 if isHalfDay is true).
 */
export function calculateWorkingDaysCount(
  startDateStr: string,
  endDateStr: string,
  holidays: string[],
  workingDaysConfig: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri"],
  isHalfDay: boolean = false
): number {
  if (!startDateStr || !endDateStr) return 0;
  
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  if (start > end) return 0;

  if (isHalfDay) {
    return 0.5;
  }
  
  let count = 0;
  const current = new Date(start);
  
  // Normalize holidays to YYYY-MM-DD
  const holidaySet = new Set(
    holidays.map(h => {
      try {
        return new Date(h).toISOString().split("T")[0];
      } catch {
        return h;
      }
    })
  );

  const workingDaysSet = new Set(workingDaysConfig);

  while (current <= end) {
    const dayOfWeekStr = DAY_MAP[current.getDay()];
    const formattedDate = current.toISOString().split("T")[0];
    
    const isWorkingDay = workingDaysSet.has(dayOfWeekStr);
    const isHoliday = holidaySet.has(formattedDate);
    
    if (isWorkingDay && !isHoliday) {
      count++;
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Checks if a proposed leave record overlaps with any existing leave records
 * for the same employee.
 */
export function checkLeaveOverlap(
  employeeId: string,
  startDateStr: string,
  endDateStr: string,
  leaveRecords: LeaveRecord[],
  ignoreLeaveId?: string
): boolean {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return false;
  }
  
  // Only look at active or completed leaves for this employee
  const relevantLeaves = leaveRecords.filter(
    r =>
      r.employeeId === employeeId &&
      r.status !== "Cancelled" &&
      r.id !== ignoreLeaveId
  );
  
  for (const record of relevantLeaves) {
    const recStart = new Date(record.startDate);
    const recEnd = new Date(record.endDate);
    
    if (start <= recEnd && end >= recStart) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculates an employee's leave balance state for a given leave type and year.
 */
export function calculateEmployeeLeaveBalance(
  employeeId: string,
  leaveTypeConfig: LeaveTypeConfig,
  leaveYear: string,
  leaveRecords: LeaveRecord[],
  manualCarriedForward: number = 0,
  manualAdjustments: number = 0
): EmployeeLeaveBalance {
  const annualEntitlement = leaveTypeConfig.annualEntitlement || 0;
  
  // Sum up utilized days for this employee & leave type in the given year
  const leaveUtilized = leaveRecords
    .filter(
      r =>
        r.employeeId === employeeId &&
        r.leaveType === leaveTypeConfig.name &&
        r.status !== "Cancelled" &&
        (!r.startDate || r.startDate.startsWith(leaveYear))
    )
    .reduce((sum, r) => sum + (r.daysCount || 0), 0);

  const carriedForwardBalance = leaveTypeConfig.carryForwardEligible 
    ? Math.min(manualCarriedForward, leaveTypeConfig.maxCarryForwardDays)
    : 0;

  const openingBalance = annualEntitlement + carriedForwardBalance + manualAdjustments;
  const remainingBalance = Math.max(0, openingBalance - leaveUtilized);

  // Expiration calculation
  let expiredLeave = 0;
  let upcomingExpiringDays = 0;
  let expirationDate: string | undefined = undefined;

  if (leaveTypeConfig.expirationPeriodMonths > 0 && carriedForwardBalance > 0) {
    // Expiration date is leaveYear end + expiration period
    const expDateObj = new Date(`${leaveYear}-12-31`);
    expDateObj.setMonth(expDateObj.getMonth() + leaveTypeConfig.expirationPeriodMonths);
    expirationDate = expDateObj.toISOString().split("T")[0];

    const now = new Date();
    if (now > expDateObj) {
      // If unused carry forward has passed expiration date
      const unusedCarried = Math.max(0, carriedForwardBalance - leaveUtilized);
      expiredLeave = unusedCarried;
    } else {
      upcomingExpiringDays = Math.max(0, carriedForwardBalance - leaveUtilized);
    }
  }

  return {
    id: `BAL_${employeeId}_${leaveTypeConfig.id}_${leaveYear}`,
    employeeId,
    leaveTypeId: leaveTypeConfig.id,
    leaveTypeName: leaveTypeConfig.name,
    leaveYear,
    openingBalance,
    annualEntitlement,
    carriedForwardBalance,
    leaveUtilized,
    expiredLeave,
    remainingBalance: Math.max(0, remainingBalance - expiredLeave),
    expirationDate,
    upcomingExpiringDays,
    lastUpdated: new Date().toISOString().replace("T", " ").substring(0, 19)
  };
}
