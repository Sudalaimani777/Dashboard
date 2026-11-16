// client/src/features/travel/components/audit/ProofInspectorViewer.tsx
import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  FileText,
  AlertCircle,
  Link as LinkIcon,
  Layers,
} from 'lucide-react';
import type { SupportingDoc } from '../../types/travel.types';

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

  const activeDoc = allDocs[selectedIndex] || allDocs[0];
  const activeUrl = activeDoc?.url;

  const isImage = activeUrl
    ? /\.(png|jpe?g|webp|gif|svg)$/i.test(activeUrl) ||
      (activeDoc?.format && ['png', 'jpg', 'jpeg', 'webp'].includes(activeDoc.format.toLowerCase()))
    : false;

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 flex flex-col gap-3.5 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-warm pb-3">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-ink">Attached Proofs & Quotations</h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            {allDocs.length} {allDocs.length === 1 ? 'doc' : 'docs'}
          </span>
        </div>

        {activeUrl && (
          <a
            href={activeUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-md"
          >
            Open Original <ExternalLink className="size-3.5" />
          </a>
        )}
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
        <div className="flex flex-col gap-2">
          {/* Active doc metadata strip */}
          <div className="flex items-center justify-between text-[11px] text-muted px-1">
            <span className="font-semibold text-ink truncate max-w-sm">{activeDoc.name}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono uppercase text-[9px] px-1.5 py-0.5 rounded bg-surface-subtle border border-border-warm font-semibold">
                {activeDoc.type}
              </span>
              {activeDoc.size ? (
                <span className="text-[10px] text-faint">
                  {(activeDoc.size / 1024).toFixed(1)} KB
                </span>
              ) : null}
            </div>
          </div>

          <div
            className={`rounded-lg border border-border-warm/80 overflow-hidden bg-surface-subtle flex items-center justify-center p-3 ${
              isImage && !imgError ? 'min-h-[260px]' : 'min-h-[150px]'
            }`}
          >
            {isImage && !imgError ? (
              <img
                src={activeUrl}
                alt={`Proof: ${activeDoc.name} for ${title}`}
                className="max-h-[380px] w-auto object-contain rounded-md"
                onError={() => setImgError(true)}
              />
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
                <a
                  href={activeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors shadow-2xs"
                >
                  View Full PDF <ExternalLink className="size-3.5" />
                </a>
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
