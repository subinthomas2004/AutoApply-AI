import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const api = {
  // Config
  getConfig: () => axios.get(`${API_BASE}/config/`),
  updateConfig: (data) => axios.post(`${API_BASE}/config/update`, data),

  // Candidate
  getCandidates: () => axios.get(`${API_BASE}/candidates/`),
  uploadCV: (formData) => axios.post(`${API_BASE}/candidates/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Jobs
  getJobs: () => axios.get(`${API_BASE}/jobs/`),
  searchJobs: (params) => axios.post(`${API_BASE}/jobs/search`, params),
  matchJob: (candidateId, jobId) => axios.post(`${API_BASE}/jobs/match`, {
    candidate_id: candidateId,
    job_id: jobId
  }),

  // Applications
  getApplications: () => axios.get(`${API_BASE}/applications/`),
  generateEmail: (data) => axios.post(`${API_BASE}/applications/generate`, data),
  handleApplicationAction: (appId, actionData) => axios.post(`${API_BASE}/applications/${appId}/action`, actionData),
  testBrevo: (data) => axios.post(`${API_BASE}/applications/test-brevo`, data),
  testSmtp: (data) => axios.post(`${API_BASE}/applications/test-smtp`, data)
};
