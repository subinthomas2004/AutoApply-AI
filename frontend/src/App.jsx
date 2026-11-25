import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Upload, 
  Edit3, 
  ChevronRight, 
  Mail, 
  X, 
  MapPin, 
  Building, 
  ArrowRight, 
  Lock,
  Briefcase,
  Globe,
  Laptop,
  Check,
  AlertTriangle,
  ArrowUpDown,
  ExternalLink,
  GraduationCap,
  Award
} from 'lucide-react';
import { api } from './services/api';

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);

  // Candidate Data & Upload
  const [candidate, setCandidate] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Step 2: Target Job Role Selection (Derived from CV)
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [suggestedRoles, setSuggestedRoles] = useState(['Python Developer', 'Full Stack Developer', 'Computer Vision Engineer']);
  const [customRoleInput, setCustomRoleInput] = useState('');

  // Two Separate Tabs: Location & Work Mode
  const [locationMode, setLocationMode] = useState('All'); // 'All', 'Popular', 'Custom'
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [manualLocationInput, setManualLocationInput] = useState('');

  // Filter by Experience Level: 'All', 'Fresher', 'Experienced'
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState('All');
  const [selectedWorkMode, setSelectedWorkMode] = useState('All'); // 'All', 'Remote', 'Hybrid', 'On-site'

  // Flipkart-style unified draft state for filters
  const [draftRole, setDraftRole] = useState('All Roles');
  const [draftLocationMode, setDraftLocationMode] = useState('All');
  const [draftLocation, setDraftLocation] = useState('All Locations');
  const [draftManualLocation, setDraftManualLocation] = useState('');
  const [draftWorkMode, setDraftWorkMode] = useState('All');
  const [draftExperienceLevel, setDraftExperienceLevel] = useState('Fresher');

  const popularCities = [
    'Bangalore, India',
    'Hyderabad, India',
    'Pune, India',
    'Delhi NCR, India',
    'Mumbai, India',
    'Chennai, India',
    'London, UK',
    'New York, USA',
    'San Francisco, CA'
  ];

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [sortOrder, setSortOrder] = useState('highest'); // 'highest', 'lowest', 'default'
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [matchingJobId, setMatchingJobId] = useState(null);

  // Step 3: Human Approval & Sending (CANNOT be accessed by tab click unless drafted)
  const [applications, setApplications] = useState([]);
  const [currentDraftAppId, setCurrentDraftAppId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [editAppId, setEditAppId] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingId, setSendingId] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const deriveRolesFromSkills = (skillsStr) => {
    if (!skillsStr) return ['Python Developer', 'Full Stack Engineer', 'Backend Developer', 'Software Engineer'];
    const s = skillsStr.toLowerCase();
    const roles = [];

    // AI/ML & Computer Vision
    if (s.includes('yolo') || s.includes('opencv') || s.includes('keras') || s.includes('mobilenet') || s.includes('pytorch') || s.includes('tensorflow')) {
      roles.push('Computer Vision Engineer', 'AI / ML Engineer', 'Deep Learning Specialist');
    }

    // Python & Backend
    if (s.includes('python')) {
      roles.push('Python Developer', 'Backend Python Engineer');
    }

    // Full Stack & Web
    if ((s.includes('react') || s.includes('html') || s.includes('javascript')) && (s.includes('node') || s.includes('express') || s.includes('python') || s.includes('mongodb') || s.includes('rest'))) {
      roles.push('Full Stack Developer', 'MERN Stack Developer');
    }

    // Frontend
    if (s.includes('react') || s.includes('javascript') || s.includes('typescript')) {
      roles.push('React Developer', 'Frontend Engineer');
    }

    // Backend & API
    if (s.includes('node') || s.includes('express') || s.includes('fastapi') || s.includes('rest')) {
      roles.push('Node.js Backend Developer', 'REST API Engineer');
    }

    // Java
    if (s.includes('java') && !s.includes('javascript')) {
      roles.push('Java Developer', 'Java Spring Boot Engineer');
    }

    // Database
    if (s.includes('sql') || s.includes('mysql') || s.includes('mongodb')) {
      roles.push('Database Engineer');
    }

    // C / C++ / Systems
    if (s.includes('c++') || (/\bc\b/.test(s) && !s.includes('css'))) {
      roles.push('C / C++ Software Engineer');
    }

    // General Software Engineering
    if (roles.length === 0) {
      roles.push('Software Engineer', 'Full Stack Engineer', 'Junior Software Developer');
    }

    // Deduplicate and return ALL matched roles (not capped at 5)
    return Array.from(new Set(roles));
  };

  const loadInitialData = async () => {
    try {
      const [cands, appsRes] = await Promise.all([
        api.getCandidates(),
        api.getApplications()
      ]);
      if (cands.data && cands.data.length > 0) {
        const cand = cands.data[0];
        setCandidate(cand);
        const expLevel = cand.experience_level || 'Fresher';
        setSelectedExperienceLevel(expLevel);
        setDraftExperienceLevel(expLevel);

        const roles = deriveRolesFromSkills(cand.extracted_skills);
        setSuggestedRoles(roles);
        const initialRole = 'All Roles';
        setSelectedRole(initialRole);
        setDraftRole(initialRole);

        // Location & Work Mode initial defaults
        setSelectedLocation('All Locations');
        setDraftLocation('All Locations');
        setSelectedWorkMode('All');
        setDraftWorkMode('All');
        setDraftLocationMode('All');

        // Fetch initial jobs with All Roles, All Locations, All Work Modes, and Candidate's detected experience level
        try {
          const jobsRes = await api.searchJobs({
            job_title: initialRole,
            skills: cand.extracted_skills || 'Software Development',
            location: 'All Locations',
            work_mode: 'All',
            experience_level: expLevel,
            max_results: 50,
            candidate_id: cand.id
          });
          setJobs(jobsRes.data || []);
        } catch (e) {
          console.error("Initial jobs search error:", e);
        }
      }
      setApplications(appsRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Step 1: Upload Resume & Parse Skills
  const handleUploadCV = async (e) => {
    e.preventDefault();
    if (!cvFile) {
      alert("Please select your CV file (PDF, DOCX, or TXT)");
      return;
    }
    setUploading(true);
    setStatusMessage("Extracting skills and matching profiles with Groq AI...");
    try {
      const formData = new FormData();
      formData.append('file', cvFile);
      const res = await api.uploadCV(formData);
      setCandidate(res.data);
      setStatusMessage("Resume parsed successfully!");
      const expLevel = res.data.experience_level || 'Fresher';
      setSelectedExperienceLevel(expLevel);
      setDraftExperienceLevel(expLevel);

      const roles = deriveRolesFromSkills(res.data.extracted_skills);
      setSuggestedRoles(roles);
      setSelectedRole('All Roles');
      setDraftRole('All Roles');
      setSelectedLocation('All Locations');
      setDraftLocation('All Locations');
      setSelectedWorkMode('All');
      setDraftWorkMode('All');
      setDraftLocationMode('All');

      fetchJobsWithCriteria('All Roles', 'All Locations', 'All', expLevel, res.data.extracted_skills);
    } catch (err) {
      console.error(err);
      alert("Could not process resume.");
    } finally {
      setUploading(false);
    }
  };

  // Central unified search executor (invoked when user clicks Confirm / Apply Filters)
  const fetchJobsWithCriteria = async (targetRole, loc, mode, expLevel, skillsOverride) => {
    setLoadingJobs(true);
    const effectiveLoc = loc === 'All Locations' || !loc ? 'All Locations' : loc;
    const isAll = !targetRole || targetRole === 'All Roles';
    try {
      const res = await api.searchJobs({
        job_title: targetRole,
        skills: skillsOverride || candidate?.extracted_skills || 'Software Development',
        location: effectiveLoc,
        work_mode: mode || 'All',
        experience_level: expLevel || 'All',
        max_results: isAll ? 50 : 25,
        candidate_id: candidate?.id
      });
      setJobs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Unified "Confirm Filters" handler - applies Flipkart style combination of all selected criteria
  const handleConfirmFilters = () => {
    // 1. Determine effective role
    const finalRole = draftRole;
    // 2. Determine effective location
    let finalLocation = 'All Locations';
    if (draftLocationMode === 'Popular') {
      finalLocation = draftLocation;
    } else if (draftLocationMode === 'Custom') {
      finalLocation = draftManualLocation.trim() ? draftManualLocation.trim() : 'All Locations';
    } else {
      finalLocation = 'All Locations';
    }
    // 3. Determine work mode & experience level
    const finalWorkMode = draftWorkMode;
    const finalExpLevel = draftExperienceLevel;

    // Commit draft state to active state
    setSelectedRole(finalRole);
    setSelectedLocation(finalLocation);
    setSelectedWorkMode(finalWorkMode);
    setSelectedExperienceLevel(finalExpLevel);

    // Fetch unified results
    fetchJobsWithCriteria(finalRole, finalLocation, finalWorkMode, finalExpLevel);
  };

  // Match CV with Job (Accurate Groq LLM evaluation)
  const handleMatchJob = async (jobId) => {
    if (!candidate) return;
    setMatchingJobId(jobId);
    try {
      const res = await api.matchJob(candidate.id, jobId);
      setJobs(jobs.map(j => j.id === jobId ? { 
        ...j, 
        match_score: res.data.match_score, 
        match_analysis: res.data.analysis,
        matching_skills: res.data.matching_skills,
        missing_skills: res.data.missing_skills
      } : j));
    } catch (err) {
      console.error(err);
    } finally {
      setMatchingJobId(null);
    }
  };

  // Step 3: ONLY enters Step 3 when clicking "Draft Application Email"
  const handleOpenEmailDraft = async (job) => {
    if (!candidate) return;
    setDrafting(true);
    try {
      const res = await api.generateEmail({
        candidate_id: candidate.id,
        job_id: job.id,
        recipient_email: job.recruiter_email || `hr@${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        custom_instructions: "Highlight key skills, experience and immediate availability."
      });
      setCurrentDraftAppId(res.data.id);
      setRecipientEmail(res.data.recipient_email);
      setEmailSubject(res.data.subject);
      setEmailBody(res.data.email_body);

      const apps = await api.getApplications();
      setApplications(apps.data || []);
      setShowHistory(false);
      setCurrentStep(3);
    } catch (err) {
      console.error(err);
      alert("Failed to draft email with AI.");
    } finally {
      setDrafting(false);
    }
  };

  // Approve & Send Email
  const handleApproveAndSend = async (appId) => {
    const targetRecipient = recipientEmail || "applicant@example.com";
    const confirmed = window.confirm(
      `CONFIRM HUMAN APPROVAL BEFORE DISPATCH:\n\nSender: subinthomas965@gmail.com\nRecipient: ${targetRecipient}\nSubject: ${emailSubject}\n\nYour CV will be attached. Do you approve sending?`
    );
    if (!confirmed) return;

    setSendingId(appId);
    try {
      const res = await api.handleApplicationAction(appId, {
        action: 'APPROVE_AND_SEND',
        recipient_email: targetRecipient,
        subject: emailSubject,
        email_body: emailBody
      });
      alert(res.data.error_message || `Email successfully dispatched to ${targetRecipient}!`);
      setEditAppId(null);
      const apps = await api.getApplications();
      setApplications(apps.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to send email. Check credentials.");
    } finally {
      setSendingId(null);
    }
  };

  const handleSaveDraftOnly = async (appId) => {
    try {
      await api.handleApplicationAction(appId, {
        action: 'UPDATE',
        recipient_email: recipientEmail,
        subject: emailSubject,
        email_body: emailBody
      });
      alert("Draft saved!");
      setEditAppId(null);
      const apps = await api.getApplications();
      setApplications(apps.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const pendingCount = applications.filter(a => a.status === 'PENDING_APPROVAL').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-slate-900">AutoApply AI</h1>
              <p className="text-xs text-slate-500">Find Jobs, Calculate Match & Send Applications via Gmail</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Header Right */}
          </div>
        </div>
      </header>

      {/* 3-Step Wizard Navigation */}
      <div className="bg-white border-b border-slate-200 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          
          <button 
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2.5 text-sm font-semibold transition ${currentStep === 1 ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === 1 ? 'bg-brand-600 text-white' : candidate ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {candidate ? '✓' : '1'}
            </span>
            <span>1. Upload Resume</span>
          </button>

          <ChevronRight size={16} className="text-slate-300" />

          <button 
            onClick={() => {
              if (candidate) setCurrentStep(2);
            }}
            disabled={!candidate}
            className={`flex items-center gap-2.5 text-sm font-semibold transition ${!candidate ? 'opacity-40 cursor-not-allowed text-slate-400' : currentStep === 2 ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === 2 ? 'bg-brand-600 text-white' : jobs.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {!candidate ? <Lock size={12} /> : '2'}
            </span>
            <span>2. Find & Match Jobs</span>
          </button>

          <ChevronRight size={16} className="text-slate-300" />

          {/* Step 3: Strictly Locked from random clicks in Step 2 */}
          <button 
            onClick={() => {
              if (currentStep === 2) {
                alert("Please click 'Draft Application Email & Proceed to Step 3' on a job card to enter Step 3.");
              } else if (applications.length > 0) {
                setCurrentStep(3);
              }
            }}
            disabled={applications.length === 0}
            title={applications.length === 0 ? "Locked until you draft an email" : "Step 3: Review & Send"}
            className={`flex items-center gap-2.5 text-sm font-semibold transition ${applications.length === 0 ? 'opacity-40 cursor-not-allowed text-slate-400' : currentStep === 3 ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === 3 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {applications.length === 0 ? <Lock size={12} /> : '3'}
            </span>
            <span className="flex items-center gap-1.5">
              3. Review & Send
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                  {pendingCount}
                </span>
              )}
            </span>
          </button>

        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
        
        {/* ================= STEP 1: UPLOAD RESUME & EXTRACT SKILLS ================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center max-w-lg mx-auto">
              <h2 className="text-2xl font-bold text-slate-900">Step 1: Upload Resume & Extract Skills</h2>
              <p className="text-sm text-slate-500 mt-1">
                Upload your CV to extract skills and determine your target job titles.
              </p>
            </div>

            {candidate && (
              <div className="bg-white border-2 border-emerald-500/30 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{candidate.full_name || "Applicant Profile"}</h3>
                      <p className="text-xs text-slate-500">File: <strong className="text-slate-700">{candidate.cv_filename}</strong></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${candidate.experience_level === 'Fresher' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                      {candidate.experience_level === 'Fresher' ? <GraduationCap size={13} /> : <Award size={13} />}
                      Analyzed as: {candidate.experience_level || 'Fresher'}
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Ready for Step 2
                    </span>
                  </div>
                </div>

                {/* Extracted Skills */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-brand-600" />
                    Your Resume Skills:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.extracted_skills?.split(',').map((skill, idx) => (
                      <span key={idx} className="bg-white border border-slate-200 text-slate-800 text-xs font-medium px-2.5 py-1 rounded-lg shadow-2xs">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                {candidate.summary && (
                  <div className="text-xs text-slate-600 bg-brand-50/50 border border-brand-100 p-3 rounded-xl leading-relaxed">
                    <strong className="text-brand-700">Resume Summary:</strong> {candidate.summary}
                  </div>
                )}

                {/* Proceed Button */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Want to replace resume? Upload below.</span>
                  <button 
                    onClick={() => {
                      setCurrentStep(2);
                      if (jobs.length === 0) fetchJobsForRole(selectedRole, selectedLocation, selectedWorkMode, selectedExperienceLevel);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-500/20 transition"
                  >
                    Proceed to Step 2: Find Jobs <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Resume Upload Form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
              <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
                <Upload size={28} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">
                {candidate ? "Upload a New Resume File" : "Upload your resume to begin"}
              </h3>
              <p className="text-xs text-slate-500 mb-6">Supports PDF, Word (.docx) or Text (.txt)</p>

              <form onSubmit={handleUploadCV} className="max-w-md mx-auto space-y-4">
                <input 
                  type="file" 
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={(e) => setCvFile(e.target.files[0])}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer border border-slate-200 rounded-xl"
                  required
                />

                <button 
                  type="submit" 
                  disabled={uploading}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-brand-500/20 text-sm transition flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>Extracting Skills with Groq AI...</>
                  ) : (
                    <><Upload size={16} /> Upload & Extract Skills</>
                  )}
                </button>
              </form>

              {statusMessage && (
                <p className="text-xs font-semibold text-emerald-600 mt-3">{statusMessage}</p>
              )}
            </div>

            {!candidate && (
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Lock size={14} className="text-slate-400" />
                <span>Step 2 is locked until you upload your resume.</span>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 2: TARGET ROLES & DETAILED MATCHING ================= */}
        {currentStep === 2 && candidate && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Step 2: Find Relevant Job Openings</h2>
                <p className="text-sm text-slate-500">
                  Select a job role from your resume analysis, choose location, and view matching openings.
                </p>
              </div>

              <div className="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                Your Skills: <strong className="text-slate-800">{candidate.extracted_skills}</strong>
              </div>
            </div>

            {/* Filter Control Box - Unified Flipkart-Style Search and Filter Unit */}
            <div className="bg-white border-2 border-slate-200/90 p-5 rounded-2xl shadow-sm space-y-5">
              
              {/* 1. Target Job Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Briefcase size={14} className="text-brand-600" />
                    Target Job Title:
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Selected for Apply: <strong className="text-brand-600">{draftRole}</strong>
                  </span>
                </label>

                <div className="flex flex-wrap gap-2">
                  {/* Option 1: ALL jobs in API database */}
                  <button
                    type="button"
                    onClick={() => { setDraftRole('All Roles'); setCustomRoleInput(''); }}
                    className={`text-xs font-bold px-3.5 py-2 rounded-xl transition border flex items-center gap-1.5 ${draftRole === 'All Roles' ? 'bg-brand-600 text-white border-brand-600 shadow-sm ring-2 ring-brand-400' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}`}
                  >
                    <span>🌐 All Roles</span>
                    {draftRole === 'All Roles' && <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">Selected</span>}
                  </button>

                  {/* Option 2: Individual matched roles from resume */}
                  {suggestedRoles.map((role, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { setDraftRole(role); setCustomRoleInput(''); }}
                      className={`text-xs font-bold px-3.5 py-2 rounded-xl transition border flex items-center gap-1.5 ${draftRole === role ? 'bg-brand-600 text-white border-brand-600 shadow-sm ring-2 ring-brand-400' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}`}
                    >
                      <span>{role}</span>
                      {draftRole === role && <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">Selected</span>}
                    </button>
                  ))}
                </div>

                {/* Option 3: Custom Role Input */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-slate-500 whitespace-nowrap">Or type custom title:</span>
                  <input 
                    type="text" 
                    placeholder="e.g. Python Developer, Machine Learning Engineer"
                    value={customRoleInput}
                    onChange={(e) => {
                      setCustomRoleInput(e.target.value);
                      if (e.target.value.trim()) {
                        setDraftRole(e.target.value.trim());
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-72 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  {customRoleInput.trim() && (
                    <span className="text-xs font-semibold text-emerald-600">✓ Set as target role</span>
                  )}
                </div>
              </div>

              {/* 2. Location & Work Mode Tabs */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Location Tab */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Globe size={14} className="text-brand-600" />
                    Preferred Location:
                  </label>
                  
                  <div className="flex items-center gap-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() => { setDraftLocationMode('All'); setDraftLocation('All Locations'); setDraftManualLocation(''); }}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${draftLocationMode === 'All' ? 'bg-brand-600 text-white border-brand-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                    >
                      All Locations
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDraftLocationMode('Popular'); if (draftLocation === 'All Locations') setDraftLocation(popularCities[0]); }}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${draftLocationMode === 'Popular' ? 'bg-brand-600 text-white border-brand-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                    >
                      Popular Cities
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraftLocationMode('Custom')}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${draftLocationMode === 'Custom' ? 'bg-brand-600 text-white border-brand-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                    >
                      Type Manually
                    </button>
                  </div>

                  {draftLocationMode === 'Popular' && (
                    <select
                      value={draftLocation}
                      onChange={(e) => setDraftLocation(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                    >
                      {popularCities.map((city, idx) => (
                        <option key={idx} value={city}>{city}</option>
                      ))}
                    </select>
                  )}

                  {draftLocationMode === 'Custom' && (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Type city or country (e.g. Hyderabad, India)"
                        value={draftManualLocation}
                        onChange={(e) => setDraftManualLocation(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  )}
                </div>

                {/* Work Mode Tab */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Laptop size={14} className="text-brand-600" />
                    Work Mode:
                  </label>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {['All', 'Remote', 'Hybrid', 'On-site'].map((mode, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setDraftWorkMode(mode)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${draftWorkMode === mode ? 'bg-brand-600 text-white border-brand-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        {mode === 'All' ? 'All Modes' : mode}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* 3. Experience Level Filter (Fresher vs Experienced) */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <GraduationCap size={15} className="text-brand-600" />
                      Experience Level:
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Based on your resume analysis: <strong className="text-slate-800">{candidate.experience_level || 'Fresher'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDraftExperienceLevel('All')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${draftExperienceLevel === 'All' ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <span>All Levels</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDraftExperienceLevel('Fresher')}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${draftExperienceLevel === 'Fresher' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-300' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}
                    >
                      <GraduationCap size={14} />
                      <span>Fresher (Entry-Level / 0-1 Yrs)</span>
                      {candidate.experience_level === 'Fresher' && (
                        <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">Your Match</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDraftExperienceLevel('Experienced')}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${draftExperienceLevel === 'Experienced' ? 'bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-300' : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'}`}
                    >
                      <Award size={14} />
                      <span>Experienced (Mid / Senior)</span>
                      {candidate.experience_level === 'Experienced' && (
                        <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">Your Match</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. CONFIRM BUTTON (FLIPKART-STYLE UNIFIED COMMIT) */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-3.5 rounded-xl">
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-slate-800">Pending Filter: </span>
                  <span className="text-brand-600 font-semibold">{draftRole}</span> •{' '}
                  <span className="text-slate-700 font-medium">{draftLocationMode === 'Custom' ? (draftManualLocation || 'All Locations') : draftLocation}</span> •{' '}
                  <span className="text-slate-700 font-medium">{draftWorkMode} Mode</span> •{' '}
                  <span className="text-slate-700 font-medium">{draftExperienceLevel}</span>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmFilters}
                  disabled={loadingJobs}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loadingJobs ? (
                    <>
                      <Sparkles size={15} className="animate-spin" />
                      Applying Filters...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Confirm & Apply Filters
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Results Title & Sorting Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 px-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                  Showing Openings for: <span className="text-brand-600">"{selectedRole}"</span>
                </h3>
                <span className="text-xs text-slate-400">({jobs.length} found)</span>
              </div>

              {/* Match Sorting Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="match-sort" className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <ArrowUpDown size={13} className="text-brand-600" />
                  Sort by Match:
                </label>
                <select
                  id="match-sort"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer shadow-2xs"
                >
                  <option value="highest">Highest Match First (99% → 0%)</option>
                  <option value="lowest">Lowest Match First (0% → 99%)</option>
                  <option value="default">Default Search Order</option>
                </select>
              </div>
            </div>

            {/* Jobs List with Explicit Skill Breakdown */}
            <div className="space-y-4">
              {loadingJobs ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                  <Sparkles size={24} className="animate-spin text-brand-600 mx-auto mb-2" />
                  <p className="font-semibold text-xs">Fetching live jobs for "{selectedRole}"...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400">
                  <Search size={36} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">No jobs found for "{selectedRole}"</p>
                  <p className="text-xs text-slate-400 mt-1">Try another suggested title or location.</p>
                </div>
              ) : (
                [...jobs]
                  .sort((a, b) => {
                    const scoreA = Number(a.match_score) || 0;
                    const scoreB = Number(b.match_score) || 0;
                    if (sortOrder === 'highest') return scoreB - scoreA;
                    if (sortOrder === 'lowest') return scoreA - scoreB;
                    return 0;
                  })
                  .map((job) => (
                  <div key={job.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-lg leading-snug">{job.title}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${job.experience_level === 'Fresher' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                            {job.experience_level === 'Fresher' ? <GraduationCap size={11} /> : <Award size={11} />}
                            {job.experience_level || "Fresher"}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            {job.source || "Live Feed"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="font-medium text-slate-700 flex items-center gap-1">
                            <Building size={13} /> {job.company}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-brand-600" /> {job.location || selectedLocation}
                          </span>
                        </div>
                      </div>

                      {/* Match Badge - always visible after search */}
                      {job.match_score != null && job.match_score > 0 ? (
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${job.match_score >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : job.match_score >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                          <Sparkles size={13} /> {job.match_score}% Match
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleMatchJob(job.id)}
                          disabled={matchingJobId === job.id}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition"
                        >
                          <Sparkles size={13} /> {matchingJobId === job.id ? "Analyzing..." : "Deep AI Match"}
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                      {job.description || "Exciting developer position looking for qualified candidates."}
                    </p>

                    {/* Job Technical Requirements */}
                    {job.requirements && (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs mb-3">
                        <span className="font-bold text-slate-700">Role Requirements:</span>{' '}
                        <span className="text-slate-600">{job.requirements}</span>
                      </div>
                    )}

                    {/* Match Evaluation - shown immediately (pre-computed) or after manual match */}
                    {(job.match_analysis || (job.matching_skills && job.matching_skills.length > 0)) && (
                      <div className="rounded-xl border border-slate-200 overflow-hidden mb-4">
                        {job.match_analysis && (
                          <div className="bg-slate-50 px-3 py-2 text-xs text-slate-700 border-b border-slate-200">
                            <strong className="text-brand-600">Match Analysis: </strong>{job.match_analysis}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-x-6 gap-y-2 px-3 py-2.5 text-[11px] bg-white">
                          {job.matching_skills && job.matching_skills.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="font-bold text-emerald-700 flex items-center gap-0.5 mr-1">
                                <Check size={12} /> You Have:
                              </span>
                              {job.matching_skills.map((s, i) => (
                                <span key={i} className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-medium border border-emerald-200">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                          {job.missing_skills && job.missing_skills.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="font-bold text-rose-700 flex items-center gap-0.5 mr-1">
                                <AlertTriangle size={12} /> You Lack:
                              </span>
                              {job.missing_skills.map((s, i) => (
                                <span key={i} className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-medium border border-rose-200">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[11px] text-slate-400">
                          Recruiter: <strong className="text-slate-600">{job.recruiter_email || `hr@${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`}</strong>
                        </span>

                        {/* Direct Company Website Application Link */}
                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg transition shadow-2xs"
                          >
                            <ExternalLink size={13} />
                            Apply on Company Site
                          </a>
                        )}
                      </div>

                      {/* ONLY CLICKING THIS TAKES THE USER TO STEP 3 */}
                      <button 
                        onClick={() => handleOpenEmailDraft(job)}
                        disabled={drafting}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-brand-500/20 transition"
                      >
                        <Send size={13} /> Draft Application Email & Proceed to Step 3
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 3: REVIEW & SEND (ENTERED ONLY THROUGH DRAFTING) ================= */}
        {currentStep === 3 && candidate && (
          <div className="space-y-6">
            {/* Header with History Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Step 3: Review & Send (Human Approval)</h2>
                <p className="text-sm text-slate-500">
                  {showHistory 
                    ? "Viewing your complete dispatched application history." 
                    : "Review the application email drafted for your selected job. Edit recipient if testing, then approve dispatch."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {applications.length > 1 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs"
                  >
                    {showHistory ? "← Back to Current Draft" : `View Full History (${applications.length})`}
                  </button>
                )}

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                  <ShieldCheck size={16} className="text-amber-600" />
                  Human Approval Required
                </div>
              </div>
            </div>

            {/* Applications Display */}
            {applications.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400">
                <Mail size={36} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">No application emails drafted yet</p>
                <p className="text-xs text-slate-400 mt-1">Please select a job in Step 2 and click "Draft Application Email".</p>
                <button 
                  onClick={() => setCurrentStep(2)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl"
                >
                  Back to Step 2
                </button>
              </div>
            ) : (
              (showHistory 
                ? applications 
                : applications.filter(a => a.id === currentDraftAppId || (!currentDraftAppId && a.id === applications[0]?.id))
              ).map((app) => (
                <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-lg">{app.job?.title || "Application"}</h3>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${app.status === 'SENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {app.status === 'SENT' ? '✓ Sent via Gmail' : 'Pending Your Approval'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Company: <strong className="text-slate-700">{app.job?.company}</strong></p>
                    </div>

                    {app.status !== 'SENT' && (
                      <button 
                        onClick={() => {
                          setEditAppId(app.id);
                          setRecipientEmail(app.recipient_email);
                          setEmailSubject(app.subject);
                          setEmailBody(app.email_body);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg"
                      >
                        <Edit3 size={13} /> Edit / Change Recipient (Testing)
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                    <div>
                      <span className="text-slate-400 font-medium">From:</span>{' '}
                      <strong className="text-slate-800">subinthomas965@gmail.com</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">To (Recipient):</span>{' '}
                      <strong className="text-slate-800">{app.recipient_email}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Subject:</span>{' '}
                      <strong className="text-slate-800">{app.subject}</strong>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium pt-1">
                      📎 Attached: Candidate Resume ({candidate?.cv_filename || "resume.pdf"})
                    </div>
                  </div>

                  <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed">
                    {app.email_body}
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button 
                      onClick={() => setCurrentStep(2)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      ← Back to Job Openings
                    </button>

                    {app.status !== 'SENT' && (
                      <button 
                        onClick={() => {
                          setRecipientEmail(app.recipient_email);
                          setEmailSubject(app.subject);
                          setEmailBody(app.email_body);
                          handleApproveAndSend(app.id);
                        }}
                        disabled={sendingId === app.id}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition"
                      >
                        <Send size={14} />
                        {sendingId === app.id ? "Sending via Gmail..." : "Approve & Send Email Now"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </main>

      {/* ================= EDIT / RECIPIENT OVERRIDE MODAL ================= */}
      {editAppId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Edit Email & Recipient Override</h3>
              <button onClick={() => setEditAppId(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient Email (Company HR or Your Test Email)
                </label>
                <input 
                  type="email" 
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="e.g. hr@company.com or your.test@email.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Type your personal email here to test receive it in your own inbox before sending to company HR.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input 
                  type="text" 
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Body</label>
                <textarea 
                  rows={8}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                onClick={() => setEditAppId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSaveDraftOnly(editAppId)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Save Changes Only
              </button>
              <button 
                onClick={() => handleApproveAndSend(editAppId)}
                disabled={sendingId === editAppId}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20"
              >
                Approve & Send
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
