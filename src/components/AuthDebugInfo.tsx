import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const AuthDebugInfo: React.FC = () => {
  const { user, session, isLoading } = useAuth();
  const [supabaseTest, setSupabaseTest] = useState<{
    foods: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const testSupabase = async () => {
      try {
        const { data, error } = await supabase.from("foods").select("*");
        setSupabaseTest({
          foods: data?.length || 0,
          error: error?.message,
        });
      } catch (err) {
        setSupabaseTest({
          foods: 0,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    };

    testSupabase();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded text-xs max-w-xs">
      <div>
        <strong>Auth Debug:</strong>
      </div>
      <div>Loading: {isLoading ? "Yes" : "No"}</div>
      <div>User: {user?.email || "None"}</div>
      <div>Session: {session ? "Yes" : "No"}</div>
      <div>Foods: {supabaseTest?.foods || 0}</div>
      {supabaseTest?.error && (
        <div className="text-red-300">Error: {supabaseTest.error}</div>
      )}
      <div>Env: {import.meta.env.VITE_SUPABASE_URL ? "OK" : "Missing"}</div>
    </div>
  );
};

export default AuthDebugInfo;
