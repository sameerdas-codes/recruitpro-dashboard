import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import "../styles/EditJob.css";

function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    salary: "",
    job_type: "Full Time",
    description: "",
  });

  const fetchJob = useCallback(async () => {
    try {
      const response = await api.get(`/jobs/${id}/`);

      setFormData({
        title: response.data.title,
        company: response.data.company,
        location: response.data.location,
        salary: response.data.salary,
        job_type: response.data.job_type,
        description: response.data.description,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load job");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.put(`/jobs/${id}/`, formData);

      toast.success("Job Updated Successfully!");

      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      toast.error("Failed to update job");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <h1 className="text-2xl">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="app-page text-white flex justify-center items-center p-5 sm:p-8">
      <div className="app-card p-6 sm:p-9 rounded-2xl w-full max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="text-sm text-slate-400 hover:text-green-300 mb-6"
        >
          ← Back to dashboard
        </button>
        <p className="text-xs uppercase tracking-[0.2em] text-green-300 font-semibold">
          Hiring workspace
        </p>
        <h1 className="text-3xl font-bold text-white mt-2 mb-8">
          Edit job listing
        </h1>

        <form onSubmit={handleSubmit} className="professional-form">
          <label className="block text-sm text-slate-300 mb-5">
            Job title
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="mt-2"
              required
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-sm text-slate-300 mb-5">
              Company
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="mt-2"
                required
              />
            </label>

            <label className="block text-sm text-slate-300 mb-5">
              Location
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="mt-2"
                required
              />
            </label>

            <label className="block text-sm text-slate-300 mb-5">
              Salary (INR)
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                className="mt-2"
                required
              />
            </label>
          </div>

          <label className="block text-sm text-slate-300 mb-5">
            Employment type
            <select
              name="job_type"
              value={formData.job_type}
              onChange={handleChange}
              className="mt-2"
            >
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
              <option value="Internship">Internship</option>
              <option value="Remote">Remote</option>
            </select>
          </label>

          <label className="block text-sm text-slate-300 mb-6">
            Job description
            <textarea
              name="description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              className="mt-2"
              required
        />                                           
          </label>

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green-500 py-3 rounded-xl font-semibold hover:bg-green-600 transition disabled:opacity-50"
            >
              {submitting ? "Saving changes..." : "Save changes"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex-1 border border-slate-600 py-3 rounded-xl font-semibold hover:bg-slate-700 transition"
            >
              Cancel
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

export default EditJob;