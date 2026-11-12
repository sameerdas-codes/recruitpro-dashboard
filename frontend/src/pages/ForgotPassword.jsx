import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api";
import "../styles/ForgotPassword.css";

function ForgotPassword() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/accounts/password-reset/", { email });
      setMessage(response.data.message);
    } catch (requestError) {
      console.error("Password reset request failed:", requestError);
      setError("Unable to send a reset link. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen text-white flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-400">RecruitPro</h1>
          <h2 className="text-2xl font-semibold mt-6">Forgot Your Password?</h2>
          <p className="text-gray-400 mt-2">
            Enter your email address and we will send a password reset link.
          </p>
        </div>

        <div className="auth-card rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="professional-form">
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your registered email"
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg outline-none focus:border-green-400 transition"
              />
            </div>

            {message && (
              <p role="status" className="text-green-400 text-sm mb-4">
                {message}
              </p>
            )}
            {error && (
              <p role="alert" className="text-red-400 text-sm mb-4">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-400 text-black py-3 rounded-lg font-semibold hover:bg-green-500 transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-6">
            Remember your password?{" "}
            <Link to="/login" className="text-green-400 hover:text-green-300">
              Back to Login
            </Link>
          </p>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-gray-400 hover:text-green-400 transition">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
