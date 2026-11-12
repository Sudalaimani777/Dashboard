import React, { useState } from 'react';
import { ExternalLink, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';

export interface ProofInspectorViewerProps {
  proofUrl?: string | null;
  title: string;
}

export const ProofInspectorViewer: React.FC<ProofInspectorViewerProps> = ({ proofUrl, title }) => {
  const [imgError, setImgError] = useState(false);
  const isImage = proofUrl ? /\.(png|jpe?g|webp|gif|svg)$/i.test(proofUrl) : false;

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 flex flex-col gap-3 shadow-xs">
      <div className="flex items-center justify-between border-b border-border-warm pb-3">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
          <FileText className="size-4 text-primary" /> Attached Proof Inspector
        </h3>
        {proofUrl && (
          <a
            href={proofUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-md"
          >
            Open Original <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>

      {proofUrl ? (
        <div className="rounded-xl border border-border-warm overflow-hidden bg-surface-subtle min-h-[280px] flex items-center justify-center p-2">
          {isImage && !imgError ? (
            <img
              src={proofUrl}
              alt={`Proof for ${title}`}
              className="max-h-[380px] w-auto object-contain rounded-lg shadow-xs"
              onError={() => setImgError(true)}
            />
          ) : imgError ? (
            <div className="flex flex-col items-center gap-2 text-muted p-6 text-center">
              <AlertCircle className="size-8 text-amber-600" />
              <span className="text-xs font-semibold text-ink">External Image Preview Unavailable</span>
              <span className="text-[11px] text-faint max-w-xs break-all">
                The image couldn't be loaded directly in this browser frame. Use the link above to inspect it.
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted p-6 text-center">
              <ImageIcon className="size-8 text-faint" />
              <span className="text-xs font-semibold text-ink">Document / PDF Attachment</span>
              <span className="text-[11px] text-faint max-w-xs break-all">{proofUrl}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="h-44 rounded-xl border border-dashed border-border-warm flex flex-col items-center justify-center gap-1.5 text-xs text-faint">
          <FileText className="size-6 text-muted/40" />
          <span>No proof document attached to this request.</span>
        </div>
      )}
    </div>
  );
};
