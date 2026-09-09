import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBillingReference(id: number | string): string {
  return `IN-${String(id).padStart(5, '0')}`;
}

export function formatCollectionReference(id: number | string): string {
  return `OR-${String(id).padStart(5, '0')}`;
}

export function formatBillingCycle(cycle?: string): string {
  if (!cycle) return 'Monthly';
  const trimmed = cycle.trim();
  switch (trimmed.toLowerCase()) {
    case 'quarterly': return 'Quarterly';
    case 'annually':
    case 'annual': return 'Annually';
    case 'one_time':
    case 'one-time': return 'One-time';
    case 'monthly': return 'Monthly';
    default: return trimmed;
  }
}

export interface BillingTypeDueDateConfig {
  due_date_type?: 'fixed_day' | 'days_after_posting' | string | null;
  due_date_value?: number | string | null;
}

/**
 * Computes the default due date string (YYYY-MM-DD) from a BillingType configuration stored in the database.
 * - fixed_day: Sets the target day of the month. If that day has already passed for the current month, rolls over to the next month.
 * - days_after_posting: Adds due_date_value days (default 15) to the base date.
 */
export function computeDueDateFromBillingType(
  typeConfig?: BillingTypeDueDateConfig | null,
  baseDate: Date = new Date()
): string {
  const startDate = new Date(baseDate);
  const year = startDate.getFullYear();
  const month = startDate.getMonth();
  const day = startDate.getDate();

  if (typeConfig && typeConfig.due_date_type === 'fixed_day') {
    const targetDay = Number(typeConfig.due_date_value) || 1;
    const maxDaysThisMonth = new Date(year, month + 1, 0).getDate();
    const clampedDayThisMonth = Math.min(targetDay, maxDaysThisMonth);
    const dateThisMonth = new Date(year, month, clampedDayThisMonth);

    if (clampedDayThisMonth >= day) {
      const y = dateThisMonth.getFullYear();
      const m = String(dateThisMonth.getMonth() + 1).padStart(2, '0');
      const d = String(dateThisMonth.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } else {
      const nextMonthDate = new Date(year, month + 1, 1);
      const maxDaysNextMonth = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1, 0).getDate();
      const clampedDayNextMonth = Math.min(targetDay, maxDaysNextMonth);
      const targetNextMonth = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), clampedDayNextMonth);
      const y = targetNextMonth.getFullYear();
      const m = String(targetNextMonth.getMonth() + 1).padStart(2, '0');
      const d = String(targetNextMonth.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  } else {
    const daysToAdd = Number(typeConfig && typeConfig.due_date_value !== undefined && typeConfig.due_date_value !== null ? typeConfig.due_date_value : 15);
    const targetDate = new Date(year, month, day + daysToAdd);
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const SHORT_MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function getMonthIndex(name: string): number {
  if (!name) return -1;
  const clean = name.trim().toLowerCase();
  const fullIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === clean);
  if (fullIdx >= 0) return fullIdx;
  const shortIdx = SHORT_MONTH_NAMES.findIndex(m => m.toLowerCase() === clean);
  if (shortIdx >= 0) return shortIdx;
  return -1;
}

export function parseMoveInDate(moveInDateStr?: string): { day: number; monthIndex: number; year: number } {
  if (!moveInDateStr) {
    const now = new Date();
    return { day: 1, monthIndex: now.getMonth(), year: now.getFullYear() };
  }
  const cleanStr = moveInDateStr.split("T")[0];
  const parts = cleanStr.split("-").map(Number);
  if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return {
      year: parts[0],
      monthIndex: parts[1] - 1,
      day: parts[2],
    };
  }
  const d = new Date(moveInDateStr);
  if (!isNaN(d.getTime())) {
    return { day: d.getDate(), monthIndex: d.getMonth(), year: d.getFullYear() };
  }
  return { day: 1, monthIndex: new Date().getMonth(), year: new Date().getFullYear() };
}

export function addMonthsToDate(dateStr: string, monthsToAdd: number): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3) return dateStr;
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];

  const totalMonths = m - 1 + monthsToAdd;
  const targetYear = y + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;

  const maxDaysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedDay = Math.min(d, maxDaysInTargetMonth);

  const resY = targetYear;
  const resM = String(targetMonth + 1).padStart(2, "0");
  const resD = String(clampedDay).padStart(2, "0");
  return `${resY}-${resM}-${resD}`;
}

export function formatDateRange(startDateStr: string, endDateStr: string): string {
  if (!startDateStr || !endDateStr) return "";
  const [sy, sm, sd] = startDateStr.split("-").map(Number);
  const [ey, em, ed] = endDateStr.split("-").map(Number);

  const startM = MONTH_NAMES[sm - 1] || "";
  const endM = MONTH_NAMES[em - 1] || "";

  if (sy === ey) {
    return `${startM} ${sd} - ${endM} ${ed} ${sy}`;
  }
  return `${startM} ${sd} ${sy} - ${endM} ${ed} ${ey}`;
}

export function parseDateRangeFromCycle(
  cycleStr?: string,
  refDateStr?: string | Date
): { startDate: string; endDate: string } | null {
  if (!cycleStr) return null;
  const str = cycleStr.trim();
  const lower = str.toLowerCase();
  if (
    lower === "monthly" ||
    lower === "quarterly" ||
    lower === "annually" ||
    lower === "annual" ||
    lower === "one_time" ||
    lower === "one-time"
  ) {
    return null;
  }

  const isoMatch = str.match(/(\d{4}-\d{2}-\d{2})\s*(?:-|to)\s*(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    return { startDate: isoMatch[1], endDate: isoMatch[2] };
  }

  const refDate = refDateStr ? new Date(refDateStr) : new Date();
  const refYear = !isNaN(refDate.getTime()) ? refDate.getFullYear() : new Date().getFullYear();

  const rangeMatch = str.match(
    /([A-Za-z]+)\s+(\d+)(?:,?\s+(\d{4}))?\s*-\s*([A-Za-z]+)\s+(\d+)(?:,?\s+(\d{4}))?/i
  );
  if (rangeMatch) {
    const startMName = rangeMatch[1];
    const startDay = parseInt(rangeMatch[2], 10);
    const startYearMatch = rangeMatch[3];
    const endMName = rangeMatch[4];
    const endDay = parseInt(rangeMatch[5], 10);
    const endYearMatch = rangeMatch[6];

    const startMIdx = getMonthIndex(startMName);
    const endMIdx = getMonthIndex(endMName);

    if (startMIdx >= 0 && endMIdx >= 0) {
      let endYear = endYearMatch ? parseInt(endYearMatch, 10) : startYearMatch ? parseInt(startYearMatch, 10) : refYear;
      let startYear = startYearMatch ? parseInt(startYearMatch, 10) : endYear;

      if (!startYearMatch && !endYearMatch && startMIdx > endMIdx) {
        startYear = endYear - 1;
      }

      const sM = String(startMIdx + 1).padStart(2, "0");
      const sD = String(startDay).padStart(2, "0");
      const eM = String(endMIdx + 1).padStart(2, "0");
      const eD = String(endDay).padStart(2, "0");

      return {
        startDate: `${startYear}-${sM}-${sD}`,
        endDate: `${endYear}-${eM}-${eD}`,
      };
    }
  }

  return null;
}

export function computeDefaultDateRange(
  moveInDateStr?: string,
  frequency: string = "monthly",
  baseDate: Date = new Date()
): { startDate: string; endDate: string } {
  const { day } = parseMoveInDate(moveInDateStr);
  const currentY = baseDate.getFullYear();
  const currentM = baseDate.getMonth();
  const maxDaysThisMonth = new Date(currentY, currentM + 1, 0).getDate();
  const clampedDay = Math.min(day, maxDaysThisMonth);
  const startObj = new Date(currentY, currentM, clampedDay);
  const startStr = `${startObj.getFullYear()}-${String(startObj.getMonth() + 1).padStart(2, "0")}-${String(startObj.getDate()).padStart(2, "0")}`;

  const monthsToAdd = frequency === "quarterly" ? 3 : frequency === "annually" ? 12 : frequency === "one_time" ? 0 : 1;
  const endStr = monthsToAdd > 0 ? addMonthsToDate(startStr, monthsToAdd) : startStr;

  return { startDate: startStr, endDate: endStr };
}

export interface BillingCandidate {
  id?: number;
  tenant_id: number;
  billing_type_id: number;
  billing_cycle?: string | null;
  due_date?: string | null;
  createdAt?: string | Date | null;
  created_at?: string | Date | null;
}

export interface BillingDateRangeResult {
  startDate: string;
  endDate: string;
  isFromPrevious: boolean;
  previousBillingId?: number;
  previousEndDate?: string;
  cycleString: string;
}

export function determineBillingDateRange(
  tenantId: number | string,
  billingTypeId: number | string,
  allBillings: BillingCandidate[],
  moveInDateStr?: string,
  frequency: string = "monthly",
  baseDate: Date = new Date()
): BillingDateRangeResult {
  const tId = Number(tenantId);
  const btId = Number(billingTypeId);

  const tenantBills = (allBillings || []).filter(
    (b) => Number(b.tenant_id) === tId
  );

  if (tenantBills.length > 0) {
    const sameTypeBills = tenantBills.filter(
      (b) => Number(b.billing_type_id) === btId
    );
    const candidateList = sameTypeBills.length > 0 ? sameTypeBills : tenantBills;
    const sorted = [...candidateList].sort((a, b) => (b.id || 0) - (a.id || 0));

    for (const bill of sorted) {
      const refDate = bill.due_date || (bill.createdAt ? String(bill.createdAt) : undefined) || (bill.created_at ? String(bill.created_at) : undefined);
      const parsedRange = parseDateRangeFromCycle(bill.billing_cycle || undefined, refDate);
      if (parsedRange && parsedRange.endDate) {
        const nextStartDate = parsedRange.endDate;
        const monthsToAdd = frequency === "quarterly" ? 3 : frequency === "annually" ? 12 : frequency === "one_time" ? 0 : 1;
        const nextEndDate = monthsToAdd > 0 ? addMonthsToDate(nextStartDate, monthsToAdd) : nextStartDate;

        return {
          startDate: nextStartDate,
          endDate: nextEndDate,
          isFromPrevious: true,
          previousBillingId: bill.id,
          previousEndDate: parsedRange.endDate,
          cycleString: formatDateRange(nextStartDate, nextEndDate),
        };
      }
    }
  }

  const defaultRange = computeDefaultDateRange(moveInDateStr, frequency, baseDate);
  return {
    startDate: defaultRange.startDate,
    endDate: defaultRange.endDate,
    isFromPrevious: false,
    cycleString: formatDateRange(defaultRange.startDate, defaultRange.endDate),
  };
}



