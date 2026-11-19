import { useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TravelType } from '../types/travel.types';
import { getPhoneValidationError } from '../utils/countryDialCodes';

export const supportingDocSchema = z
  .object({
    id: z.string(),
    type: z.enum(['LINK', 'FILE']),
    name: z.string().trim().min(1, 'Name or title required'),
    url: z.string().trim().min(1, 'Valid URL is required'),
    format: z.string().optional(),
    size: z.number().optional(),
    uploadedAt: z.string().optional(),
  })
  .refine(
    (doc) => doc.type !== 'FILE' || (doc.size !== undefined && doc.size > 0),
    {
      message: 'Attached file must not be empty (0 KB)',
      path: ['size'],
    }
  );

const pad = (n: number) => String(n).padStart(2, '0');
export function getLocalDateString(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Sanitizes and parses text input amount into a valid number for form submission
 */
export function parseExpenseAmount(val: unknown): number {
  if (val === '' || val === null || val === undefined) return 0;
  const num = Number(val);
  return Number.isFinite(num) ? num : 0;
}

/**
 * Project code validation:
 * - Must contain only uppercase letters (A-Z), hyphens (-), and optional numbers (0-9)
 * - Must contain at least one uppercase letter and at least one hyphen
 * - No lowercase letters allowed
 * - Numbers are optional
 * - Example: ENG-2026, PROJ-APAC, CLIENT-01, DEV-OPS
 */
export const PROJECT_CODE_REGEX = /^(?=.*[A-Z])(?=.*-)[A-Z0-9]+(-[A-Z0-9]+)+$/;

export const travelFormSchema = z
  .object({
    travel_type: z.enum(['UPCOMING', 'ALREADY_TRAVELLED']),
    title: z.string().trim().min(5, 'Title must be at least 5 characters'),
    purpose: z.string().trim().min(10, 'Business purpose must be at least 10 characters'),
    project_code: z
      .string()
      .trim()
      .min(1, 'Project code is required')
      .regex(
        PROJECT_CODE_REGEX,
        'Project code must be uppercase letters with at least one hyphen (e.g. ENG-2026, PROJ-APAC)'
      ),
    origin: z.string().trim().min(2, 'Origin city is required'),
    destination: z.string().trim().min(2, 'Destination is required'),
    departure_date: z.string().trim().min(1, 'Departure date is required'),
    return_date: z.string().trim().min(1, 'Return date is required'),
    emergency_contact_name: z.string().trim().min(2, 'Emergency contact name is required'),
    emergency_contact_phone: z
      .string()
      .min(1, 'Emergency contact phone is required')
      .superRefine((val, ctx) => {
        const error = getPhoneValidationError(val);
        if (error) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: error,
          });
        }
      }),
    supporting_doc_url: z.string().optional(),
    supporting_docs: z.array(supportingDocSchema).min(1, 'At least one quotation or invoice proof is required'),
    expenses: z.array(
      z.object({
        category: z.enum(['FLIGHT', 'HOTEL', 'MEALS_PER_DIEM', 'TRANSIT', 'MISC']),
        merchant: z
          .string()
          .trim()
          .min(2, 'Merchant name is required')
          .refine(
            (val) => /^(?=.*[a-zA-Z].*[a-zA-Z]).{2,}$/.test(val.trim()),
            'Merchant name must be a valid vendor (cannot be numbers only)'
          ),
        amount: z.number().positive('Amount must be positive'),
        originalCurrency: z.string().optional(),
        originalAmount: z.number().optional(),
        exchangeRate: z.number().optional(),
        inrAmount: z.number().optional(),
        expenseDate: z.string(),
        notes: z.string().optional(),
      })
    ).min(1, 'At least one expense line item is required'),
  })
  .superRefine((data, ctx) => {
    const todayStr = getLocalDateString();

    if (data.departure_date && data.return_date && data.return_date < data.departure_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Return date cannot be earlier than departure date',
        path: ['return_date'],
      });
    }

    if (data.travel_type === 'UPCOMING') {
      if (data.departure_date && data.departure_date < todayStr) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Upcoming travel departure date cannot be in the past',
          path: ['departure_date'],
        });
      }
    } else if (data.travel_type === 'ALREADY_TRAVELLED') {
      if (data.return_date && data.return_date > todayStr) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Past travel return date cannot be in the future',
          path: ['return_date'],
        });
      }
      if (data.departure_date && data.departure_date > todayStr) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Past travel departure date cannot be in the future',
          path: ['departure_date'],
        });
      }
    }

    if (Array.isArray(data.expenses)) {
      data.expenses.forEach((item, idx) => {
        if (item.expenseDate) {
          if (data.departure_date && item.expenseDate < data.departure_date) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Expense date cannot be earlier than departure date',
              path: ['expenses', idx, 'expenseDate'],
            });
          }
          if (data.return_date && item.expenseDate > data.return_date) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Expense date cannot be later than return date',
              path: ['expenses', idx, 'expenseDate'],
            });
          }
          if (data.travel_type === 'ALREADY_TRAVELLED' && item.expenseDate > todayStr) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Expense date cannot be in the future for past travel claims',
              path: ['expenses', idx, 'expenseDate'],
            });
          }
        }
      });
    }
  });

export type TravelFormValues = z.infer<typeof travelFormSchema>;

export const TRAVEL_FORM_CONFIG = {
  mode: 'onTouched' as const,
  reValidateMode: 'onChange' as const,
};

export function useTravelForm(initialType: TravelType = 'UPCOMING') {
  const todayStr = getLocalDateString();
  const pastThreeDays = new Date();
  pastThreeDays.setDate(pastThreeDays.getDate() - 3);
  const pastThreeDaysStr = getLocalDateString(pastThreeDays);

  const defaultDeparture = initialType === 'ALREADY_TRAVELLED' ? pastThreeDaysStr : todayStr;
  const defaultReturn =
    initialType === 'ALREADY_TRAVELLED'
      ? todayStr
      : getLocalDateString(new Date(Date.now() + 86400000 * 3));
  const defaultExpenseDate = defaultDeparture;

  const form = useForm<TravelFormValues>({
    resolver: zodResolver(travelFormSchema),
    mode: TRAVEL_FORM_CONFIG.mode,
    reValidateMode: TRAVEL_FORM_CONFIG.reValidateMode,
    defaultValues: {
      travel_type: initialType,
      title: '',
      purpose: '',
      project_code: '',
      origin: '',
      destination: '',
      departure_date: defaultDeparture,
      return_date: defaultReturn,
      emergency_contact_name: '',
      emergency_contact_phone: '+91',
      supporting_doc_url: '',
      supporting_docs: [],
      expenses: [
        {
          category: 'FLIGHT',
          merchant: '',
          amount: 0,
          expenseDate: defaultExpenseDate,
          notes: '',
        },
      ],
    },
  });

  const fieldArray = useFieldArray({
    control: form.control,
    name: 'expenses',
  });

  const watchedExpenses = useWatch({
    control: form.control,
    name: 'expenses',
  });
  const watchedDocs = useWatch({
    control: form.control,
    name: 'supporting_docs',
  }) || [];
  const watchedType = form.watch('travel_type');
  const watchedProof = form.watch('supporting_doc_url');

  const totalAmount = useMemo(() => {
    if (!watchedExpenses || !Array.isArray(watchedExpenses)) return 0;
    return watchedExpenses.reduce((sum, item) => {
      const val = typeof item?.amount === 'number' ? item.amount : parseFloat(item?.amount as any);
      return sum + (Number.isFinite(val) && val > 0 ? val : 0);
    }, 0);
  }, [watchedExpenses]);

  return {
    form,
    fieldArray,
    watchedType,
    watchedProof,
    watchedDocs,
    watchedExpenses,
    totalAmount,
  };
}
