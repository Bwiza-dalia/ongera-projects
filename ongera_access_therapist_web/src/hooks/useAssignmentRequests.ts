import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  approveRequest,
  listIncomingRequests,
  rejectRequest,
  type AssignmentRequest,
} from '../services/assignmentService';
import { resolveTherapistProfileId } from '../services/therapistService';
import { displayName } from '../types/auth';

export function useAssignmentRequests() {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState<AssignmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !user) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const profileId = await resolveTherapistProfileId(token, user.id, displayName(user));
      setRequests(await listIncomingRequests(token, profileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(requestId: string) {
    if (!token) return;
    setActingId(requestId);
    setError('');
    try {
      await approveRequest(token, requestId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setActingId(null);
    }
  }

  async function reject(requestId: string) {
    if (!token) return;
    setActingId(requestId);
    setError('');
    try {
      await rejectRequest(token, requestId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setActingId(null);
    }
  }

  const pending = requests.filter((r) => r.status.toUpperCase() === 'PENDING');

  return {
    requests,
    pending,
    isLoading,
    error,
    actingId,
    reload: load,
    approve,
    reject,
  };
}
