import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if the user logged in with a password or OAuth
  const isPasswordAuth = user?.app_metadata?.provider === 'email' || 
                         !user?.identities?.some(identity => 
                           ['google', 'github', 'facebook'].includes(identity.provider)
                         );

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await signOut();
      if (error) {
        setError(error.message);
        return;
      }
      // Redirect to login page after sign out
      navigate('/login');
    } catch (err) {
      setError('Failed to sign out');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">User Profile</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4 mx-auto">
          <span className="text-2xl text-blue-500">{user?.email?.[0].toUpperCase()}</span>
        </div>
        
        <div className="text-center">
          <p className="text-lg font-medium">{user?.email}</p>
          <p className="text-sm text-gray-600 mt-1">
            Account created: {user?.created_at && new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <div className="grid gap-4">
        {/* Only show Change Password button for password-based accounts */}
        {isPasswordAuth && (
          <button
            type="button"
            onClick={() => navigate('/reset-password')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Change Password
          </button>
        )}
        
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isLoading}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {isLoading ? 'Signing Out...' : 'Sign Out'}
        </button>
      </div>
    </div>
  );
};

export default UserProfile; 