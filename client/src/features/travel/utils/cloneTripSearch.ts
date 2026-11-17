import type { TravelRequest } from '../types/travel.types';

/**
 * Filters a list of travel requests for the clone dropdown:
 * - Excludes DRAFT requests (only completed, submitted, or approved trips are clonable).
 * - Performs case-insensitive matching across title, destination, origin, and projectCode.
 */
export function filterClonableTrips(
  trips: TravelRequest[],
  searchQuery: string
): TravelRequest[] {
  if (!Array.isArray(trips)) return [];

  // Filter out drafts first
  const clonable = trips.filter((t) => t && t.status !== 'DRAFT');

  const query = searchQuery ? searchQuery.trim().toLowerCase() : '';
  if (!query) return clonable;

  return clonable.filter((t) => {
    const titleMatch = t.title ? t.title.toLowerCase().includes(query) : false;
    const destMatch = t.destination ? t.destination.toLowerCase().includes(query) : false;
    const originMatch = t.origin ? t.origin.toLowerCase().includes(query) : false;
    const projectMatch = t.projectCode ? t.projectCode.toLowerCase().includes(query) : false;
    return titleMatch || destMatch || originMatch || projectMatch;
  });
}
