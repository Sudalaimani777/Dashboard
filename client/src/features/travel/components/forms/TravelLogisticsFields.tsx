import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { TravelFormValues } from '../../hooks/useTravelForm';

export interface TravelLogisticsFieldsProps {
  register: UseFormRegister<TravelFormValues>;
  errors: FieldErrors<TravelFormValues>;
}

export const TravelLogisticsFields: React.FC<TravelLogisticsFieldsProps> = ({
  register,
  errors,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Title */}
      <div className="md:col-span-2 flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#2B231D]">
          Trip Title <span className="text-[#9E2A2B]">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Tokyo Architecture Integration 2026"
          {...register('title')}
          className="w-full bg-white border border-[#E8DFD3] rounded-xl px-3.5 py-2.5 text-xs text-[#2B231D] focus:outline-none focus:border-[#8A582B]"
        />
        {errors.title && <span className="text-[11px] text-[#9E2A2B]">{errors.title.message}</span>}
      </div>

      {/* Purpose */}
      <div className="md:col-span-2 flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#2B231D]">
          Business Purpose & Justification <span className="text-[#9E2A2B]">*</span>
        </label>
        <textarea
          rows={2}
          placeholder="Detailed business necessity justifying corporate travel..."
          {...register('purpose')}
          className="w-full bg-white border border-[#E8DFD3] rounded-xl px-3.5 py-2 text-xs text-[#2B231D] focus:outline-none focus:border-[#8A582B]"
        />
        {errors.purpose && <span className="text-[11px] text-[#9E2A2B]">{errors.purpose.message}</span>}
      </div>

      {/* Project Code */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#2B231D]">Project Code</label>
        <input
          type="text"
          placeholder="e.g. ENG-APAC-2026"
          {...register('project_code')}
          className="w-full bg-white border border-[#E8DFD3] rounded-xl px-3.5 py-2.5 text-xs text-[#2B231D] focus:outline-none focus:border-[#8A582B]"
        />
      </div>

      {/* Destination */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#2B231D]">Destination <span className="text-[#9E2A2B]">*</span></label>
        <input
          type="text"
          placeholder="e.g. Tokyo, Japan"
          {...register('destination')}
          className="w-full bg-white border border-[#E8DFD3] rounded-xl px-3.5 py-2.5 text-xs text-[#2B231D] focus:outline-none focus:border-[#8A582B]"
        />
        {errors.destination && <span className="text-[11px] text-[#9E2A2B]">{errors.destination.message}</span>}
      </div>

      {/* Origin */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#2B231D]">Origin City <span className="text-[#9E2A2B]">*</span></label>
        <input
          type="text"
          placeholder="e.g. Bengaluru, India"
          {...register('origin')}
          className="w-full bg-white border border-[#E8DFD3] rounded-xl px-3.5 py-2.5 text-xs text-[#2B231D] focus:outline-none focus:border-[#8A582B]"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#2B231D]">Departure</label>
          <input
            type="date"
            {...register('departure_date')}
            className="w-full bg-white border border-[#E8DFD3] rounded-xl px-2 py-2 text-xs text-[#2B231D] focus:outline-none focus:border-[#8A582B]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#2B231D]">Return</label>
          <input
            type="date"
            {...register('return_date')}
            className="w-full bg-white border border-[#E8DFD3] rounded-xl px-2 py-2 text-xs text-[#2B231D] focus:outline-none focus:border-[#8A582B]"
          />
        </div>
      </div>
    </div>
  );
};
