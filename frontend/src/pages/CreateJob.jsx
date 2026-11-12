import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import "../styles/CreateJob.css";

function CreateJob() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    salary: "",
    job_type: "Full Time",
    description: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/jobs/", formData);

      toast.success("Job Created Successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Error creating job");
    }
  };

  return (
    <div className="app-page text-white flex justify-center items-center p-5 sm:p-8">

      <div className="app-card p-6 sm:p-9 rounded-2xl w-full max-w-3xl">

        <button type="button" onClick={() => navigate("/dashboard")} className="text-sm text-slate-400 hover:text-green-300 mb-6">
          ← Back to dashboard
        </button>
        <p className="text-xs uppercase tracking-[0.2em] text-green-300 font-semibold">Hiring workspace</p>
        <h1 className="text-3xl font-bold text-white mt-2">Create a new role</h1>
        <p className="text-slate-400 mt-2 mb-8">Add the details candidates need to decide if this opportunity is right for them.</p>

        <form onSubmit={handleSubmit} className="professional-form">

          <label className="block text-sm text-slate-300 mb-5">Job title
          <input
            type="text"
            name="title"
            placeholder="Job Title"
            value={formData.title}
            onChange={handleChange}
            className="mt-2"
            required
          />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-sm text-slate-300 mb-5">Company
          <input
            type="text"
            name="company"
            placeholder="Company"
            value={formData.company}
            onChange={handleChange}
            className="mt-2"
            required
          />
          </label>

          <label className="block text-sm text-slate-300 mb-5">Location
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
            className="mt-2"
            required
          />
          </label>

          <label className="block text-sm text-slate-300 mb-5">Salary (INR)
          <input
            type="number"
            name="salary"
            placeholder="Salary"
            value={formData.salary}
            onChange={handleChange}
            className="mt-2"
            required
          />
          </label>
          </div>

          <label className="block text-sm text-slate-300 mb-5">Employment type
          <select
            name="job_type"
            value={formData.job_type}
            onChange={handleChange}
            className="mt-2"
          >
            <option>Full Time</option>
            <option>Part Time</option>
            <option>Internship</option>
            <option>Remote</option>
          </select>
          </label>

          <label className="block text-sm text-slate-300 mb-6">Job description
          <textarea
            name="description"
            rows="5"
            placeholder="Job Description"
            value={formData.description}
            onChange={handleChange}
            className="mt-2"
            required
          />
          </label>

          <button
            type="submit"
            className="w-full sm:w-auto bg-green-500 px-7 py-3 rounded-xl font-semibold hover:bg-green-600 transition"
          >
            Create Job
          </button>

        </form>

      </div>

    </div>
  );
}

export default CreateJob;