import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTravel } from '../hooks/useTravel';
import type { RevisionTarget } from '../types/travel.types';

export function useAuditDecision(requestId: string) {
  const navigate = useNavigate();
  const { reviewAsManager, reviewAsAdmin } = useTravel();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const managerApprove = async (remarks: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await reviewAsManager(requestId, { action: 'APPROVE', remarks });
      navigate('/dashboard?tab=present');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Manager approval failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const managerRequestRevision = async (remarks: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await reviewAsManager(requestId, { action: 'REQUEST_REVISION', remarks });
      navigate('/dashboard?tab=present');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Revision request failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const adminClearance = async (action: 'APPROVE' | 'SETTLE', remarks: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await reviewAsAdmin(requestId, { action, remarks });
      navigate('/dashboard?tab=present');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Clearance action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const adminRevision = async (revisionTarget: RevisionTarget, remarks: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await reviewAsAdmin(requestId, { action: 'REQUEST_REVISION', revisionTarget, remarks });
      navigate('/dashboard?tab=present');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Revision dispatch failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    error,
    managerApprove,
    managerRequestRevision,
    adminClearance,
    adminRevision,
  };
}
