import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Edit3, Send, AlertTriangle, FileText, Clock, Mail, UserCheck } from 'lucide-react';
import { api } from '../services/api';

export default function ApplicationsManager({ applications, onStatusChanged }) {
  const [editingApp, setEditingApp] = useState(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editRecipient, setEditRecipient] = useState('');
  const [rejectingAppId, setRejectingAppId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const startEdit = (app) => {
    setEditingApp(app);
    setEditSubject(app.subject);
    setEditBody(app.email_body);
    setEditRecipient(app.recipient_email);
  };

  const saveEdit = async () => {
    if (!editingApp) return;
    try {
      await api.handleApplicationAction(editingApp.id, {
        action: 'UPDATE',
        subject: editSubject,
        email_body: editBody,
        recipient_email: editRecipient
      });
      setEditingApp(null);
      if (onStatusChanged) onStatusChanged();
    } catch (err) {
      console.error(err);
      alert('Failed to update email draft.');
    }
  };

  const handleApproveAndSend = async (app) => {
    const confirmed = window.confirm(
      `CONFIRM HUMAN APPROVAL & DISPATCH:\n\nRecipient: ${app.recipient_email}\nSubject: ${app.subject}\n\nAre you sure you want to approve and send this email? The candidate's CV will be attached.`
    );
    if (!confirmed) return;

    setProcessingId(app.id);
    try {
      const res = await api.handleApplicationAction(app.id, {
        action: 'APPROVE_AND_SEND',
        recipient_email: app.recipient_email,
        subject: app.subject,
        email_body: app.email_body
      });
      alert(res.data.error_message || `Email successfully dispatched to ${app.recipient_email}!`);
      if (onStatusChanged) onStatusChanged();
    } catch (err) {
      console.error(err);
      alert('Failed to send email.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (appId) => {
    try {
      await api.handleApplicationAction(appId, {
        action: 'REJECT',
        rejection_reason: rejectionReason || 'Rejected by candidate after review.'
      });
      setRejectingAppId(null);
      setRejectionReason('');
      if (onStatusChanged) onStatusChanged();
    } catch (err) {
      console.error(err);
      alert('Failed to reject application.');
    }
  };

  return (
    <div>
      {/* Prominent Human-in-the-Loop Safeguard Notice */}
      <div className="approval-alert-banner">
        <ShieldCheck size={32} color="#f59e0b" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, color: '#fef3c7', fontSize: '1rem' }}>
            Human Approval Gate & Recipient Control Active
          </div>
          <div style={{ color: '#fed7aa', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            <strong>Dual-Mode Supported:</strong> In production, the system addresses the company HR/recruiter directly. For your testing stage, you can click <strong>"Edit / Override Recipient"</strong> on any draft to send the email to your personal test inbox first. <strong>No email is ever sent without your explicit approval.</strong>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {applications.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <FileText size={42} color="#64748b" style={{ margin: '0 auto 1rem' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>No applications drafted yet</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.4rem' }}>
              Find a job opening in the Job Search tab and click "Draft AI Email" to generate an application for human review.
            </div>
          </div>
        ) : (
          applications.map((app) => (
            <div key={app.id} className="glass-card" style={{ borderLeft: app.status === 'SENT' ? '4px solid #10b981' : app.status === 'REJECTED' ? '4px solid #ef4444' : '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#fff' }}>
                      {app.job?.title || "Application"}
                    </h3>
                    <span className={`status-tag ${app.status === 'SENT' ? 'status-sent' : app.status === 'REJECTED' ? 'status-rejected' : 'status-pending'}`}>
                      {app.status === 'PENDING_APPROVAL' ? 'Pending Human Review' : app.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span>Target Company: <strong style={{ color: '#cbd5e1' }}>{app.job?.company || "Company"}</strong></span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(99, 102, 241, 0.15)', padding: '0.15rem 0.5rem', borderRadius: 6, color: '#818cf8', fontWeight: 600 }}>
                      <Mail size={13} /> Recipient (HR): <span style={{ color: '#fff' }}>{app.recipient_email}</span>
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={13} /> {new Date(app.created_at).toLocaleString()}
                </div>
              </div>

              {/* Email Content Box */}
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: 10, padding: '1rem', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Subject: <span style={{ color: '#f1f5f9', fontWeight: 500 }}>{app.subject}</span>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5', fontFamily: 'monospace' }}>
                  {app.email_body}
                </div>
                {app.error_message && (
                  <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: app.status === 'SENT' ? '#34d399' : '#f87171' }}>
                    Status note: {app.error_message}
                  </div>
                )}
              </div>

              {/* Actions Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {app.status === 'PENDING_APPROVAL' && (
                  <>
                    <button 
                      className="btn-outline" 
                      onClick={() => startEdit(app)}
                      style={{ fontSize: '0.85rem' }}
                    >
                      <Edit3 size={15} /> Edit / Change Recipient (Testing)
                    </button>

                    <button 
                      className="btn-reject" 
                      onClick={() => setRejectingAppId(app.id)}
                      style={{ fontSize: '0.85rem' }}
                    >
                      <XCircle size={15} /> Reject
                    </button>

                    <button 
                      className="btn-approve" 
                      onClick={() => handleApproveAndSend(app)}
                      disabled={processingId === app.id}
                      style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem' }}
                    >
                      <Send size={15} /> {processingId === app.id ? "Dispatching..." : "Approve & Send Email"}
                    </button>
                  </>
                )}

                {app.status === 'SENT' && (
                  <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    <CheckCircle2 size={16} /> Dispatched to {app.recipient_email} with CV attached
                  </span>
                )}

                {app.status === 'REJECTED' && (
                  <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    <XCircle size={16} /> Rejected ({app.rejection_reason || 'No reason provided'})
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal (Supports overriding Recipient to personal test email) */}
      {editingApp && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>
              Edit Application Email & Recipient Override
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.2rem' }}>
              <strong>Testing Tip:</strong> You can replace the HR email below with your own personal email address to inspect the email and attached CV in your test inbox before sending to real recruiters.
            </p>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: '#38bdf8' }}>
                Recipient Email (Company HR or Your Test Email)
              </label>
              <input 
                type="email" 
                className="form-input" 
                value={editRecipient} 
                onChange={(e) => setEditRecipient(e.target.value)} 
                placeholder="hr@company.com or your.test@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Subject</label>
              <input 
                type="text" 
                className="form-input" 
                value={editSubject} 
                onChange={(e) => setEditSubject(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Body</label>
              <textarea 
                className="form-textarea" 
                rows="10" 
                value={editBody} 
                onChange={(e) => setEditBody(e.target.value)} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1.2rem' }}>
              <button className="btn-outline" onClick={() => setEditingApp(null)}>Cancel</button>
              <button className="btn-primary" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingAppId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 450 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.8rem', color: '#f87171' }}>
              Reject Application
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              This application will be marked as rejected and will NOT be sent to the recruiter.
            </p>
            <div className="form-group">
              <label className="form-label">Rejection Reason (optional)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Role requirements mismatch"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
              <button className="btn-outline" onClick={() => setRejectingAppId(null)}>Cancel</button>
              <button className="btn-reject" onClick={() => handleReject(rejectingAppId)}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
