import React, { useState, useRef } from 'react';
import {
  Paperclip,
  UploadCloud,
  Link as LinkIcon,
  Plus,
  Trash2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { UseFormSetValue } from 'react-hook-form';
import type { TravelType, SupportingDoc } from '../../types/travel.types';
import type { TravelFormValues } from '../../hooks/useTravelForm';
import { travelApi } from '../../services/travel.api';

export interface ProofAttachmentFieldProps {
  travelType: TravelType;
  setValue: UseFormSetValue<TravelFormValues>;
  docs?: SupportingDoc[];
  errors?: any;
  proofUrlValue?: string;
}

export const ProofAttachmentField: React.FC<ProofAttachmentFieldProps> = ({
  travelType,
  setValue,
  docs = [],
  errors,
  proofUrlValue,
}) => {
  const isCase1 = travelType === 'ALREADY_TRAVELLED';
  const label = isCase1 ? 'Tax Invoices & Payment Receipts' : 'Booking Quotations & Itinerary Proofs';

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize supporting_doc_url for legacy backward compatibility whenever docs change
  const syncDocs = (updated: SupportingDoc[]) => {
    setValue('supporting_docs', updated, { shouldValidate: true, shouldDirty: true });
    setValue('supporting_doc_url', updated[0]?.url || '', { shouldValidate: true, shouldDirty: true });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit. Please upload a smaller document.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedDoc = await travelApi.uploadProofFile(file);
      const newDoc: SupportingDoc = {
        id: uploadedDoc.id || `doc-${Date.now()}`,
        type: 'FILE',
        name: uploadedDoc.name || file.name,
        url: uploadedDoc.url,
        format: uploadedDoc.format,
        size: uploadedDoc.size || file.size,
        uploadedAt: new Date().toISOString(),
      };
      syncDocs([...docs, newDoc]);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    let validUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = `https://${validUrl}`;
    }

    const newDoc: SupportingDoc = {
      id: `link-${Date.now()}`,
      type: 'LINK',
      name: linkTitle.trim() || 'Online Document / Booking Link',
      url: validUrl,
      uploadedAt: new Date().toISOString(),
    };

    syncDocs([...docs, newDoc]);
    setLinkTitle('');
    setLinkUrl('');
    setShowAddLink(false);
    setUploadError(null);
  };

  const handleRemoveDoc = (id: string) => {
    syncDocs(docs.filter((d) => d.id !== id));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Effective docs including single legacy proofUrl fallback if list is empty
  const displayDocs: SupportingDoc[] =
    docs.length > 0
      ? docs
      : proofUrlValue
      ? [
          {
            id: 'legacy-init',
            type: 'LINK',
            name: 'Primary Attached Quotation',
            url: proofUrlValue,
          },
        ]
      : [];

  return (
    <div className="rounded-xl border border-border-warm bg-surface p-4 flex flex-col gap-3 shadow-2xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-border-warm">
        <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
          <Paperclip className="size-3.5 text-primary" />
          {label} <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center gap-1.5 text-[11px] text-muted">
          <span className="font-mono tabular-nums font-semibold text-ink">{displayDocs.length}</span> attached
        </div>
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span className="truncate">{uploadError}</span>
        </div>
      )}

      {/* Attached Documents List */}
      {displayDocs.length > 0 ? (
        <div className="flex flex-col gap-2">
          {displayDocs.map((doc) => {
            const isFile = doc.type === 'FILE';
            const isImg = doc.format && ['png', 'jpg', 'jpeg', 'webp'].includes(doc.format.toLowerCase());

            return (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-surface-subtle/70 border border-border-warm text-xs hover:border-primary/40 transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-md bg-surface border border-border-warm text-primary shrink-0">
                    {isFile ? (
                      isImg ? <ImageIcon className="size-4 text-primary" /> : <FileText className="size-4 text-primary" />
                    ) : (
                      <LinkIcon className="size-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-ink truncate text-xs">{doc.name}</span>
                    <div className="flex items-center gap-2 text-[10px] text-muted">
                      <span className="font-mono uppercase font-semibold text-[9px] px-1.5 py-0.2 rounded bg-surface border border-border-warm">
                        {doc.type}
                      </span>
                      {doc.size ? <span>{formatFileSize(doc.size)}</span> : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-primary hover:bg-primary/10 transition-colors"
                  >
                    View <ExternalLink className="size-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveDoc(doc.id)}
                    aria-label={`Remove document ${doc.name}`}
                    className="p-1.5 rounded-md text-faint hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    title="Remove attachment"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 rounded-lg border border-dashed border-border-warm bg-surface-subtle/30 flex flex-col items-center justify-center gap-1.5 text-center">
          <UploadCloud className="size-5 text-muted/60" />
          <span className="text-xs font-medium text-ink">No proofs attached yet</span>
          <span className="text-[11px] text-muted max-w-sm">
            Attach official quotations, airline itineraries, or tax invoices. You can upload local files or add web links.
          </span>
        </div>
      )}

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg,image/webp"
        onChange={handleFileUpload}
        className="hidden"
        id="proof-file-input"
      />

      {/* Action Buttons: [+ Upload Document] and [+ Add Web Link] */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-warm bg-surface hover:bg-surface-subtle active:scale-[0.98] text-ink text-xs font-semibold cursor-pointer disabled:opacity-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          {isUploading ? (
            <>
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>Uploading to Cloudinary...</span>
            </>
          ) : (
            <>
              <UploadCloud className="size-3.5 text-primary" />
              <span>Upload Document (PDF/Image)</span>
            </>
          )}
        </button>

        <button
          type="button"
          disabled={isUploading}
          onClick={() => setShowAddLink(!showAddLink)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-primary text-primary text-xs font-semibold hover:bg-primary/10 active:scale-[0.98] cursor-pointer disabled:opacity-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          <Plus className="size-3.5" />
          <span>Add Web Link</span>
        </button>
      </div>

      {/* Inline Web Link Form */}
      {showAddLink && (
        <form
          onSubmit={handleAddLink}
          className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex flex-col gap-2 mt-1"
        >
          <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <LinkIcon className="size-3.5 text-primary" />
            Attach External Web Link
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input
              type="text"
              placeholder="Document title (e.g. Google Drive Itinerary)"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              className="sm:col-span-5 px-2.5 py-1.5 rounded-lg border border-border-warm bg-surface text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            <input
              type="url"
              required
              placeholder="https://drive.google.com/..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="sm:col-span-7 px-2.5 py-1.5 rounded-lg border border-border-warm bg-surface text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddLink(false)}
              className="px-2.5 py-2 rounded-md text-xs font-semibold text-muted hover:text-ink cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold cursor-pointer transition-all"
            >
              <CheckCircle2 className="size-3.5" /> Attach Link
            </button>
          </div>
        </form>
      )}

      {errors?.supporting_docs && (
        <span className="text-[11px] text-destructive font-medium">
          {errors.supporting_docs.message}
        </span>
      )}
    </div>
  );
};
