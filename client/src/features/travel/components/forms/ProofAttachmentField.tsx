import React from 'react';
import { Paperclip, ExternalLink } from 'lucide-react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { TravelType } from '../../types/travel.types';
import type { TravelFormValues } from '../../hooks/useTravelForm';

export interface ProofAttachmentFieldProps {
  travelType: TravelType;
  register: UseFormRegister<TravelFormValues>;
  errors: FieldErrors<TravelFormValues>;
  proofUrlValue?: string;
}

export const ProofAttachmentField: React.FC<ProofAttachmentFieldProps> = ({
  travelType,
  register,
  errors,
  proofUrlValue,
}) => {
  const isCase1 = travelType === 'ALREADY_TRAVELLED';
  const label = isCase1 ? 'Tax Invoice / Payment Receipt Proof URL' : 'Booking Quotation / Itinerary Reference URL';
  const placeholder = isCase1 ? 'https://proofs.corp.com/receipt-oct.png' : 'https://proofs.corp.com/flight-quote.pdf';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#2B231D] flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-[#8A582B]" />
          {label} <span className="text-[#9E2A2B]">*</span>
        </label>
        {proofUrlValue && (
          <a
            href={proofUrlValue}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-semibold text-[#8A582B] hover:underline flex items-center gap-1"
          >
            Preview Proof <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <input
        type="url"
        placeholder={placeholder}
        {...register('supporting_doc_url')}
        className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-[#2B231D] placeholder:text-[#A0988E] focus:outline-none focus:border-[#8A582B] ${
          errors.supporting_doc_url ? 'border-red-300 bg-red-50/20' : 'border-[#E8DFD3]'
        }`}
      />
      {errors.supporting_doc_url && (
        <span className="text-[11px] text-[#9E2A2B] font-medium">
          {errors.supporting_doc_url.message}
        </span>
      )}
    </div>
  );
};
