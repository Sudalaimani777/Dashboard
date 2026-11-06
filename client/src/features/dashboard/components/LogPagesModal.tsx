import React, { useState } from 'react';
import { BookOpen, Check, X } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';

interface LogPagesModalProps {
  isOpen: boolean;
  currentPage: number;
  totalPages: number;
  onClose: () => void;
  onSave: (pagesRead: number) => void;
}

export const LogPagesModal: React.FC<LogPagesModalProps> = ({
  isOpen,
  currentPage,
  totalPages,
  onClose,
  onSave,
}) => {
  const [pagesInput, setPagesInput] = useState('20');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(pagesInput, 10);
    if (!isNaN(count) && count > 0) {
      onSave(count);
      setSuccessMessage(`Added ${count} pages to your journal!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B231D]/45 px-4">
      <div className="bg-[#FFFFFF] border border-[#E8DFD3] rounded-xl max-w-sm w-full p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD3]">
          <div className="flex items-center gap-2 text-sm font-bold text-[#2B231D]">
            <BookOpen className="w-4 h-4 text-[#8A582B]" />
            Log Today's Reading
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#756F68] hover:text-[#2B231D] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {successMessage ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#8A582B] text-[#8A582B] flex items-center justify-center mx-auto">
              <Check className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-[#2B231D]">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="text-xs text-[#756F68]">
              Currently on page <strong className="text-[#2B231D]">{currentPage}</strong> of {totalPages}.
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#2B231D]">
                How many pages did you read today?
              </label>
              <input
                type="number"
                min="1"
                max={Math.max(1, totalPages - currentPage)}
                value={pagesInput}
                onChange={(e) => setPagesInput(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#8A582B]"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-1/2 text-xs border-[#E8DFD3] rounded-xl"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-1/2 text-xs bg-[#8A582B] hover:bg-[#754820] text-white rounded-xl"
              >
                Save Progress
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
