import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useAuth } from "../auth/useAuth";
import { studentService, StudentBootstrapError } from "./services/student.service";
import type {
  StudentBootstrapState,
  StudentAccount,
  StudentCustomer,
  StudentMembership,
  CustomerTier,
  StudentBootstrapPayload,
} from "./types";

type StudentContextType = {
  loading: boolean;
  initialized: boolean;
  bootstrapState: StudentBootstrapState | null;
  studentAccount: StudentAccount | null;
  customer: StudentCustomer | null;
  activeMembership: StudentMembership | null;
  tier: CustomerTier | null;
  latestExpiredMembership: StudentMembership | null;
  error: StudentBootstrapError | null;
  retry: () => void;
};

export const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
  const { session, initialized: authInitialized } = useAuth();

  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const [bootstrapState, setBootstrapState] = useState<StudentBootstrapState | null>(null);
  const [studentAccount, setStudentAccount] = useState<StudentAccount | null>(null);
  const [customer, setCustomer] = useState<StudentCustomer | null>(null);
  const [activeMembership, setActiveMembership] = useState<StudentMembership | null>(null);
  const [tier, setTier] = useState<CustomerTier | null>(null);
  const [latestExpiredMembership, setLatestExpiredMembership] = useState<StudentMembership | null>(
    null,
  );

  const [error, setError] = useState<StudentBootstrapError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const resetState = useCallback(() => {
    setBootstrapState(null);
    setStudentAccount(null);
    setCustomer(null);
    setActiveMembership(null);
    setTier(null);
    setLatestExpiredMembership(null);
    setError(null);
  }, []);

  const loadData = useCallback(
    async (userId: string) => {
      try {
        setLoading(true);
        setError(null);

        const payload = await studentService.getBootstrapData();

        // Ignore if user changed while fetching
        if (!session || session.user.id !== userId) return;

        setBootstrapState(payload.state);
        setStudentAccount(payload.student_account);
        setCustomer(payload.customer);
        setActiveMembership(payload.active_membership);
        setTier(payload.tier);
        setLatestExpiredMembership(payload.latest_expired_membership);
        setInitialized(true);
      } catch (err: any) {
        if (!session || session.user.id !== userId) return;
        setError(err);
        setInitialized(true);
      } finally {
        if (session && session.user.id === userId) {
          setLoading(false);
        }
      }
    },
    [session],
  );

  useEffect(() => {
    let mounted = true;

    if (!authInitialized) {
      // During auth loading
      if (mounted) {
        setLoading(true);
        resetState();
      }
      return;
    }

    if (!session) {
      // Unauthenticated
      if (mounted) {
        setLoading(false);
        setInitialized(true);
        resetState();
      }
      return;
    }

    // Authenticated
    if (mounted) {
      loadData(session.user.id);
    }

    return () => {
      mounted = false;
    };
  }, [authInitialized, session, retryCount, loadData, resetState]);

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  return (
    <StudentContext.Provider
      value={{
        loading,
        initialized,
        bootstrapState,
        studentAccount,
        customer,
        activeMembership,
        tier,
        latestExpiredMembership,
        error,
        retry,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}
