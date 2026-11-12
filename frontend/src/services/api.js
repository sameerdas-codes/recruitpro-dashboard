import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api",
});

export async function downloadResume(applicationId) {
  const response = await api.get(`/applications/${applicationId}/resume/`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");

  link.href = url;
  link.download = `resume-${applicationId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

export async function downloadInterviewCandidateResume(interviewId) {
  const response = await api.get(
    `/interviews/${interviewId}/candidate-resume/`,
    { responseType: "blob" },
  );
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");

  link.href = url;
  link.download = `candidate-resume-${interviewId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;