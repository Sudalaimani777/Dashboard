// client/src/features/travel/services/travel.api.ts
import axios, { isAxiosError, type AxiosInstance } from 'axios';
import type {
  ApiResponse,
  TravelRequest,
  CreateTravelRequestInput,
  ManagerReviewInput,
  AdminReviewInput,
  ResubmitRequestInput,
  DepartmentBudget,
  TravelStatus,
} from '../types/travel.types';

const API_BASE_URL = 'http://localhost:5000/api';

export const travelApiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

class TravelApiService {
  private handleError(err: unknown, defaultMessage: string): never {
    if (isAxiosError(err)) {
      const responseData = err.response?.data as ApiResponse | undefined;
      const message = responseData?.message || err.message || defaultMessage;
      throw new Error(message);
    }
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(defaultMessage);
  }

  /**
   * Submit new travel request with itemized expenses & receipt/quotation proof.
   */
  async createRequest(input: CreateTravelRequestInput): Promise<TravelRequest> {
    try {
      const res = await travelApiClient.post<ApiResponse<TravelRequest>>('/travel/requests', input);
      return res.data.data;
    } catch (err) {
      this.handleError(err, 'Failed to submit travel request');
    }
  }

  /**
   * Fetch current authenticated user's travel requests (or scoped requests).
   */
  async getMyRequests(statusFilter?: TravelStatus): Promise<TravelRequest[]> {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await travelApiClient.get<ApiResponse<TravelRequest[]>>('/travel/requests', { params });
      return res.data.data;
    } catch (err) {
      this.handleError(err, 'Failed to fetch travel requests');
    }
  }

  /**
   * Fetch single request details with expenses and timeline audit ledger.
   */
  async getRequestById(id: string): Promise<TravelRequest> {
    try {
      const res = await travelApiClient.get<ApiResponse<TravelRequest>>(`/travel/requests/${id}`);
      return res.data.data;
    } catch (err) {
      this.handleError(err, `Failed to fetch travel request ${id}`);
    }
  }

  /**
   * Tier 1 Manager audit queue.
   */
  async getManagerQueue(): Promise<TravelRequest[]> {
    try {
      const res = await travelApiClient.get<ApiResponse<TravelRequest[]>>('/travel/manager-queue');
      return res.data.data;
    } catch (err) {
      this.handleError(err, 'Failed to fetch manager audit queue');
    }
  }

  /**
   * Tier 1 Manager review action (APPROVE, REVISE, REJECT).
   */
  async submitManagerReview(id: string, input: ManagerReviewInput): Promise<TravelRequest> {
    try {
      const res = await travelApiClient.post<ApiResponse<TravelRequest>>(
        `/travel/requests/${id}/manager-review`,
        input
      );
      return res.data.data;
    } catch (err) {
      this.handleError(err, 'Failed to record manager review');
    }
  }

  /**
   * Tier 2 Admin executive governance queue.
   */
  async getAdminQueue(): Promise<TravelRequest[]> {
    try {
      const res = await travelApiClient.get<ApiResponse<TravelRequest[]>>('/travel/admin-queue');
      return res.data.data;
    } catch (err) {
      this.handleError(err, 'Failed to fetch admin governance queue');
    }
  }

  /**
   * Tier 2 Admin clearance & payout settlement action.
   */
  async submitAdminReview(id: string, input: AdminReviewInput): Promise<TravelRequest> {
    try {
      const res = await travelApiClient.post<ApiResponse<TravelRequest>>(
        `/travel/requests/${id}/admin-review`,
        input
      );
      return res.data.data;
    } catch (err) {
      this.handleError(err, 'Failed to record admin governance action');
    }
  }

  /**
   * Employee alteration resubmission.
   * INVARIANT: Strictly returns to PENDING_MANAGER_REVIEW.
   */
  async resubmitRequest(id: string, input: ResubmitRequestInput): Promise<TravelRequest> {
    try {
      const res = await travelApiClient.post<ApiResponse<TravelRequest>>(
        `/travel/requests/${id}/resubmit`,
        input
      );
      return res.data.data;
    } catch (err) {
      this.handleError(err, 'Failed to resubmit travel request');
    }
  }

  /**
   * Cancels request by requester.
   */
  async cancelRequest(id: string, remarks?: string): Promise<TravelRequest> {
    try {
      const res = await travelApiClient.post<ApiResponse<TravelRequest>>(
        `/travel/requests/${id}/cancel`,
        { remarks }
      );
      return res.data.data;
    } catch (err) {
      this.handleError(err, 'Failed to cancel travel request');
    }
  }

  /**
   * Department budget allocation and real-time available headroom.
   */
  async getDepartmentBudget(department = 'Engineering', year = 2026, quarter = 'Q4'): Promise<DepartmentBudget> {
    try {
      const res = await travelApiClient.get<ApiResponse<DepartmentBudget>>('/travel/budgets', {
        params: { department, year, quarter },
      });
      return res.data.data;
    } catch (err) {
      this.handleError(err, 'Failed to fetch department budget');
    }
  }
}

export const travelApi = new TravelApiService();
