// client/src/features/travel/context/TravelContext.tsx
import React, { createContext, useCallback, useState } from 'react';
import { travelApi } from '../services/travel.api';
import type {
  TravelRequest,
  CreateTravelRequestInput,
  ManagerReviewInput,
  AdminReviewInput,
  ResubmitRequestInput,
  DepartmentBudget,
  TravelStatus,
} from '../types/travel.types';

export interface TravelContextType {
  requests: TravelRequest[];
  selectedRequest: TravelRequest | null;
  managerQueue: TravelRequest[];
  adminQueue: TravelRequest[];
  budget: DepartmentBudget | null;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  // Actions
  loadRequests: (statusFilter?: TravelStatus) => Promise<void>;
  loadRequestDetails: (id: string) => Promise<TravelRequest>;
  loadManagerQueue: () => Promise<void>;
  loadAdminQueue: () => Promise<void>;
  loadBudget: (department?: string, year?: number, quarter?: string) => Promise<void>;
  createRequest: (input: CreateTravelRequestInput) => Promise<TravelRequest>;
  reviewAsManager: (id: string, input: ManagerReviewInput) => Promise<TravelRequest>;
  reviewAsAdmin: (id: string, input: AdminReviewInput) => Promise<TravelRequest>;
  resubmitRequest: (id: string, input: ResubmitRequestInput) => Promise<TravelRequest>;
  cancelRequest: (id: string, remarks?: string) => Promise<TravelRequest>;
}

export const TravelContext = createContext<TravelContextType | undefined>(undefined);

export const TravelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  const [managerQueue, setManagerQueue] = useState<TravelRequest[]>([]);
  const [adminQueue, setAdminQueue] = useState<TravelRequest[]>([]);
  const [budget, setBudget] = useState<DepartmentBudget | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const loadRequests = useCallback(async (statusFilter?: TravelStatus) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await travelApi.getMyRequests(statusFilter);
      setRequests(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load travel requests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadRequestDetails = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await travelApi.getRequestById(id);
      setSelectedRequest(data);
      return data;
    } catch (err: any) {
      const msg = err.message || 'Failed to load request details';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadManagerQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await travelApi.getManagerQueue();
      setManagerQueue(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load manager queue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAdminQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await travelApi.getAdminQueue();
      setAdminQueue(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin queue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadBudget = useCallback(async (department = 'Engineering', year = 2026, quarter = 'Q4') => {
    try {
      const data = await travelApi.getDepartmentBudget(department, year, quarter);
      setBudget(data);
    } catch (err: any) {
      // Non-fatal if budget not configured yet
      console.warn('Could not load department budget:', err.message);
    }
  }, []);

  const createRequest = useCallback(async (input: CreateTravelRequestInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const created = await travelApi.createRequest(input);
      setRequests((prev) => [created, ...prev]);
      return created;
    } catch (err: any) {
      const msg = err.message || 'Failed to create travel request';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reviewAsManager = useCallback(async (id: string, input: ManagerReviewInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await travelApi.submitManagerReview(id, input);
      setManagerQueue((prev) => prev.filter((r) => r.id !== id));
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (selectedRequest?.id === id) {
        setSelectedRequest(updated);
      }
      return updated;
    } catch (err: any) {
      const msg = err.message || 'Manager review failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedRequest?.id]);

  const reviewAsAdmin = useCallback(async (id: string, input: AdminReviewInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await travelApi.submitAdminReview(id, input);
      setAdminQueue((prev) => prev.filter((r) => r.id !== id));
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (selectedRequest?.id === id) {
        setSelectedRequest(updated);
      }
      return updated;
    } catch (err: any) {
      const msg = err.message || 'Admin review failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedRequest?.id]);

  const resubmitRequest = useCallback(async (id: string, input: ResubmitRequestInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await travelApi.resubmitRequest(id, input);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (selectedRequest?.id === id) {
        setSelectedRequest(updated);
      }
      return updated;
    } catch (err: any) {
      const msg = err.message || 'Resubmission failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedRequest?.id]);

  const cancelRequest = useCallback(async (id: string, remarks?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await travelApi.cancelRequest(id, remarks);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (selectedRequest?.id === id) {
        setSelectedRequest(updated);
      }
      return updated;
    } catch (err: any) {
      const msg = err.message || 'Cancellation failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedRequest?.id]);

  return (
    <TravelContext.Provider
      value={{
        requests,
        selectedRequest,
        managerQueue,
        adminQueue,
        budget,
        isLoading,
        error,
        clearError,
        loadRequests,
        loadRequestDetails,
        loadManagerQueue,
        loadAdminQueue,
        loadBudget,
        createRequest,
        reviewAsManager,
        reviewAsAdmin,
        resubmitRequest,
        cancelRequest,
      }}
    >
      {children}
    </TravelContext.Provider>
  );
};
