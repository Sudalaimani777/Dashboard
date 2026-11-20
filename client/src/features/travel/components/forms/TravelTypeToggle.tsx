import React from 'react';
import { Receipt, PlaneTakeoff } from 'lucide-react';
import type { TravelType } from '../../types/travel.types';
import { RubberSegment } from '../../../../shared/components/ui/RubberSegment';

export interface TravelTypeToggleProps {
  value: TravelType;
  onChange: (type: TravelType) => void;
  className?: string;
}

export const TravelTypeToggle: React.FC<TravelTypeToggleProps> = ({ value, onChange, className = '' }) => {
  return (
    <div className={`w-full flex-col sm:flex-row ${className}`}>
      <RubberSegment
        aria-label="Travel request category"
        variant="surface"
        size="md"
        value={value}
        onChange={(val) => onChange(val as TravelType)}
        equalSlots
        className="w-full"
        items={[
          {
            value: 'UPCOMING',
            label: 'Upcoming Travel (Pre-Trip)',
            icon: <PlaneTakeoff className="size-4 text-primary" />,
          },
          {
            value: 'ALREADY_TRAVELLED',
            label: 'Reimbursement (Post-Trip)',
            icon: <Receipt className="size-4 text-primary" />,
          },
        ]}
      />
    </div>
  );
};
