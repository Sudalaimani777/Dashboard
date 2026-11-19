import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { TravelFormValues } from '../../hooks/useTravelForm';
import { getLocalDateString } from '../../hooks/useTravelForm';
import type { TravelType } from '../../types/travel.types';
import { PhoneInputWithCountry } from './PhoneInputWithCountry';

export interface TravelLogisticsFieldsProps {
  register: UseFormRegister<TravelFormValues>;
  errors: FieldErrors<TravelFormValues>;
  travelType?: TravelType;
  departureDate?: string;
  returnDate?: string;
  phoneValue?: string;
  onPhoneChange?: (val: string) => void;
  onPhoneBlur?: () => void;
}

export const TravelLogisticsFields: React.FC<TravelLogisticsFieldsProps> = ({
  register,
  errors,
  travelType = 'UPCOMING',
  departureDate,
  returnDate,
  phoneValue,
  onPhoneChange,
  onPhoneBlur,
}) => {
  const todayStr = React.useMemo(() => getLocalDateString(), []);

  const departureMin = travelType === 'UPCOMING' ? todayStr : undefined;
  const departureMax =
    travelType === 'ALREADY_TRAVELLED'
      ? returnDate && returnDate < todayStr
        ? returnDate
        : todayStr
      : returnDate || undefined;

  const returnMin =
    travelType === 'UPCOMING'
      ? departureDate && departureDate > todayStr
        ? departureDate
        : todayStr
      : departureDate || undefined;
  const returnMax = travelType === 'ALREADY_TRAVELLED' ? todayStr : undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Title */}
      <div className="md:col-span-2 flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-ink">
          Trip Title <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter trip title"
          {...register('title')}
          className="w-full bg-surface border border-border-warm rounded-lg px-3.5 py-2.5 text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
        />
        {errors.title && <span className="text-[11px] text-destructive">{errors.title.message}</span>}
      </div>

      {/* Purpose */}
      <div className="md:col-span-2 flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-ink">
          Business Purpose & Justification <span className="text-destructive">*</span>
        </label>
        <textarea
          rows={2}
          placeholder="Explain business necessity and travel justification"
          {...register('purpose')}
          className="w-full bg-surface border border-border-warm rounded-lg px-3.5 py-2 text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
        />
        {errors.purpose && <span className="text-[11px] text-destructive">{errors.purpose.message}</span>}
      </div>

      {/* Project Code */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-ink">
          Project Code <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. ENG-2026, PROJ-APAC"
          {...register('project_code', {
            onChange: (e) => {
              if (e.target.value) {
                e.target.value = e.target.value.toUpperCase();
              }
            },
          })}
          className="w-full bg-surface border border-border-warm rounded-lg px-3.5 py-2.5 text-xs text-ink font-mono uppercase placeholder:text-faint placeholder:normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
        />
        {errors.project_code && <span className="text-[11px] text-destructive">{errors.project_code.message}</span>}
      </div>

      {/* Destination */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-ink">Destination <span className="text-destructive">*</span></label>
        <input
          type="text"
          placeholder="Enter destination city"
          {...register('destination')}
          className="w-full bg-surface border border-border-warm rounded-lg px-3.5 py-2.5 text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
        />
        {errors.destination && <span className="text-[11px] text-destructive">{errors.destination.message}</span>}
      </div>

      {/* Origin */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-ink">Origin City <span className="text-destructive">*</span></label>
        <input
          type="text"
          placeholder="Enter origin city"
          {...register('origin')}
          className="w-full bg-surface border border-border-warm rounded-lg px-3.5 py-2.5 text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
        />
        {errors.origin && <span className="text-[11px] text-destructive">{errors.origin.message}</span>}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ink">Departure <span className="text-destructive">*</span></label>
          <input
            type="date"
            min={departureMin}
            max={departureMax}
            {...register('departure_date')}
            className="w-full bg-surface border border-border-warm rounded-lg px-2.5 py-2 text-xs text-ink font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all cursor-pointer"
          />
          {errors.departure_date && <span className="text-[11px] text-destructive">{errors.departure_date.message}</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ink">Return <span className="text-destructive">*</span></label>
          <input
            type="date"
            min={returnMin}
            max={returnMax}
            {...register('return_date')}
            className="w-full bg-surface border border-border-warm rounded-lg px-2.5 py-2 text-xs text-ink font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all cursor-pointer"
          />
          {errors.return_date && <span className="text-[11px] text-destructive">{errors.return_date.message}</span>}
        </div>
      </div>

      {/* Emergency Contact Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-ink">
          Emergency Contact Name <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          placeholder="Full name of emergency contact"
          {...register('emergency_contact_name')}
          className="w-full bg-surface border border-border-warm rounded-lg px-3.5 py-2.5 text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
        />
        {errors.emergency_contact_name && (
          <span className="text-[11px] text-destructive">{errors.emergency_contact_name.message}</span>
        )}
      </div>

      {/* Emergency Contact Phone */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="emergency-contact-phone" className="text-xs font-semibold text-ink">
          Emergency Contact Phone <span className="text-destructive">*</span>
        </label>
        {onPhoneChange ? (
          <PhoneInputWithCountry
            id="emergency-contact-phone"
            value={phoneValue || ''}
            onChange={onPhoneChange}
            onBlur={onPhoneBlur}
            error={errors.emergency_contact_phone?.message}
          />
        ) : (
          <input
            id="emergency-contact-phone"
            type="tel"
            placeholder="Enter phone number"
            {...register('emergency_contact_phone')}
            className="w-full bg-surface border border-border-warm rounded-lg px-3.5 py-2.5 text-xs text-ink font-mono placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
          />
        )}
        {errors.emergency_contact_phone && (
          <span className="text-[11px] text-destructive">{errors.emergency_contact_phone.message}</span>
        )}
      </div>
    </div>
  );
};
