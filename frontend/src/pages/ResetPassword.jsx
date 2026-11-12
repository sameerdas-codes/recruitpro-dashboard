import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "../styles/ResetPassword.css";

function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/accounts/password-reset/confirm/", {
        uid,
        token,
        password,
      });
      navigate("/login", { replace: true });
    } catch (requestError) {
      console.error("Password reset failed:", requestError);
      const passwordErrors = requestError.response?.data?.password;
      setError(
        Array.isArray(passwordErrors)
          ? passwordErrors.join(" ")
          : requestError.response?.data?.detail ||
              "This reset link is invalid or expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen text-white flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-400">RecruitPro</h1>
          <h2 className="text-2xl font-semibold mt-6">Set a New Password</h2>
        </div>

        <div className="auth-card rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="professional-form">
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
              className="w-full px-4 py-3 mb-5 bg-slate-900 border border-slate-700 rounded-lg"
            />

            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium mb-2"
            >
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
              className="w-full px-4 py-3 mb-5 bg-slate-900 border border-slate-700 rounded-lg"
            />

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
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-6">
            <Link to="/login" className="text-green-400 hover:text-green-300">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
