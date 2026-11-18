import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
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

const ALLOWED_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg', 'webp']);

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
  const [isDragging, setIsDragging] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const togglePreview = (docId: string) => {
    setExpandedDocId((prev) => (prev === docId ? null : docId));
  };

  const handleDownload = async (doc: SupportingDoc) => {
    if (!doc.url || downloadingDocId) return;
    try {
      setDownloadingDocId(doc.id);
      const res = await fetch(doc.url);
      if (!res.ok) throw new Error('Direct fetch failed');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = doc.name || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback for cross-origin resources or web links
      const a = document.createElement('a');
      a.href = doc.url;
      a.download = doc.name || 'document';
      a.target = '_blank';
      a.rel = 'noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloadingDocId(null);
    }
  };

  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize supporting_doc_url for legacy backward compatibility whenever docs change
  const syncDocs = useCallback(
    (updated: SupportingDoc[]) => {
      setValue('supporting_docs', updated, { shouldValidate: true, shouldDirty: true });
      setValue('supporting_doc_url', updated[0]?.url || '', { shouldValidate: true, shouldDirty: true });
    },
    [setValue]
  );

  const processFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;

    // Validate size and format
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        setUploadError(`File "${file.name}" is not supported. Allowed formats: PDF, PNG, JPG, WEBP`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds 10MB limit. Please upload a smaller document.`);
        return;
      }
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedDocs: SupportingDoc[] = [];
      for (const file of files) {
        const uploadedDoc = await travelApi.uploadProofFile(file);
        uploadedDocs.push({
          id: uploadedDoc.id || `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'FILE',
          name: uploadedDoc.name || file.name,
          url: uploadedDoc.url,
          format: uploadedDoc.format || file.name.split('.').pop()?.toLowerCase(),
          size: uploadedDoc.size || file.size,
          uploadedAt: new Date().toISOString(),
        });
      }

      syncDocs([...docs, ...uploadedDocs]);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  // Drag-and-drop event handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const handleAddLink = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-xl border transition-all duration-200 bg-surface p-4 flex flex-col gap-3 shadow-2xs relative ${
        isDragging
          ? 'border-2 border-dashed border-primary bg-primary/10 ring-4 ring-primary/20 scale-[1.002]'
          : 'border-border-warm'
      }`}
    >
      {/* Drag Over Overlay Alert */}
      {isDragging && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-primary/10 backdrop-blur-[1px] rounded-xl pointer-events-none border-2 border-dashed border-primary">
          <UploadCloud className="size-10 text-primary animate-bounce mb-2" />
          <span className="text-sm font-bold text-ink">Drop your file(s) here</span>
          <span className="text-xs text-muted font-medium">Instantly uploads PDF, PNG, JPG, or WEBP to Cloudinary</span>
        </div>
      )}

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
            const isExpanded = expandedDocId === doc.id;
            const isDownloading = downloadingDocId === doc.id;

            return (
              <div
                key={doc.id}
                className="flex flex-col p-2.5 rounded-lg bg-surface-subtle/70 border border-border-warm text-xs hover:border-primary/40 transition-colors group"
              >
                <div className="flex items-center justify-between">
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
                    <button
                      type="button"
                      onClick={() => togglePreview(doc.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                        isExpanded
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-primary hover:bg-primary/10'
                      }`}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Hide' : 'Preview'} ${doc.name}`}
                    >
                      <Eye className="size-3" />
                      <span>Preview</span>
                      {isExpanded ? (
                        <ChevronUp className="size-3" />
                      ) : (
                        <ChevronDown className="size-3" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      disabled={isDownloading}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-700 hover:text-ink hover:bg-surface border border-transparent hover:border-border-warm transition-colors cursor-pointer disabled:opacity-50"
                      aria-label={`Download ${doc.name}`}
                    >
                      {isDownloading ? (
                        <Loader2 className="size-3 animate-spin text-primary" />
                      ) : (
                        <Download className="size-3" />
                      )}
                      <span>Download</span>
                    </button>

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

                {/* Smooth In-Page Preview Dropdown */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      key="preview-dropdown"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 mt-2.5 border-t border-border-warm flex flex-col gap-2">
                        {isFile ? (
                          isImg ? (
                            <div className="relative rounded-lg overflow-hidden border border-border-warm bg-surface flex items-center justify-center p-3 max-h-80">
                              <img
                                src={doc.url}
                                alt={doc.name}
                                className="max-h-72 max-w-full rounded object-contain shadow-xs"
                              />
                            </div>
                          ) : (
                            <div className="rounded-lg overflow-hidden border border-border-warm bg-surface h-72 w-full">
                              <iframe
                                src={doc.url}
                                title={doc.name}
                                className="w-full h-full border-0"
                              />
                            </div>
                          )
                        ) : (
                          <div className="rounded-lg border border-border-warm bg-surface p-3.5 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <ExternalLink className="size-4 text-primary shrink-0" />
                              <span className="font-mono text-slate-700 truncate">{doc.url}</span>
                            </div>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shrink-0 transition-colors"
                            >
                              Open External Link <ExternalLink className="size-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-5 rounded-lg border border-dashed border-border-warm bg-surface-subtle/30 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
        >
          <UploadCloud className="size-6 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold text-ink">
            Drag & drop your files here, or <span className="text-primary underline">browse</span>
          </span>
          <span className="text-[11px] text-muted max-w-sm">
            Supports PDF, PNG, JPG, and WEBP (up to 10MB).
          </span>
        </div>
      )}

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,image/png,image/jpeg,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        id="proof-file-input"
      />

      {/* Action Buttons: [+ Upload Document] and [+ Add Web Link] */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-warm bg-surface hover:bg-surface-subtle active:scale-[0.98] text-ink text-xs font-semibold cursor-pointer disabled:opacity-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          {isUploading ? (
            <>
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>Uploading...</span>
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
        <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex flex-col gap-2 mt-1">
          <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <LinkIcon className="size-3.5 text-primary" />
            Attach External Web Link
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input
              type="text"
              placeholder="Document title"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLink();
                }
              }}
              className="sm:col-span-5 px-2.5 py-1.5 rounded-lg border border-border-warm bg-surface text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            <input
              type="url"
              required
              placeholder="https://drive.google.com/..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLink();
                }
              }}
              className="sm:col-span-7 px-2.5 py-1.5 rounded-lg border border-border-warm bg-surface text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddLink(false)}
              className="px-2.5 py-1 rounded-md text-xs font-semibold text-muted hover:text-ink cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleAddLink()}
              className="flex items-center gap-1 px-3 py-1 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold cursor-pointer transition-all"
            >
              <CheckCircle2 className="size-3.5" /> Attach Link
            </button>
          </div>
        </div>
      )}

      {errors?.supporting_docs && (
        <span className="text-[11px] text-destructive font-medium">
          {errors.supporting_docs.message}
        </span>
      )}
    </div>
  );
};
