import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle2, AlertCircle, Shield, Key, Database, Globe, Mail, Send } from 'lucide-react';
import { api } from '../services/api';

export default function SettingsView() {
  const [config, setConfig] = useState(null);
  const [groqKey, setGroqKey] = useState('');
  const [brevoKey, setBrevoKey] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [testRecipient, setTestRecipient] = useState('');

  // MySQL state
  const [mysqlHost, setMysqlHost] = useState('localhost');
  const [mysqlPort, setMysqlPort] = useState('3306');
  const [mysqlUser, setMysqlUser] = useState('root');
  const [mysqlPassword, setMysqlPassword] = useState('');
  const [mysqlDb, setMysqlDb] = useState('job_finder_db');

  const [jobProvider, setJobProvider] = useState('duckduckgo');
  const [testingBrevo, setTestingBrevo] = useState(false);
  const [brevoResult, setBrevoResult] = useState(null);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await api.getConfig();
      setConfig(res.data);
      if (res.data.smtp_from_email) setFromEmail(res.data.smtp_from_email);
      if (res.data.job_search_provider) setJobProvider(res.data.job_search_provider);
      if (res.data.mysql_host) setMysqlHost(res.data.mysql_host);
      if (res.data.mysql_port) setMysqlPort(String(res.data.mysql_port));
      if (res.data.mysql_user) setMysqlUser(res.data.mysql_user);
      if (res.data.mysql_db) setMysqlDb(res.data.mysql_db);
    } catch (e) {
      console.error("Config fetch error:", e);
    }
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    try {
      await api.updateConfig({
        groq_api_key: groqKey,
        brevo_api_key: brevoKey,
        smtp_from_email: fromEmail,
        database_type: "mysql",
        mysql_host: mysqlHost,
        mysql_port: mysqlPort,
        mysql_user: mysqlUser,
        mysql_password: mysqlPassword,
        mysql_db: mysqlDb,
        job_search_provider: jobProvider
      });
      setSavedMsg("Settings and MySQL configuration saved successfully!");
      loadConfig();
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to update config");
    }
  };

  const handleTestBrevo = async (e) => {
    e.preventDefault();
    if (!brevoKey && !config?.brevo_configured) {
      alert("Please enter a Brevo API Key (starts with xkeysib-) first.");
      return;
    }
    setTestingBrevo(true);
    setBrevoResult(null);
    try {
      const res = await api.testBrevo({
        brevo_api_key: brevoKey,
        test_recipient: testRecipient || fromEmail || "applicant@example.com",
        from_email: fromEmail || "noreply@jobfinder.ai"
      });
      setBrevoResult(res.data);
    } catch (err) {
      console.error(err);
      setBrevoResult({ success: false, error: "Failed to connect to Brevo API. Check your API key." });
    } finally {
      setTestingBrevo(false);
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* MySQL Database Configuration */}
      <div className="glass-card" style={{ border: '1px solid rgba(56, 189, 248, 0.3)' }}>
        <h2 className="card-title" style={{ color: '#38bdf8' }}>
          <Database size={22} color="#38bdf8" /> MySQL Database Configuration
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.2rem', lineHeight: '1.4' }}>
          Configure your <strong>MySQL</strong> connection for persisting candidate CVs, job listings, and application history.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">MySQL Host</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="localhost" 
              value={mysqlHost}
              onChange={(e) => setMysqlHost(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Port</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="3306" 
              value={mysqlPort}
              onChange={(e) => setMysqlPort(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="root" 
              value={mysqlUser}
              onChange={(e) => setMysqlUser(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="MySQL password" 
              value={mysqlPassword}
              onChange={(e) => setMysqlPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Database Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="job_finder_db" 
              value={mysqlDb}
              onChange={(e) => setMysqlDb(e.target.value)}
            />
          </div>
        </div>

        <div style={{ fontSize: '0.82rem', marginTop: '0.4rem', color: config?.mysql_connected ? '#10b981' : '#f59e0b' }}>
          Status: {config?.mysql_connected ? '✓ Connected to MySQL database' : '! Local MySQL not detected — SQLite storage active with seamless schema parity'}
        </div>
      </div>

      {/* Brevo API Key Email Dispatch Card */}
      <div className="glass-card">
        <h2 className="card-title" style={{ color: '#34d399' }}>
          <Mail size={22} color="#10b981" /> Brevo API Key (Email Dispatch Automation)
        </h2>
        <div className="form-group">
          <label className="form-label">
            Brevo API Key (starts with <code style={{ color: '#38bdf8' }}>xkeysib-...</code>)
            {config?.brevo_configured && (
              <span style={{ color: '#10b981', marginLeft: 8, fontWeight: 600 }}>
                (✓ Active: {config.brevo_api_key_masked})
              </span>
            )}
          </label>
          <input 
            type="password" 
            className="form-input" 
            placeholder="xkeysib-..."
            value={brevoKey}
            onChange={(e) => setBrevoKey(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Sender Email Address (verified on Brevo)</label>
          <input 
            type="email" 
            className="form-input" 
            placeholder="your.email@domain.com"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
          />
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <input 
            type="email" 
            className="form-input" 
            placeholder="Test recipient email"
            value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          <button 
            type="button" 
            className="btn-outline" 
            onClick={handleTestBrevo} 
            disabled={testingBrevo}
          >
            <Send size={15} /> {testingBrevo ? "Sending..." : "Test Brevo API"}
          </button>
        </div>

        {brevoResult && (
          <div style={{ marginTop: '0.8rem', padding: '0.8rem', borderRadius: 8, background: brevoResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: brevoResult.success ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ fontWeight: 600, color: brevoResult.success ? '#34d399' : '#f87171' }}>
              {brevoResult.success ? '✓ Brevo API Verified!' : '! Brevo Test Result'}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>{brevoResult.message || brevoResult.error}</div>
          </div>
        )}
      </div>

      {/* Groq LLM & LangChain AI Configuration */}
      <div className="glass-card">
        <h2 className="card-title">
          <Key size={22} color="#f59e0b" /> Groq LLM & LangChain Framework
        </h2>
        <div className="form-group">
          <label className="form-label">
            Groq API Key {config?.groq_configured && <span style={{ color: '#10b981', marginLeft: 8 }}>(✓ Active: {config.groq_model})</span>}
          </label>
          <input 
            type="password" 
            className="form-input" 
            placeholder="gsk_..."
            value={groqKey}
            onChange={(e) => setGroqKey(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Job Search Web Integration</label>
          <select 
            className="form-input"
            value={jobProvider}
            onChange={(e) => setJobProvider(e.target.value)}
          >
            <option value="duckduckgo">DuckDuckGo Web Search & Open Job Feed</option>
            <option value="tavily">Tavily Search API</option>
          </select>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button type="button" className="btn-primary" onClick={handleSaveAll}>
            Save All Settings (MySQL, Groq, Brevo)
          </button>
          {savedMsg && <span style={{ color: '#10b981', fontSize: '0.85rem' }}>{savedMsg}</span>}
        </div>
      </div>

    </div>
  );
}
