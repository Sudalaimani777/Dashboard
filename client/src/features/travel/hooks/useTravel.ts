// client/src/features/travel/hooks/useTravel.ts
import { useContext } from 'react';
import { TravelContext, type TravelContextType } from '../context/TravelContext';

export function useTravel(): TravelContextType {
  const context = useContext(TravelContext);
  if (!context) {
    throw new Error('useTravel must be used within a TravelProvider');
  }
  return context;
}
