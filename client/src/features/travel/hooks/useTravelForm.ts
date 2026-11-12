import { useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TravelType } from '../types/travel.types';

export const travelFormSchema = z.object({
  travel_type: z.enum(['UPCOMING', 'ALREADY_TRAVELLED']),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  purpose: z.string().min(10, 'Business purpose must be at least 10 characters'),
  project_code: z.string(),
  origin: z.string().min(2, 'Origin city is required'),
  destination: z.string().min(2, 'Destination is required'),
  departure_date: z.string().min(1, 'Departure date is required'),
  return_date: z.string().min(1, 'Return date is required'),
  emergency_contact_name: z.string().min(2, 'Emergency contact name is required'),
  emergency_contact_phone: z.string().min(5, 'Emergency contact phone is required'),
  supporting_doc_url: z.string().url('Must be a valid document or receipt URL'),
  expenses: z.array(
    z.object({
      category: z.enum(['FLIGHT', 'HOTEL', 'MEALS_PER_DIEM', 'TRANSIT', 'MISC']),
      merchant: z.string().min(2, 'Merchant required'),
      amount: z.number().positive('Amount must be positive'),
      expenseDate: z.string(),
      notes: z.string().optional(),
    })
  ).min(1, 'At least one expense line item is required'),
});

export type TravelFormValues = z.infer<typeof travelFormSchema>;

export function useTravelForm(initialType: TravelType = 'UPCOMING') {
  const form = useForm<TravelFormValues>({
    resolver: zodResolver(travelFormSchema),
    defaultValues: {
      travel_type: initialType,
      title: '',
      purpose: '',
      project_code: 'ENG-2026',
      origin: 'Bengaluru',
      destination: '',
      departure_date: new Date().toISOString().split('T')[0],
      return_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      emergency_contact_name: 'HR Operations',
      emergency_contact_phone: '+91 9876543210',
      supporting_doc_url: '',
      expenses: [
        {
          category: 'FLIGHT',
          merchant: '',
          amount: 0,
          expenseDate: new Date().toISOString().split('T')[0],
          notes: '',
        },
      ],
    },
  });

  const fieldArray = useFieldArray({
    control: form.control,
    name: 'expenses',
  });

  const watchedExpenses = form.watch('expenses');
  const watchedType = form.watch('travel_type');
  const watchedProof = form.watch('supporting_doc_url');

  const totalAmount = useMemo(() => {
    if (!watchedExpenses || !Array.isArray(watchedExpenses)) return 0;
    return watchedExpenses.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
  }, [watchedExpenses]);

  return {
    form,
    fieldArray,
    watchedType,
    watchedProof,
    totalAmount,
  };
}
