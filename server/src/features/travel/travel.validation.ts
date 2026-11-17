// server/src/features/travel/travel.validation.ts
import { 
  TravelType, 
  ExpenseCategory, 
  RevisionTarget,
  SupportingDoc
} from './travel.types.js';

export interface CreateExpenseInput {
  category: ExpenseCategory;
  merchant: string;
  amount: number;
  expense_date: string;
  receipt_image_url?: string | null;
  notes?: string | null;
}

export interface CreateTravelRequestInput {
  travel_type: TravelType;
  title: string;
  purpose: string;
  project_code: string;
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  supporting_doc_url?: string | null;
  supporting_docs?: SupportingDoc[];
  supportingDocs?: SupportingDoc[];
  expenses: CreateExpenseInput[];
  submit_now?: boolean;
}

export interface ManagerReviewInput {
  action: 'APPROVE_AND_FORWARD' | 'REQUEST_REVISION' | 'REJECT';
  remarks?: string;
}

export interface AdminReviewInput {
  action: 'APPROVE' | 'SETTLE' | 'REQUEST_REVISION' | 'REJECT';
  revision_target?: RevisionTarget;
  remarks?: string;
}

export interface ResubmitTravelRequestInput {
  employee_response_notes?: string;
  departure_date?: string;
  return_date?: string;
  supporting_doc_url?: string;
  supporting_docs?: SupportingDoc[];
  supportingDocs?: SupportingDoc[];
  updated_expenses?: CreateExpenseInput[];
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

interface ServerCountryRule {
  dialCode: string;
  minDigits: number;
  maxDigits: number;
  pattern?: RegExp;
}

const SERVER_COUNTRY_RULES: ServerCountryRule[] = [
  { dialCode: '+91', minDigits: 10, maxDigits: 10, pattern: /^[6-9]\d{9}$/ },
  { dialCode: '+1', minDigits: 10, maxDigits: 10, pattern: /^[2-9]\d{2}[2-9]\d{6}$/ },
  { dialCode: '+44', minDigits: 10, maxDigits: 11, pattern: /^(?:7\d{9}|[1-9]\d{9,10})$/ },
  { dialCode: '+81', minDigits: 10, maxDigits: 11, pattern: /^(?:[789]0\d{8}|[1-9]\d{9})$/ },
  { dialCode: '+65', minDigits: 8, maxDigits: 8, pattern: /^[89]\d{7}$/ },
  { dialCode: '+971', minDigits: 9, maxDigits: 9, pattern: /^5\d{8}$/ },
  { dialCode: '+49', minDigits: 10, maxDigits: 12, pattern: /^(?:1[5-7]\d{8,10}|[1-9]\d{9,11})$/ },
  { dialCode: '+61', minDigits: 9, maxDigits: 9, pattern: /^4\d{8}$/ },
  { dialCode: '+33', minDigits: 9, maxDigits: 9, pattern: /^[67]\d{8}$/ },
  { dialCode: '+31', minDigits: 9, maxDigits: 9, pattern: /^6\d{8}$/ },
  { dialCode: '+41', minDigits: 9, maxDigits: 9, pattern: /^7[5-9]\d{7}$/ },
  { dialCode: '+353', minDigits: 9, maxDigits: 9, pattern: /^8[3-9]\d{7}$/ },
  { dialCode: '+966', minDigits: 9, maxDigits: 9, pattern: /^5\d{8}$/ },
  { dialCode: '+86', minDigits: 11, maxDigits: 11, pattern: /^1[3-9]\d{9}$/ },
  { dialCode: '+852', minDigits: 8, maxDigits: 8, pattern: /^[4-9]\d{7}$/ },
  { dialCode: '+82', minDigits: 9, maxDigits: 11, pattern: /^(?:10\d{7,8}|[1-9]\d{8,10})$/ },
  { dialCode: '+60', minDigits: 9, maxDigits: 10, pattern: /^1[0-9]\d{7,8}$/ },
  { dialCode: '+63', minDigits: 10, maxDigits: 10, pattern: /^9\d{9}$/ },
  { dialCode: '+66', minDigits: 9, maxDigits: 9, pattern: /^[689]\d{8}$/ },
  { dialCode: '+62', minDigits: 9, maxDigits: 12, pattern: /^8\d{8,11}$/ },
  { dialCode: '+84', minDigits: 9, maxDigits: 9, pattern: /^[35789]\d{8}$/ },
  { dialCode: '+34', minDigits: 9, maxDigits: 9, pattern: /^[67]\d{8}$/ },
  { dialCode: '+39', minDigits: 9, maxDigits: 10, pattern: /^3\d{8,9}$/ },
  { dialCode: '+46', minDigits: 9, maxDigits: 9, pattern: /^7\d{8}$/ },
  { dialCode: '+47', minDigits: 8, maxDigits: 8, pattern: /^[49]\d{7}$/ },
  { dialCode: '+45', minDigits: 8, maxDigits: 8, pattern: /^[2-9]\d{7}$/ },
  { dialCode: '+64', minDigits: 8, maxDigits: 10, pattern: /^2\d{7,9}$/ },
  { dialCode: '+27', minDigits: 9, maxDigits: 9, pattern: /^[678]\d{8}$/ },
  { dialCode: '+55', minDigits: 10, maxDigits: 11, pattern: /^[1-9]{2}9\d{8}$/ },
];

/**
 * Validates international and national phone format (ITU-T and 30-country rules)
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  if (!/^\+?[0-9\s\-()]{7,25}$/.test(trimmed)) return false;

  const sorted = [...SERVER_COUNTRY_RULES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const r of sorted) {
    if (trimmed.startsWith(r.dialCode)) {
      const national = trimmed.slice(r.dialCode.length).trim().replace(/\D/g, '');
      if (!national) return false;
      if (/^(\d)\1+$/.test(national)) return false;
      if (national.length < r.minDigits || national.length > r.maxDigits) return false;
      if (r.pattern && !r.pattern.test(national)) return false;
      return true;
    }
  }

  // Fallback for generic numbers without recognized dial code
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  return true;
}

const VALID_CATEGORIES: ExpenseCategory[] = ['FLIGHT', 'HOTEL', 'MEALS_PER_DIEM', 'TRANSIT', 'MISC'];
const VALID_TRAVEL_TYPES: TravelType[] = ['UPCOMING', 'ALREADY_TRAVELLED'];

/**
 * Returns the current date in YYYY-MM-DD format using local time
 * to prevent off-by-one shifts from UTC conversions.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates create travel request payload.
 */
export function validateCreateRequestPayload(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be a valid JSON object.'] };
  }

  // 1. Travel Type
  if (!data.travel_type || !VALID_TRAVEL_TYPES.includes(data.travel_type)) {
    errors.push('Travel type must be either UPCOMING or ALREADY_TRAVELLED.');
  }

  // 2. Text Fields
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
    errors.push('Title is required and must be at least 3 characters.');
  }

  if (!data.purpose || typeof data.purpose !== 'string' || data.purpose.trim().length < 5) {
    errors.push('Purpose is required and must be at least 5 characters.');
  }

  if (!data.project_code || typeof data.project_code !== 'string' || data.project_code.trim().length < 2) {
    errors.push('Project Code is required.');
  }

  if (!data.origin || typeof data.origin !== 'string' || data.origin.trim().length < 2) {
    errors.push('Origin is required.');
  }

  if (!data.destination || typeof data.destination !== 'string' || data.destination.trim().length < 2) {
    errors.push('Destination is required.');
  }

  // 3. Dates
  if (!data.departure_date || typeof data.departure_date !== 'string') {
    errors.push('Valid departure date is required (YYYY-MM-DD).');
  }

  if (!data.return_date || typeof data.return_date !== 'string') {
    errors.push('Valid return date is required (YYYY-MM-DD).');
  }

  if (data.departure_date && data.return_date) {
    const dep = new Date(data.departure_date);
    const ret = new Date(data.return_date);
    if (isNaN(dep.getTime()) || isNaN(ret.getTime())) {
      errors.push('Departure and Return dates must be valid ISO date strings.');
    } else if (ret < dep) {
      errors.push('Return date cannot be earlier than departure date.');
    } else {
      const todayStr = getLocalDateString();
      if (data.travel_type === 'UPCOMING') {
        if (data.departure_date < todayStr) {
          errors.push('Upcoming travel departure date cannot be in the past.');
        }
      } else if (data.travel_type === 'ALREADY_TRAVELLED') {
        if (data.return_date > todayStr) {
          errors.push('Claim past travel return date cannot be in the future.');
        }
        if (data.departure_date > todayStr) {
          errors.push('Claim past travel departure date cannot be in the future.');
        }
      }
    }
  }

  // 4. Emergency Contacts
  if (!data.emergency_contact_name || typeof data.emergency_contact_name !== 'string' || data.emergency_contact_name.trim().length < 2) {
    errors.push('Emergency contact name is required.');
  }

  if (!data.emergency_contact_phone || typeof data.emergency_contact_phone !== 'string' || !isValidPhoneNumber(data.emergency_contact_phone)) {
    errors.push('Emergency contact phone is required and must be a valid phone number.');
  }

  // 5. Itemized Expenses Enforcement (Both Upcoming and Past Travel require upfront items)
  if (!Array.isArray(data.expenses) || data.expenses.length === 0) {
    errors.push('At least one itemized expense line item must be provided.');
  } else {
    data.expenses.forEach((item: any, idx: number) => {
      const itemNum = idx + 1;
      if (!item || typeof item !== 'object') {
        errors.push(`Expense #${itemNum} must be an object.`);
        return;
      }
      if (!item.category || !VALID_CATEGORIES.includes(item.category)) {
        errors.push(`Expense #${itemNum}: Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}.`);
      }
      if (
        !item.merchant ||
        typeof item.merchant !== 'string' ||
        item.merchant.trim().length < 2 ||
        !/^(?=.*[a-zA-Z].*[a-zA-Z]).{2,}$/.test(item.merchant.trim())
      ) {
        errors.push(`Expense #${itemNum}: Merchant is required and must be a valid vendor name (cannot be numbers only).`);
      }
      const numAmount = Number(item.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        errors.push(`Expense #${itemNum}: Amount must be a positive number greater than 0.`);
      }
      if (!item.expense_date || typeof item.expense_date !== 'string') {
        errors.push(`Expense #${itemNum}: Valid expense date is required.`);
      } else {
        if (data.departure_date && item.expense_date < data.departure_date) {
          errors.push(`Expense #${itemNum}: Expense date cannot be earlier than departure date.`);
        }
        if (data.return_date && item.expense_date > data.return_date) {
          errors.push(`Expense #${itemNum}: Expense date cannot be later than return date.`);
        }
        if (data.travel_type === 'ALREADY_TRAVELLED') {
          const todayStr = getLocalDateString();
          if (item.expense_date > todayStr) {
            errors.push(`Expense #${itemNum}: Expense date cannot be in the future for past travel claims.`);
          }
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validates manager review action and remarks.
 */
export function validateManagerReviewPayload(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be a valid JSON object.'] };
  }

  const validActions = ['APPROVE_AND_FORWARD', 'REQUEST_REVISION', 'REJECT'];
  if (!data.action || !validActions.includes(data.action)) {
    errors.push(`Action must be one of: ${validActions.join(', ')}.`);
  }

  if (data.action === 'REQUEST_REVISION' || data.action === 'REJECT') {
    if (!data.remarks || typeof data.remarks !== 'string' || data.remarks.trim().length < 3) {
      errors.push(`Remarks are required (minimum 3 characters) when action is ${data.action}.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validates admin review action, dual-route revision targets, and remarks.
 */
export function validateAdminReviewPayload(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be a valid JSON object.'] };
  }

  const validActions = ['APPROVE', 'SETTLE', 'REQUEST_REVISION', 'REJECT'];
  if (!data.action || !validActions.includes(data.action)) {
    errors.push(`Action must be one of: ${validActions.join(', ')}.`);
  }

  if (data.action === 'REQUEST_REVISION') {
    if (data.revision_target && data.revision_target !== 'EMPLOYEE') {
      errors.push("Admin alterations can only be dispatched directly to the Employee ('EMPLOYEE'). Route A (Via Manager) is no longer permitted.");
    }
    if (!data.remarks || typeof data.remarks !== 'string' || data.remarks.trim().length < 3) {
      errors.push('Remarks with revision instructions are required.');
    }
  }

  if (data.action === 'REJECT') {
    if (!data.remarks || typeof data.remarks !== 'string' || data.remarks.trim().length < 3) {
      errors.push('Remarks explaining rejection rationale are required.');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validates employee resubmission payload.
 */
export function validateResubmitPayload(data: any): ValidationResult {
  const errors: string[] = [];

  if (data && typeof data === 'object') {
    if (data.updated_expenses && Array.isArray(data.updated_expenses)) {
      data.updated_expenses.forEach((item: any, idx: number) => {
        const itemNum = idx + 1;
        if (!item.category || !VALID_CATEGORIES.includes(item.category)) {
          errors.push(`Updated Expense #${itemNum}: Invalid category.`);
        }
        const numAmount = Number(item.amount);
        if (isNaN(numAmount) || numAmount <= 0) {
          errors.push(`Updated Expense #${itemNum}: Amount must be a positive number greater than 0.`);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validates Admin department quarterly budget allocation upsert payload.
 */
export function validateUpsertBudgetPayload(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be a valid JSON object.'] };
  }

  const department = typeof data.department === 'string' ? data.department.trim() : '';
  if (department.length < 2 || department.length > 100) {
    errors.push('Department name must be between 2 and 100 characters.');
  }

  const fiscalYear = Number(data.fiscalYear ?? data.fiscal_year);
  if (!Number.isInteger(fiscalYear) || fiscalYear < 2020 || fiscalYear > 2100) {
    errors.push('Fiscal year must be a valid integer between 2020 and 2100.');
  }

  const fiscalQuarter = String(data.fiscalQuarter ?? data.fiscal_quarter ?? '').toUpperCase();
  if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(fiscalQuarter)) {
    errors.push('Fiscal quarter must be one of Q1, Q2, Q3, or Q4.');
  }

  const totalAllocation = Number(data.totalAllocation ?? data.total_allocation);
  if (!Number.isFinite(totalAllocation) || totalAllocation < 0) {
    errors.push('Total allocation must be a non-negative number.');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}
