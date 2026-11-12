import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Register.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    role: "candidate",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/accounts/register/", {
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        role: formData.role,
        password: formData.password,
      });

      setSuccess("Account created successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      if (err.response?.data) {
        const data = err.response.data;

        if (typeof data === "object") {
          const messages = Object.entries(data)
            .map(([field, message]) => `${field}: ${message}`)
            .join(" ");

          setError(messages);
        } else {
          setError("Registration failed.");
        }
      } else {
        setError("Unable to connect to the server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen text-white flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-lg">

        {/* Heading */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-green-400">RecruitPro</Link>

          <h2 className="text-2xl font-semibold mt-6">
            Create Your Account
          </h2>

          <p className="text-gray-400 mt-2">
            Choose the account type that best matches how you use RecruitPro.
          </p>
        </div>

        {/* Register Card */}
        <div className="auth-card rounded-2xl p-6 sm:p-8">

          <form onSubmit={handleSubmit} className="professional-form">

            {/* Username */}
            <div className="mb-5">
              <label className="block text-sm font-medium mb-2">
                Username
              </label>

              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter username"
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg outline-none focus:border-green-400 transition"
              />
            </div>

            {/* First Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="mb-5">
              <label className="block text-sm font-medium mb-2">
                First Name
              </label>

              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Enter first name"
                
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg outline-none focus:border-green-400 transition"
              />
            </div>

            {/* Last Name */}
            <div className="mb-5">
              <label className="block text-sm font-medium mb-2">
                Last Name
              </label>

              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Enter last name"
                
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg outline-none focus:border-green-400 transition"
              />
            </div>
            </div>

            {/* Email */}
            <div className="mb-5">
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg outline-none focus:border-green-400 transition"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="register-role" className="block text-sm font-medium mb-2">
                I&apos;m joining as
              </label>
              <select
                id="register-role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="register-role-select w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg outline-none focus:border-green-400 transition"
              >
                <option value="candidate">Candidate — find jobs and track applications</option>
                <option value="hr">HR / Recruiter — manage jobs and applicants</option>
                <option value="interviewer">Interviewer — view assigned interviews</option>
              </select>
              <p className="register-role-hint">
                Admin accounts can only be created by an administrator.
              </p>
            </div>

            {/* Password */}
            <div className="mb-5">
              <label className="block text-sm font-medium mb-2">
                Password
              </label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg outline-none focus:border-green-400 transition"
              />
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Confirm Password
              </label>

              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg outline-none focus:border-green-400 transition"
              />
            </div>

            {/* Error */}
            {error && (
              <p role="alert" className="text-red-400 text-sm mb-4">
                {error}
              </p>
            )}

            {/* Success */}
            {success && (
              <p role="status" className="text-green-400 text-sm mb-4">
                {success}
              </p>
            )}

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-400 text-black py-3 rounded-lg font-semibold hover:bg-green-500 transition disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

          </form>

          {/* Login Link */}
          <p className="text-center text-gray-400 mt-6">
            Already have an account?{" "}

            <Link
              to="/login"
              className="text-green-400 hover:text-green-300"
            >
              Login
            </Link>
          </p>

        </div>

        {/* Back to Home */}
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

export default Register;