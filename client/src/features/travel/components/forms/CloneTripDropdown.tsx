import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Copy, Search, X, ChevronDown, MapPin, Calendar, Check } from 'lucide-react';
import type { TravelRequest } from '../../types/travel.types';
import { filterClonableTrips } from '../../utils/cloneTripSearch';
import { formatINR } from '../../utils/currency';

export interface CloneTripDropdownProps {
  trips: TravelRequest[];
  onSelectTrip: (tripId: string) => void;
  disabled?: boolean;
  className?: string;
}

export const CloneTripDropdown: React.FC<CloneTripDropdownProps> = ({
  trips,
  onSelectTrip,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter clonable trips based on user query
  const filteredTrips = useMemo(
    () => filterClonableTrips(trips, searchQuery),
    [trips, searchQuery]
  );

  // Handle outside click dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      // Short delay for DOM render
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    setSearchQuery('');
  };

  const handleSelect = (tripId: string) => {
    setSelectedId(tripId);
    onSelectTrip(tripId);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Clone details from a past trip"
        className={`flex items-center gap-2 bg-surface hover:bg-surface-subtle border border-border-warm rounded-lg px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <Copy className="size-3.5 text-primary shrink-0" />
        <span className="truncate max-w-[180px] sm:max-w-[220px]">
          {selectedId
            ? trips.find((t) => t.id === selectedId)?.title || 'Clone from past trip...'
            : 'Clone from past trip...'}
        </span>
        <ChevronDown
          className={`size-3.5 text-muted transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Past trips to clone"
          className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 max-w-[90vw] bg-surface rounded-xl border border-border-warm shadow-xl z-50 flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {/* Sticky Search Header */}
          <div className="p-2.5 border-b border-border-warm bg-surface-subtle/40">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 size-3.5 text-faint pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, destination, project..."
                aria-label="Search past trips"
                className="w-full bg-surface border border-border-warm rounded-lg pl-8 pr-8 py-1.5 text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                  className="absolute right-2.5 p-0.5 rounded text-faint hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between pt-1.5 px-1 text-[11px] text-muted">
              <span>{filteredTrips.length} trip{filteredTrips.length === 1 ? '' : 's'} available</span>
              {searchQuery && <span>Filtered by &quot;{searchQuery}&quot;</span>}
            </div>
          </div>

          {/* Trips List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-border-warm/60 py-1">
            {filteredTrips.length === 0 ? (
              <div className="py-8 px-4 text-center flex flex-col items-center justify-center gap-1.5">
                <Search className="size-6 text-faint/60" />
                <p className="text-xs font-semibold text-ink">No trips found</p>
                <p className="text-[11px] text-muted max-w-[220px]">
                  {searchQuery
                    ? `No past trips match "${searchQuery}". Try a different keyword.`
                    : 'You do not have any past trips to clone yet.'}
                </p>
              </div>
            ) : (
              filteredTrips.map((trip) => {
                const isCurrent = trip.id === selectedId;
                return (
                  <button
                    key={trip.id}
                    type="button"
                    onClick={() => handleSelect(trip.id)}
                    className={`w-full text-left px-3.5 py-2.5 flex flex-col gap-1 transition-colors cursor-pointer hover:bg-surface-subtle/80 ${
                      isCurrent ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-ink truncate flex-1">
                        {trip.title}
                      </span>
                      {trip.totalExpenses && Number(trip.totalExpenses) > 0 ? (
                        <span className="text-[11px] font-mono font-medium text-primary shrink-0">
                          {formatINR(Number(trip.totalExpenses))}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                      <span className="inline-flex items-center gap-1 shrink-0">
                        <MapPin className="size-3 text-faint" />
                        <span className="font-medium text-ink">{trip.destination}</span>
                      </span>

                      {trip.departureDate && (
                        <span className="inline-flex items-center gap-1 shrink-0 font-mono text-[10px]">
                          <Calendar className="size-3 text-faint" />
                          <span>{trip.departureDate}</span>
                        </span>
                      )}

                      {trip.projectCode && (
                        <span className="px-1.5 py-0.2 rounded bg-surface-subtle border border-border-warm/60 font-mono text-[10px] text-faint shrink-0">
                          {trip.projectCode}
                        </span>
                      )}

                      {isCurrent && (
                        <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-primary font-medium">
                          <Check className="size-3" /> Cloned
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
