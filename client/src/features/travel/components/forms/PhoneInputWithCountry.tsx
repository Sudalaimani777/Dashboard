import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import {
  splitPhoneNumber,
  filterCountries,
  type CountryDialCode,
} from '../../utils/countryDialCodes';

export interface PhoneInputWithCountryProps {
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  id?: string;
}

const CountryFlagBadge: React.FC<{ code: string; name: string }> = ({ code, name }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <span className="font-mono text-[10px] font-bold px-1 py-0.2 rounded bg-surface-subtle border border-border-warm text-muted shrink-0">
        {code}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w80/${code.toLowerCase()}.png 2x`}
      width="20"
      height="14"
      alt={name}
      loading="lazy"
      onError={() => setHasError(true)}
      className="w-5 h-3.5 object-cover rounded-[2px] shadow-2xs shrink-0 border border-black/10"
    />
  );
};

export const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
  value,
  onChange,
  onBlur,
  disabled = false,
  error,
  id = 'emergency-contact-phone',
}) => {
  const parsed = useMemo(() => splitPhoneNumber(value), [value]);

  const [selectedCountry, setSelectedCountry] = useState<CountryDialCode>(parsed.country);
  const [nationalNumber, setNationalNumber] = useState<string>(parsed.nationalNumber);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Synchronize when value changes externally (e.g. clone or form reset)
  useEffect(() => {
    const updated = splitPhoneNumber(value);
    setSelectedCountry(updated.country);
    setNationalNumber(updated.nationalNumber);
  }, [value]);

  // Click outside to dismiss country dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const filteredCountries = useMemo(
    () => filterCountries(searchQuery),
    [searchQuery]
  );

  const handleCountrySelect = (country: CountryDialCode) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery('');
    const full = nationalNumber ? `${country.dialCode} ${nationalNumber}` : country.dialCode;
    onChange(full);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and spaces
    const cleaned = e.target.value.replace(/[^\d\s]/g, '');
    setNationalNumber(cleaned);
    const full = cleaned ? `${selectedCountry.dialCode} ${cleaned}` : selectedCountry.dialCode;
    onChange(full);
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      {/* Compound Input Box */}
      <div
        className={`flex items-center rounded-lg border bg-surface transition-all ${
          error
            ? 'border-destructive focus-within:ring-2 focus-within:ring-destructive/20 focus-within:border-destructive'
            : 'border-border-warm focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {/* Country Selector Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label="Select country code"
          className="flex items-center gap-1.5 px-3 py-2.5 border-r border-border-warm bg-surface-subtle/50 hover:bg-surface-subtle rounded-l-lg text-xs font-semibold text-ink cursor-pointer transition-colors shrink-0 focus-visible:outline-none"
        >
          <CountryFlagBadge code={selectedCountry.code} name={selectedCountry.name} />
          <span className="font-mono text-xs">{selectedCountry.dialCode}</span>
          <ChevronDown
            className={`size-3 text-muted transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Local Number Input */}
        <input
          id={id}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={nationalNumber}
          onChange={handleNumberChange}
          onBlur={onBlur}
          placeholder={selectedCountry.placeholder}
          className="w-full bg-transparent px-3 py-2.5 text-xs font-mono text-ink placeholder:text-faint focus-visible:outline-none rounded-r-lg"
        />
      </div>

      {/* Country Selection Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Country list"
          className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 bg-surface rounded-xl border border-border-warm shadow-xl z-50 flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {/* Search Header */}
          <div className="p-2 border-b border-border-warm bg-surface-subtle/40">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 size-3.5 text-faint pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country or code..."
                aria-label="Search country dial codes"
                className="w-full bg-surface border border-border-warm rounded-lg pl-8 pr-7 py-1.5 text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 p-0.5 rounded text-faint hover:text-ink cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Countries List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-border-warm/40 py-1">
            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted">
                No country found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.code === selectedCountry.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors cursor-pointer hover:bg-surface-subtle ${
                      isSelected ? 'bg-primary/5 font-semibold text-primary' : 'text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate mr-2">
                      <CountryFlagBadge code={c.code} name={c.name} />
                      <span className="truncate">{c.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[11px] text-muted">{c.dialCode}</span>
                      {isSelected && <Check className="size-3.5 text-primary" />}
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
