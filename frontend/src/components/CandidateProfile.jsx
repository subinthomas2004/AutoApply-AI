import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, User, Mail, Sparkles, Loader } from 'lucide-react';
import { api } from '../services/api';

export default function CandidateProfile({ candidate, onCandidateUpdated }) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a CV/Resume file (PDF, DOCX, TXT)");
      return;
    }

    setUploading(true);
    setStatusMsg("Analyzing CV & extracting skills with AI...");
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (fullName) formData.append('full_name', fullName);
      if (email) formData.append('email', email);

      const res = await api.uploadCV(formData);
      setStatusMsg("CV processed and profile updated successfully!");
      if (onCandidateUpdated) {
        onCandidateUpdated(res.data);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg("Failed to upload/analyze CV.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-card">
      <h2 className="card-title">
        <User size={20} color="#6366f1" /> Candidate Profile & CV
      </h2>

      {candidate ? (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.6rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
              {candidate.full_name ? candidate.full_name[0] : 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{candidate.full_name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{candidate.email}</div>
            </div>
          </div>

          <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: '0.85rem' }}>
            <div style={{ color: '#38bdf8', fontWeight: 600, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <FileText size={14} /> Attached Resume:
            </div>
            <div style={{ color: '#e2e8f0', wordBreak: 'break-all' }}>{candidate.cv_filename || "resume.pdf"}</div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>Extracted Skills:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {candidate.extracted_skills?.split(',').map((s, idx) => (
                <span key={idx} className="skill-chip">{s.trim()}</span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>AI Candidate Summary:</div>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4' }}>{candidate.summary}</p>
          </div>
        </div>
      ) : null}

      <div style={{ borderTop: candidate ? '1px solid rgba(255,255,255,0.08)' : 'none', paddingTop: candidate ? '1.2rem' : 0 }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.8rem', color: '#cbd5e1' }}>
          {candidate ? 'Upload New CV / Replace Resume' : 'Upload Your Resume to Begin'}
        </h3>
        
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label className="form-label">Full Name (optional)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Alex Johnson"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address (optional)</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="e.g. alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select CV File (PDF / DOCX / TXT)</label>
            <input 
              type="file" 
              className="form-input"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileChange}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={uploading}
          >
            {uploading ? (
              <><Loader size={16} className="spin" /> Parsing CV with AI...</>
            ) : (
              <><Upload size={16} /> Upload & Analyze CV</>
            )}
          </button>

          {statusMsg && (
            <div style={{ marginTop: '0.8rem', fontSize: '0.82rem', color: statusMsg.includes('Failed') ? '#ef4444' : '#10b981', textAlign: 'center' }}>
              {statusMsg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
