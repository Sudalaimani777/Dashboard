import React from 'react';
import { Paperclip, ExternalLink, FileCheck } from 'lucide-react';
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
  const label = isCase1 ? 'Tax Invoice / Payment Receipt Proof' : 'Booking Quotation / Itinerary Proof';
  const placeholder = isCase1 ? 'https://proofs.corp.com/receipt-oct.png' : 'https://proofs.corp.com/flight-quote.pdf';

  return (
    <div className="rounded-lg border border-border-warm bg-surface-subtle/50 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
          <Paperclip className="size-3.5 text-primary" />
          {label} <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted font-medium px-2 py-0.5 rounded-md bg-surface border border-border-warm/70">
            PDF, PNG, JPG
          </span>
        </div>
      </div>

      <div className="relative">
        <input
          type="url"
          placeholder={placeholder}
          {...register('supporting_doc_url')}
          className={`w-full bg-surface border rounded-lg px-3.5 py-2.5 text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all ${
            errors.supporting_doc_url ? 'border-destructive/40 bg-destructive/5' : 'border-border-warm'
          }`}
        />
      </div>

      {proofUrlValue ? (
        <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border-warm text-xs">
          <div className="flex items-center gap-2 truncate text-muted text-[11px]">
            <FileCheck className="size-3.5 text-emerald-700 shrink-0" />
            <span className="truncate max-w-xs">{proofUrlValue}</span>
          </div>
          <a
            href={proofUrlValue}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 shrink-0 ml-2"
          >
            Preview <ExternalLink className="size-3" />
          </a>
        </div>
      ) : (
        <p className="text-[11px] text-muted flex items-center gap-1.5">
          Corporate audit requires itemized receipts showing VAT/GST merchant breakdown.
        </p>
      )}

      {errors.supporting_doc_url && (
        <span className="text-[11px] text-destructive font-medium">
          {errors.supporting_doc_url.message}
        </span>
      )}
    </div>
  );
};
