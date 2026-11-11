import React from 'react';
import { ExternalLink, FileText, Image as ImageIcon } from 'lucide-react';

export interface ProofInspectorViewerProps {
  proofUrl?: string | null;
  title: string;
}

export const ProofInspectorViewer: React.FC<ProofInspectorViewerProps> = ({ proofUrl, title }) => {
  const isImage = proofUrl ? /\.(png|jpe?g|webp|gif|svg)$/i.test(proofUrl) : false;

  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] p-5 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E8DFD3] pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#756F68] flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#8A582B]" /> Attached Proof Inspector
        </h3>
        {proofUrl && (
          <a
            href={proofUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-[#8A582B] hover:underline flex items-center gap-1"
          >
            Open Original <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {proofUrl ? (
        <div className="rounded-xl border border-[#E8DFD3] overflow-hidden bg-[#FAF8F5] min-h-[280px] flex items-center justify-center p-2">
          {isImage ? (
            <img
              src={proofUrl}
              alt={`Proof for ${title}`}
              className="max-h-[380px] w-auto object-contain rounded-lg shadow-xs"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#756F68] p-6 text-center">
              <ImageIcon className="w-8 h-8 text-[#A0988E]" />
              <span className="text-xs font-semibold">Document / PDF Attachment</span>
              <span className="text-[11px] text-[#A0988E] max-w-xs break-all">{proofUrl}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="h-44 rounded-xl border border-dashed border-[#E8DFD3] flex items-center justify-center text-xs text-[#A0988E]">
          No proof document attached to this request.
        </div>
      )}
    </div>
  );
};
