import React from 'react';
import { ArrowRight } from 'lucide-react';

export interface RouteLabelProps {
  origin?: string | null;
  destination?: string | null;
  className?: string;
}

/**
 * Renders a normalized trip route using an icon separator instead of raw glyph characters.
 */
export const RouteLabel: React.FC<RouteLabelProps> = ({ origin, destination, className = '' }) => {
  const hasOrigin = Boolean(origin && origin !== 'TBD');
  const destLabel = destination && destination !== 'TBD' ? destination : destination || 'TBD';

  if (!hasOrigin) {
    return <span className={className}>{destLabel}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      <span>{origin}</span>
      <ArrowRight className="size-3 text-faint shrink-0" aria-hidden="true" />
      <span>{destLabel}</span>
    </span>
  );
};
