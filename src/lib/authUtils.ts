import { supabase } from "@/integrations/supabase/client";

/**
 * Check if the current user has admin role
 */
export const checkAdminStatus = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { data } = await supabase.functions.invoke("check-admin", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    return data?.isAdmin || false;
  } catch (error) {
    console.error("Admin check error:", error);
    return false;
  }
};

/**
 * Get current user session
 */
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

/**
 * Get current user ID
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  const session = await getCurrentSession();
  return session?.user?.id || null;
};
