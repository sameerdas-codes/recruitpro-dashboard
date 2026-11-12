import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaCheckCircle, FaFilePdf, FaUpload } from "react-icons/fa";
import api from "../services/api";
import { toast } from "react-toastify";
import "../styles/ApplyJob.css";

function ApplyJob() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [resume, setResume] = useState(null);
  const [useProfileResume, setUseProfileResume] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Job Details
  const fetchJob = useCallback(async () => {
    try {
      const response = await api.get(`/jobs/${id}/`);
      setJob(response.data);
    } catch (error) {
      console.error("Error fetching job:", error);
      toast.error("Job not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  useEffect(() => {
    let active = true;
    api
      .get("/accounts/me/")
      .then((response) => {
        if (active) {
          setCandidateProfile(response.data);
          setUseProfileResume(Boolean(response.data.default_resume));
        }
      })
      .catch((error) => {
        console.error("Error fetching candidate profile:", error);
        if (active) {
          toast.error("Could not load your profile resume. Please upload a resume to apply.");
        }
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Resume Select
  const handleResumeChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      setResume(null);
      return;
    }

    // Only PDF allowed
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF resume");
      e.target.value = "";
      setResume(null);
      return;
    }

    // Maximum 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resume size must be less than 5MB");
      e.target.value = "";
      setResume(null);
      return;
    }

    setResume(file);
  };

  // Submit Application
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!useProfileResume && !resume) {
      toast.error("Please upload your resume");
      return;
    }
    if (useProfileResume && !candidateProfile?.default_resume) {
      toast.error("Your profile does not have a default resume. Upload a resume to apply.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("job", id);
      if (!useProfileResume) formData.append("resume", resume);
      formData.append("cover_letter", coverLetter);

      await api.post("/applications/", formData);

      toast.success("Application submitted successfully!");

      // Redirect to Candidate Dashboard
      setTimeout(() => {
        navigate("/candidate-dashboard");
      }, 1000);
    } catch (error) {
      console.error(
        "Application Error:",
        error.response?.data || error
      );

      if (error.response?.data) {
        const data = error.response.data;

        if (typeof data === "object") {
          const messages = Object.entries(data)
            .map(([field, message]) => {
              return `${field}: ${message}`;
            })
            .join(" ");

          toast.error(messages);
        } else {
          toast.error("Failed to submit application");
        }
      } else {
        toast.error("Unable to connect to server");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (loading || profileLoading) {
    return (
      <div className="app-page min-h-screen text-white flex items-center justify-center">
        <h1 className="text-xl">
          Loading job details...
        </h1>
      </div>
    );
  }

  // Job Not Found
  if (!job) {
    return (
      <div className="app-page min-h-screen text-white flex flex-col items-center justify-center">

        <h1 className="text-3xl font-bold text-red-400">
          Job Not Found
        </h1>

        <button
          onClick={() => navigate("/candidate-dashboard")}
          className="mt-6 bg-green-500 px-5 py-2 rounded-lg hover:bg-green-600"
        >
          Back to Jobs
        </button>

      </div>
    );
  }

  return (
    <div className="app-page min-h-screen text-white p-5 sm:p-8">

      <div className="max-w-3xl mx-auto">

        {/* Back Button */}
        <button
          onClick={() => navigate("/candidate-dashboard")}
          className="text-gray-400 hover:text-green-400 mb-6"
        >
          ← Back to Jobs
        </button>

        {/* Job Details */}
        <div className="app-card rounded-2xl p-6 sm:p-8">

          <h1 className="text-4xl font-bold text-green-400">
            {job.title}
          </h1>

          <div className="mt-6 space-y-2">

            <p>
              <strong>Company:</strong>{" "}
              {job.company}
            </p>

            <p>
              <strong>Location:</strong>{" "}
              {job.location}
            </p>

            <p>
              <strong>Salary:</strong>{" "}
              ₹{job.salary}
            </p>

            <p>
              <strong>Job Type:</strong>{" "}
              {job.job_type}
            </p>

          </div>

          <div className="mt-6">

            <h2 className="text-xl font-semibold">
              Job Description
            </h2>

            <p className="text-gray-400 mt-2 whitespace-pre-line">
              {job.description}
            </p>

          </div>

        </div>


        {/* Application Form */}
        <div className="app-card rounded-2xl p-6 sm:p-8 mt-6">

          <h2 className="text-3xl font-bold">
            Apply for this Job
          </h2>

          <form
            onSubmit={handleSubmit}
            className="professional-form mt-8"
          >

            <div className="application-resume-section">
              <div className="application-resume-heading">
                <p>Resume for this application</p>
                <span>PDF · Up to 5 MB</span>
              </div>

              <div className="application-resume-options">
                {candidateProfile?.default_resume && (
                  <label className={`application-resume-option${useProfileResume ? " is-selected" : ""}`}>
                    <input
                      type="radio"
                      name="resume-choice"
                      checked={useProfileResume}
                      onChange={() => setUseProfileResume(true)}
                    />
                    <span className="application-resume-icon"><FaFilePdf /></span>
                    <span className="application-resume-option-copy">
                      <strong>Profile resume</strong>
                      <span>{decodeURIComponent(candidateProfile.default_resume.split("/").pop())}</span>
                    </span>
                    <span className="application-resume-badge">Default</span>
                    {useProfileResume && <FaCheckCircle className="application-resume-check" />}
                  </label>
                )}

                <label className={`application-resume-option${!useProfileResume ? " is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="resume-choice"
                    checked={!useProfileResume}
                    onChange={() => setUseProfileResume(false)}
                  />
                  <span className="application-resume-icon"><FaUpload /></span>
                  <span className="application-resume-option-copy">
                    <strong>{candidateProfile?.default_resume ? "Use a different resume" : "Upload your resume"}</strong>
                    <span>{resume ? resume.name : "Choose a PDF file from your device"}</span>
                  </span>
                  {!useProfileResume && <FaCheckCircle className="application-resume-check" />}
                </label>
              </div>

              {candidateProfile?.default_resume && (
                <a
                  href={candidateProfile.default_resume}
                  target="_blank"
                  rel="noreferrer"
                  className="application-resume-view"
                >
                  <FaFilePdf /> Preview profile resume
                </a>
              )}

              {!useProfileResume && (
                <div className="application-resume-upload">
                  <label htmlFor="resume">Select a resume (PDF)</label>
                  <input
                    type="file"
                    id="resume"
                    accept=".pdf,application/pdf"
                    onChange={handleResumeChange}
                    required={!useProfileResume}
                  />
                </div>
              )}
            </div>


            {/* Cover Letter */}
            <div className="mb-6">

              <label htmlFor="cover-letter" className="block text-sm font-medium mb-2">
                Cover Letter
              </label>

              <textarea
                id="cover-letter"
                value={coverLetter}
                onChange={(e) =>
                  setCoverLetter(e.target.value)
                }
                placeholder="Write a short cover letter..."
                rows="6"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg outline-none focus:border-green-400"
              />

            </div>


            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-500 text-black py-3 rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50"
            >
              {submitting
                ? "Submitting Application..."
                : "Apply Now"}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}

export default ApplyJob;