import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Process the URL to extract the auth info
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error in auth callback:', error);
          setError(error.message);
          return;
        }
        
        if (!data.session) {
          // If no session, try to exchange the code for a session
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const queryParams = new URLSearchParams(window.location.search);
          
          // Check if there's a refresh token or access token in the URL
          const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
          const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
          
          if (refreshToken) {
            const { error: refreshError } = await supabase.auth.refreshSession({
              refresh_token: refreshToken,
            });
            
            if (refreshError) {
              setError(refreshError.message);
              return;
            }
          } else if (!data.session) {
            setError('Authentication failed. No session was created.');
            return;
          }
        }
        
        // Successfully authenticated
        navigate('/');
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        setError('An unexpected error occurred during authentication');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto mt-10">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-bold mb-4 text-center">Authentication Error</h2>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/login')}
              className="text-blue-500 hover:text-blue-700"
            >
              Return to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback; 