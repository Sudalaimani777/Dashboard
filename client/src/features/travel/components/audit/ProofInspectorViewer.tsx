// client/src/features/travel/components/audit/ProofInspectorViewer.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ExternalLink,
  FileText,
  AlertCircle,
  Link as LinkIcon,
  Layers,
  Eye,
  EyeOff,
  Download,
  Loader2,
} from 'lucide-react';
import type { SupportingDoc } from '../../types/travel.types';
import { travelApi } from '../../services/travel.api';

export interface ProofInspectorViewerProps {
  proofUrl?: string | null;
  docs?: SupportingDoc[];
  title: string;
}

export const ProofInspectorViewer: React.FC<ProofInspectorViewerProps> = ({
  proofUrl,
  docs,
  title,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const allDocs = useMemo<SupportingDoc[]>(() => {
    if (docs && docs.length > 0) return docs;
    if (proofUrl) {
      return [
        {
          id: 'legacy-1',
          type: 'LINK',
          name: 'Primary Attached Quotation',
          url: proofUrl,
        },
      ];
    }
    return [];
  }, [docs, proofUrl]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const activeDoc = allDocs[selectedIndex] || allDocs[0];
  const activeUrl = activeDoc?.url;

  const isImage = activeUrl
    ? /\.(png|jpe?g|webp|gif|svg)$/i.test(activeUrl) ||
      (activeDoc?.format && ['png', 'jpg', 'jpeg', 'webp'].includes(activeDoc.format.toLowerCase()))
    : false;

  const isCloudinaryPdf = Boolean(
    activeUrl && activeUrl.includes('res.cloudinary.com') && /\.pdf($|\?)/i.test(activeUrl)
  );

  const previewImgUrl = isCloudinaryPdf
    ? activeUrl.replace(/\.pdf($|\?)/i, '.jpg$1')
    : activeDoc?.previewUrl || activeUrl;

  const handleDownload = async () => {
    if (!activeUrl || isDownloading) return;
    try {
      setIsDownloading(true);
      await travelApi.downloadProofFile(activeUrl, activeDoc?.name || 'document');
    } catch {
      // Fallback for cross-origin resources
      const a = document.createElement('a');
      a.href = activeUrl;
      a.download = activeDoc?.name || 'document';
      a.target = '_blank';
      a.rel = 'noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 flex flex-col gap-3.5 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-warm pb-3">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-ink">Attached Proofs & Quotations</h3>
          {/* <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            {allDocs.length} {allDocs.length === 1 ? 'doc' : 'docs'}
          </span> */}
        </div>

        {/* {activeUrl && (
          <a
            href={activeUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-md"
          >
            Open Original <ExternalLink className="size-3.5" />
          </a>
        )} */}
      </div>

      {/* Multi-Document Selector Tabs */}
      {allDocs.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <Layers className="size-3.5 text-muted shrink-0 mr-1" />
          {allDocs.map((doc, idx) => {
            const isSelected = idx === selectedIndex;
            const isFile = doc.type === 'FILE';

            return (
              <button
                key={doc.id || idx}
                type="button"
                onClick={() => {
                  setSelectedIndex(idx);
                  setImgError(false);
                  setShowPreview(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-white shadow-2xs font-semibold'
                    : 'bg-surface-subtle border border-border-warm text-muted hover:text-ink hover:bg-surface'
                }`}
              >
                {isFile ? (
                  <FileText className="size-3.5" />
                ) : (
                  <LinkIcon className="size-3.5" />
                )}
                <span className="truncate max-w-[140px]">{doc.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Document Viewer Panel */}
      {activeDoc ? (
        <div className="flex flex-col gap-2.5">
          {/* Active doc compact metadata bar with Preview toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-surface-subtle border border-border-warm">
            <div className="flex items-center gap-2 min-w-0">
              {activeDoc.type === 'FILE' ? (
                <FileText className="size-4 text-primary shrink-0" />
              ) : (
                <LinkIcon className="size-4 text-emerald-600 shrink-0" />
              )}
              <span className="font-semibold text-xs text-ink truncate max-w-xs md:max-w-md">
                {activeDoc.name}
              </span>
              <span className="font-mono uppercase text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border-warm font-semibold shrink-0">
                {activeDoc.type}
              </span>
              {activeDoc.size ? (
                <span className="text-[10px] text-faint shrink-0">
                  {(activeDoc.size / 1024).toFixed(1)} KB
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeUrl && (
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  aria-label={`Download ${activeDoc.name}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer bg-surface hover:bg-surface-hover text-ink border-border-warm shadow-2xs hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="size-3.5 text-primary animate-spin" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="size-3.5 text-muted hover:text-primary transition-colors" />
                      <span>Download</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowPreview((prev) => !prev)}
                aria-expanded={showPreview}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer bg-surface hover:bg-surface-hover text-ink border-border-warm shadow-2xs hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="size-3.5 text-muted" />
                    <span>Hide Preview</span>
                  </>
                ) : (
                  <>
                    <Eye className="size-3.5 text-primary" />
                    <span>Preview</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Smooth Collapsible preview area with AnimatePresence */}
          <AnimatePresence initial={false}>
            {showPreview ? (
              <motion.div
                key={`preview-${activeDoc.id || selectedIndex}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.25,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="overflow-hidden"
              >
                <div
                  className={`rounded-lg border border-border-warm/80 overflow-hidden bg-surface-subtle flex flex-col items-center justify-center p-3 mt-1 ${
                    (isImage || isCloudinaryPdf) && !imgError ? 'min-h-[260px]' : 'min-h-[150px]'
                  }`}
                >
                  {(isImage || isCloudinaryPdf) && !imgError ? (
                    <div className="flex flex-col items-center w-full">
                      <img
                        src={previewImgUrl}
                        alt={`Proof: ${activeDoc.name} for ${title}`}
                        className="max-h-[380px] w-auto object-contain rounded-md shadow-xs border border-border-warm/50"
                        onError={() => setImgError(true)}
                      />
                      {isCloudinaryPdf && (
                        <div className="mt-2.5 flex items-center justify-between w-full text-[11px] text-muted px-2 border-t border-border-warm/60 pt-2">
                          <span className="flex items-center gap-1 font-medium text-ink">
                            <FileText className="size-3 text-primary" /> Document Page 1 Visual Preview
                          </span>
                          <button
                            type="button"
                            onClick={handleDownload}
                            className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="size-3" /> Download Full PDF
                          </button>
                        </div>
                      )}
                    </div>
                  ) : imgError ? (
                    <div className="flex flex-col items-center gap-2 text-muted p-6 text-center">
                      <AlertCircle className="size-8 text-amber-600" />
                      <span className="text-xs font-semibold text-ink">Preview Unavailable in Frame</span>
                      <span className="text-[11px] text-faint max-w-xs break-all">
                        The file is secured or formatted for external viewing. Use the link below to inspect.
                      </span>
                      <a
                        href={activeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border-warm text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                      >
                        Open in New Window <ExternalLink className="size-3.5" />
                      </a>
                    </div>
                  ) : activeDoc.type === 'FILE' ? (
                    <div className="flex flex-col items-center gap-2 text-muted p-5 text-center">
                      <FileText className="size-8 text-primary/70" />
                      <span className="text-xs font-semibold text-ink">PDF Quotation / Receipt Document</span>
                      <span className="text-[11px] text-faint max-w-xs break-all">{activeDoc.name}</span>
                      <div className="mt-1 flex items-center gap-2">
                        <a
                          href={activeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors shadow-2xs"
                        >
                          View Full PDF <ExternalLink className="size-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={handleDownload}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border-warm text-xs font-semibold text-ink hover:bg-surface-subtle transition-colors"
                        >
                          <Download className="size-3.5 text-primary" /> Download
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted p-5 text-center">
                      <LinkIcon className="size-8 text-emerald-600" />
                      <span className="text-xs font-semibold text-ink">Attached External Web Link</span>
                      <span className="text-[11px] text-faint max-w-xs truncate">{activeUrl}</span>
                      <a
                        href={activeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface border border-border-warm text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                      >
                        Open External Link <ExternalLink className="size-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : (
        <div className="h-40 rounded-lg border border-dashed border-border-warm bg-surface-subtle/40 flex flex-col items-center justify-center gap-1.5 text-xs text-faint">
          <FileText className="size-5 text-muted/50" />
          <span>No proof documents attached to this travel request.</span>
        </div>
      )}
    </div>
  );
};
