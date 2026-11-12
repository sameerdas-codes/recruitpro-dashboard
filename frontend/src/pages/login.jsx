import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/accounts/login/", {
        username: formData.username,
        password: formData.password,
      });

      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);

      const userResponse = await api.get("/accounts/me/");

      const user = userResponse.data;

      if (user.role === "hr" || user.role === "admin") {
        navigate("/dashboard");
      } else if (user.role === "candidate") {
        navigate("/candidate-dashboard");
      } else if (user.role === "interviewer") {
        navigate("/interviewer-dashboard");
      } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setError("Invalid user role.");
      }
    } catch (err) {
      console.error("Login Error:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Invalid username or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen text-white flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-green-400">
            RecruitPro
          </Link>

          <h2 className="text-2xl font-semibold mt-6">
            Welcome Back
          </h2>

          <p className="text-gray-400 mt-2">
            Login to your recruitment dashboard
          </p>
        </div>

        <div className="auth-card rounded-2xl p-6 sm:p-8">

          <form onSubmit={handleSubmit} className="professional-form">

            <div className="mb-5">
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>

              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg outline-none focus:border-green-400 transition"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>

              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg outline-none focus:border-green-400 transition"
              />
            </div>

            <div className="text-right mb-6">
              <Link
                to="/forgot-password"
                className="text-sm text-green-400 hover:text-green-300"
              >
                Forgot Password?
              </Link>
            </div>

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
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          <p className="text-center text-gray-400 mt-6">
            Don't have an account?{" "}

            <Link
              to="/register"
              className="text-green-400 hover:text-green-300"
            >
              Create Account
            </Link>
          </p>

        </div>

        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-gray-400 hover:text-green-400 transition"
          >
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Login;