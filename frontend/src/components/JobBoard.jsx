import React, { useState } from 'react';
import { Search, Briefcase, MapPin, ExternalLink, Sparkles, Send, ShieldAlert, Check } from 'lucide-react';
import { api } from '../services/api';

export default function JobBoard({ candidate, jobs, setJobs, onGenerateEmailClick }) {
  const [jobTitle, setJobTitle] = useState('Python Developer');
  const [skills, setSkills] = useState(candidate?.extracted_skills || 'Python, FastAPI, Docker, SQL');
  const [location, setLocation] = useState('Remote');
  const [loading, setLoading] = useState(false);
  const [matchingJobId, setMatchingJobId] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.searchJobs({
        job_title: jobTitle,
        skills: skills,
        location: location,
        max_results: 10
      });
      setJobs(res.data);
    } catch (err) {
      console.error(err);
      alert("Error searching for jobs.");
    } finally {
      setLoading(false);
    }
  };

  const handleMatchWithCV = async (jobId) => {
    if (!candidate) {
      alert("Please upload or select a candidate CV first.");
      return;
    }
    setMatchingJobId(jobId);
    try {
      const res = await api.matchJob(candidate.id, jobId);
      // Update job in local state
      setJobs(jobs.map(j => j.id === jobId ? { ...j, match_score: res.data.match_score, match_analysis: res.data.analysis } : j));
    } catch (err) {
      console.error(err);
      alert("Error matching job with CV.");
    } finally {
      setMatchingJobId(null);
    }
  };

  return (
    <div>
      {/* Search Header Form */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="card-title">
          <Search size={20} color="#38bdf8" /> Discover Recent Job Openings
        </h2>
        <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) 140px', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Job Title / Role</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Python Developer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">Required Skills</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Python, FastAPI, React"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Location / Work Mode</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Remote, United States, Hybrid"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ height: 42, justifyContent: 'center' }} disabled={loading}>
            {loading ? "Searching..." : <><Search size={16} /> Find Jobs</>}
          </button>
        </form>
      </div>

      {/* Jobs Grid */}
      <div className="jobs-grid">
        {jobs.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem' }}>
            <Briefcase size={40} color="#64748b" style={{ margin: '0 auto 1rem' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>No job postings loaded yet</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.4rem' }}>
              Fill in your criteria and click "Find Jobs" to fetch recent openings via Web Search Integration.
            </div>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.3 }}>
                    {job.title}
                  </h3>
                  {job.match_score > 0 && (
                    <span className={`match-score-pill ${job.match_score >= 70 ? 'score-high' : 'score-med'}`}>
                      <Sparkles size={13} /> {job.match_score}% Match
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.8rem' }}>
                  <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{job.company}</span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <MapPin size={13} /> {job.location || 'Remote'}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.45', marginBottom: '1rem', maxHeight: 85, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {job.description || "Exciting opportunity with dynamic engineering challenges."}
                </p>

                {job.match_analysis && (
                  <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 8, padding: '0.6rem 0.8rem', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 600, color: '#818cf8', marginBottom: '0.2rem' }}>AI Matching Analysis:</div>
                    {job.match_analysis}
                  </div>
                )}

                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    Recruiter Contact: <span style={{ color: '#94a3b8' }}>{job.recruiter_email || 'careers@' + job.company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'}</span>
                  </div>
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#38bdf8', fontSize: '0.8rem', textDecoration: 'none' }}
                    >
                      <ExternalLink size={13} /> Apply on Company Website
                    </a>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.8rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  className="btn-outline" 
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem' }}
                  onClick={() => handleMatchWithCV(job.id)}
                  disabled={matchingJobId === job.id}
                >
                  <Sparkles size={14} color="#818cf8" /> {matchingJobId === job.id ? 'Analyzing...' : 'AI Match CV'}
                </button>

                <button 
                  className="btn-primary" 
                  style={{ flex: 1.2, justifyContent: 'center', fontSize: '0.82rem' }}
                  onClick={() => onGenerateEmailClick(job)}
                >
                  <Send size={14} /> Draft AI Email
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
