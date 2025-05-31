import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { FaGoogle, FaGithub, FaUser } from "react-icons/fa";
import { OAuthProvider } from "../services/AuthService";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<OAuthProvider | null>(
    null
  );

  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [shouldNavigateAfterAuth, setShouldNavigateAfterAuth] = useState(false);

  const { signIn, signInWithOAuth, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();

  // Effect to handle navigation after successful authentication
  useEffect(() => {
    if (shouldNavigateAfterAuth && user && !authLoading) {
      console.log("Auth context updated, navigating to diary...");
      navigate("/diary");
      setShouldNavigateAfterAuth(false);
    }
  }, [user, authLoading, shouldNavigateAfterAuth, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setError(error.message);
        return;
      }

      // Successfully logged in, redirect to home
      navigate("/");
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setError(null);
    setIsOAuthLoading(provider);

    try {
      const { error } = await signInWithOAuth(provider);

      if (error) {
        setError(`Error with ${provider} login: ${error.message}`);
        setIsOAuthLoading(null);
      }

      // No need to navigate - the OAuth redirect will handle this
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
      setIsOAuthLoading(null);
    }
  };

  const handleDemoLogin = async () => {
    // Don't proceed if auth context is still loading
    if (authLoading) {
      setError(
        "Authentication system is still loading. Please wait a moment and try again."
      );
      return;
    }

    setError(null);
    setIsDemoLoading(true);

    // Demo credentials
    const demoEmail = "mac@mac.com";
    const demoPassword = "macapple";

    console.log("Demo login attempt starting...");

    try {
      const { error } = await signIn(demoEmail, demoPassword);

      if (error) {
        console.error("Demo login error:", error);
        console.error("Error details:", {
          message: error.message,
          name: error.name || "unknown",
        });
        setError(`Demo login failed: ${error.message}`);
        return;
      }

      console.log(
        "Demo login successful, waiting for auth context to update..."
      );

      // Set flag to navigate once auth context updates
      setShouldNavigateAfterAuth(true);
    } catch (err) {
      console.error("Demo login unexpected error:", err);
      setError("An unexpected error occurred during demo login");
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-10">
      <div className="flex justify-center items-center mb-4">
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={authLoading || isOAuthLoading !== null || isDemoLoading}
          className="flex justify-center items-center bg-green-600 border border-green-700 rounded-md px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaUser className="mr-2" />
          {authLoading
            ? "Initializing..."
            : isDemoLoading
            ? "Logging in..."
            : "Try Demo User"}
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Log In</h2>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              {isLoading ? "Logging in..." : "Log In"}
            </button>
          </div>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-600">Or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-4">
            <button
              type="button"
              onClick={() => handleOAuthLogin("google")}
              disabled={isOAuthLoading !== null || isDemoLoading}
              className="flex justify-center items-center bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaGoogle className="mr-2" />
              {isOAuthLoading === "google"
                ? "Connecting..."
                : "Continue with Google"}
            </button>

            <button
              type="button"
              onClick={() => handleOAuthLogin("github")}
              disabled={isOAuthLoading !== null || isDemoLoading}
              className="flex justify-center items-center bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <FaGithub className="mr-2" />
              {isOAuthLoading === "github"
                ? "Connecting..."
                : "Continue with GitHub"}
            </button>
          </div>

          <div className="text-center mt-4">
            <Link
              to="/forgot-password"
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              Forgot password?
            </Link>
          </div>

          <div className="text-center mt-6 text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-500 hover:text-blue-700">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
