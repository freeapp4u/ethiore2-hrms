import { LeaveRecord } from "../types";

/**
 * Calculates working days count between startDate and endDate (inclusive),
 * excluding Saturdays, Sundays, and public holidays.
 */
export function calculateWorkingDaysCount(
  startDateStr: string,
  endDateStr: string,
  holidays: string[]
): number {
  if (!startDateStr || !endDateStr) return 0;
  
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  if (start > end) return 0;
  
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

  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0 is Sunday, 6 is Saturday
    const formattedDate = current.toISOString().split("T")[0];
    
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidaySet.has(formattedDate);
    
    if (!isWeekend && !isHoliday) {
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
    
    // Check if [start, end] overlaps with [recStart, recEnd]
    // Condition: start <= recEnd AND end >= recStart
    if (start <= recEnd && end >= recStart) {
      return true;
    }
  }
  
  return false;
}
