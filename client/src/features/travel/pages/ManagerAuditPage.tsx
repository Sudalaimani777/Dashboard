import React from 'react';
import { Navigate, useParams, useLocation } from 'react-router-dom';

/**
 * @deprecated Manager reviews now run in-situ inside TravelDetailPage (/travel/requests/:id).
 */
export const ManagerAuditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  return <Navigate to={`/travel/requests/${id}${location.search}`} replace />;
};
