import React, { useState, useEffect } from "react";
import { Menu, ArrowLeft, CheckCircle, CheckCircle2, Loader2, Clock, Video, AlertCircle } from "lucide-react";
import { generateTaskBreakdownLocal, generateWanVideoLocal } from "./services/api";
import TaskInput from "./components/TaskInput";
import VideoCard from "./components/VideoCard";
import TaskTimeline from "./components/TaskTimeline";
import SettingsModal from "./components/SettingsModal";

export default function App() {
  // Load settings from localStorage
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("adhd-wan-settings");
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      geminiApiKey: parsed.geminiApiKey || "",
      localBackendUrl: parsed.localBackendUrl || "http://localhost:8000"
    };
  });

  const [adhdProfile, setAdhdProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("adhd_profile");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [activeTask, setActiveTask] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showCompletionPage, setShowCompletionPage] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Sync settings to localStorage
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem("adhd-wan-settings", JSON.stringify(newSettings));
  };

  const handleRetakeAssessment = () => {
    localStorage.removeItem("adhd_profile");
    localStorage.removeItem("adhd_raw_assessment_data");
    setAdhdProfile(null);
    setActiveTask(null);
  };

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data && e.data.type === "assessment_complete") {
        try {
          const saved = localStorage.getItem("adhd_profile");
          if (saved) {
            setAdhdProfile(JSON.parse(saved));
          }
        } catch (err) {
          console.error("Failed to load profile from localStorage:", err);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleTaskSubmit = async (taskName) => {
    setActiveIndex(0); // Reset index immediately on submit
    setIsLoading(true);
    setShowCompletionPage(false);
    
    try {
      if (!settings.geminiApiKey) {
        throw new Error("Gemini API key is required. Please set it in settings (Gear icon in top-right).");
      }

      // Determine steps and severity based on ADHD profile
      let numSteps = 6;
      let severity = "Moderate";
      if (adhdProfile && adhdProfile.classification) {
        const severityStr = adhdProfile.classification.severity;
        if (severityStr === "Significant") {
          numSteps = 8;
          severity = "Significant";
        } else if (severityStr === "Mild/Balanced") {
          numSteps = 4;
          severity = "Mild/Balanced";
        }
      }

      // Call local python backend which will route to Gemini 2.5 Flash API
      const steps = await generateTaskBreakdownLocal(
        taskName, 
        "gemini-2.5-flash", 
        settings.localBackendUrl, 
        settings.geminiApiKey,
        numSteps,
        severity
      );
      
      setActiveTask({
        id: `gemini-live-${Date.now()}`,
        title: taskName,
        description: `Gemini generated steps for: ${taskName}`,
        difficulty: "Medium",
        estimatedTime: `${Math.round(steps.reduce((acc, curr) => acc + curr.duration, 0) / 60)} mins`,
        steps: steps.map((step, idx) => ({
          ...step,
          index: idx,
          isCompleted: false,
          checkedSubtasks: [],
          videoUrl: null, // Generated on demand by Wan 2.1
          videoStatus: "pending", // Initial state for background generation queue
          videoError: null
        }))
      });
    } catch (err) {
      alert(`Error generating task breakdown: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to update a step's video status in App state
  const setImmediateActiveTaskStepStatus = (stepId, status) => {
    setActiveTask((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        steps: prev.steps.map(s => s.id === stepId ? { ...s, videoStatus: status } : s)
      };
    });
  };

  // Helper for success
  const setImmediateActiveTaskStepSuccess = (stepId, videoUrl) => {
    setActiveTask((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        steps: prev.steps.map(s => s.id === stepId ? { ...s, videoUrl, videoStatus: 'completed', videoError: null } : s)
      };
    });
  };

  // Helper for error
  const setImmediateActiveTaskStepError = (stepId, errorMsg) => {
    setActiveTask((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        steps: prev.steps.map(s => s.id === stepId ? { ...s, videoStatus: 'error', videoError: errorMsg } : s)
      };
    });
  };

  // Manual retry handler (resets status back to pending to trigger automatic pick up by the queue)
  const handleRetryVideoGeneration = (stepId) => {
    setActiveTask((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        steps: prev.steps.map(s => s.id === stepId ? { ...s, videoStatus: 'pending', videoError: null } : s)
      };
    });
  };

  // Automatic background video generation queue processor
  useEffect(() => {
    if (!activeTask || !activeTask.steps) return;

    // Check if any step is currently generating to prevent overlapping GPU processes
    const isAnyGenerating = activeTask.steps.some(s => s.videoStatus === 'generating');
    if (isAnyGenerating) return;

    // Find the first pending step in the queue
    const nextPendingStep = activeTask.steps.find(s => s.videoStatus === 'pending');
    if (!nextPendingStep) return;

    const startGeneration = async () => {
      // Mark as generating
      setImmediateActiveTaskStepStatus(nextPendingStep.id, 'generating');

      try {
        const videoUrl = await generateWanVideoLocal(
          nextPendingStep.prompt,
          nextPendingStep.id,
          "Wan-AI/Wan2.1-T2V-1.3B",
          settings.localBackendUrl,
          settings.geminiApiKey
        );
        setImmediateActiveTaskStepSuccess(nextPendingStep.id, videoUrl);
      } catch (err) {
        console.error(`Failed to generate video for step ${nextPendingStep.title}:`, err);
        setImmediateActiveTaskStepError(nextPendingStep.id, err.message || "Failed to generate video.");
      }
    };

    startGeneration();
  }, [activeTask, settings.localBackendUrl, settings.geminiApiKey]);


  const handleVideoOrSubtaskChange = (stepId, videoUrl, subtaskIndex = null) => {
    setActiveTask((prev) => {
      if (!prev) return prev;
      
      const updatedSteps = prev.steps.map((step) => {
        if (step.id !== stepId) return step;
        
        // Handle subtask checklist toggling
        if (subtaskIndex !== null) {
          const alreadyChecked = step.checkedSubtasks.includes(subtaskIndex);
          const checkedSubtasks = alreadyChecked
            ? step.checkedSubtasks.filter((idx) => idx !== subtaskIndex)
            : [...step.checkedSubtasks, subtaskIndex];
            
          return { ...step, checkedSubtasks };
        }
        
        // Handle video URL update (when Wan finishes rendering)
        return { ...step, videoUrl };
      });
      
      return { ...prev, steps: updatedSteps };
    });
  };

  const handleCompleteStep = (idx) => {
    setActiveTask((prev) => {
      if (!prev) return prev;
      
      const updatedSteps = prev.steps.map((step, sIdx) => {
        if (sIdx === idx) {
          // If marking complete, check all subtasks automatically
          const checkedSubtasks = !step.isCompleted 
            ? step.subtasks.map((_, subIdx) => subIdx)
            : [];
          return { ...step, isCompleted: !step.isCompleted, checkedSubtasks };
        }
        return step;
      });

      // Check if all steps in the task are now completed
      const allCompleted = updatedSteps.every(s => s.isCompleted);
      if (allCompleted) {
        setTimeout(() => setShowCompletionPage(true), 800);
      } else if (!activeTask.steps[idx].isCompleted && idx < prev.steps.length - 1) {
        // Auto-advance to the next step after 800ms
        setTimeout(() => {
          setActiveIndex(idx + 1);
        }, 800);
      }

      return { ...prev, steps: updatedSteps };
    });
  };

  const resetActiveTask = () => {
    setActiveTask(null);
    setShowCompletionPage(false);
  };

  const getQueueStatusText = () => {
    if (!activeTask || !activeTask.steps) return null;
    const generatingStep = activeTask.steps.find(s => s.videoStatus === 'generating');
    const pendingCount = activeTask.steps.filter(s => s.videoStatus === 'pending').length;
    
    if (generatingStep) {
      const idx = activeTask.steps.indexOf(generatingStep) + 1;
      return `Generating clip ${idx} of ${activeTask.steps.length}${pendingCount > 0 ? ` (${pendingCount} queued)` : ""}`;
    }
    
    return null;
  };

  return (
    <div className={`app-container step-theme-${activeTask ? activeIndex % 6 : 0}`} style={{ height: !adhdProfile ? "100vh" : "auto" }}>
      {/* Header Bar */}
      {adhdProfile && (
        <header className="app-header glass-panel">
          <div className="brand" onClick={resetActiveTask} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
            <img src="/focusloop.png" style={{ height: "34px", width: "auto", borderRadius: "4px", display: "block" }} alt="FocusLoop" />
          </div>
          <div className="header-actions">
            {activeTask && !showCompletionPage && (
              <button 
                className={`btn ${isFocusMode ? "btn-primary" : "btn-secondary"}`}
                style={{ borderRadius: "50px", padding: "0.4rem 1rem", fontSize: "0.85rem", fontWeight: 600, borderLeft: "3px solid var(--color-accent)" }}
                onClick={() => setIsFocusMode(!isFocusMode)}
              >
                ⚡ {isFocusMode ? "Focus Active" : "Focus Mode"}
              </button>
            )}
            <span className="mode-badge">
              <span className="mode-dot gemini"></span>
              Gemini + Local Wan 2.1
            </span>
            
            {getQueueStatusText() && (
              <span className="mode-badge" style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Loader2 size={11} style={{ animation: "spin 1.5s linear infinite" }} />
                {getQueueStatusText()}
              </span>
            )}

            <button 
              className="btn btn-secondary btn-icon" 
              onClick={() => setShowSettings(true)}
              title="Configure API Keys"
            >
              <Menu size={18} />
            </button>
          </div>
        </header>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          onRetake={handleRetakeAssessment}
          hasProfile={!!adhdProfile}
        />
      )}

      {/* Main Content Area */}
      <main style={{ minHeight: !adhdProfile ? "100vh" : "60vh", display: "flex", flexDirection: "column", flex: 1 }}>
        {!adhdProfile ? (
          <div className="iframe-container" style={{ flex: 1, display: "flex", width: "100%", height: "100%", border: "none" }}>
            <iframe
              src="/assessment/index.html"
              style={{ width: "100%", height: "100%", flex: 1, border: "none" }}
              title="ADHD Assessment"
            />
          </div>
        ) : !activeTask ? (
          /* Initial State - Enter Task */
          <TaskInput onSubmit={handleTaskSubmit} isLoading={isLoading} mode="gemini" />
        ) : showCompletionPage ? (
          /* Completion Vibe Screen */
          <div className="input-panel glass-panel text-center" style={{ maxWidth: 500, padding: "3rem 2rem", margin: "4rem auto" }}>
            <div className="brand-icon" style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(78, 173, 117, 0.1)", color: "var(--color-success)", margin: "0 auto 1.5rem" }}>
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>You Did It! 🎉</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "2rem", lineHeight: 1.6 }}>
              You successfully finished <strong>{activeTask.title}</strong> by breaking it down. Great job taking it step-by-step.
            </p>
            <div className="flex flex-col gap-2 w-full">
              <button className="btn btn-primary" onClick={resetActiveTask}>
                Start a New Task
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  // Reset checklist states for active task to do it again
                  setActiveTask(prev => ({
                    ...prev,
                    steps: prev.steps.map(s => ({ ...s, isCompleted: false, checkedSubtasks: [] }))
                  }));
                  setShowCompletionPage(false);
                  setActiveIndex(0);
                }}
              >
                Repeat This Task
              </button>
            </div>
          </div>
        ) : (
          /* Work View */
          <div className={`dashboard-grid ${isFocusMode ? "focus-layout" : ""}`}>
            {/* Sidebar with details and back button */}
            {!isFocusMode && (
              <div className="sidebar-panel glass-panel">
                <button 
                  className="btn btn-secondary btn-icon rounded-back-btn" 
                  onClick={resetActiveTask}
                  title="Back to Search"
                  style={{ width: "36px", height: "36px", borderRadius: "50%", padding: 0, marginBottom: "1rem", flexShrink: 0 }}
                >
                  <ArrowLeft size={16} />
                </button>
                
                <div className="task-list">
                  {activeTask.steps.map((step, idx) => (
                    <button
                      key={step.id}
                      className={`task-item ${idx === activeIndex ? "active" : ""}`}
                      onClick={() => setActiveIndex(idx)}
                    >
                      <div className="flex justify-between w-full items-center gap-2">
                        <span className="task-item-title" style={{ fontSize: "0.95rem", textAlign: "left", flex: 1 }}>
                          {idx + 1}. {step.title}
                        </span>
                        <div className="flex items-center gap-1.5" style={{ flexShrink: 0 }}>
                          {/* Video status indicator */}
                          {step.videoStatus === 'generating' && (
                            <Loader2 size={13} style={{ animation: "spin 1s linear infinite", color: "var(--color-accent)" }} title="Video generating..." />
                          )}
                          {step.videoStatus === 'pending' && (
                            <Clock size={13} style={{ color: "rgba(255,255,255,0.25)" }} title="Video queued" />
                          )}
                          {step.videoStatus === 'error' && (
                            <AlertCircle size={13} style={{ color: "var(--color-error)" }} title="Video generation failed" />
                          )}
                          {step.videoStatus === 'completed' && (
                            <Video size={13} style={{ color: "rgba(255,255,255,0.4)" }} title="Video generated" />
                          )}
                          
                          {/* Complete status */}
                          {step.isCompleted && (
                            <CheckCircle size={14} style={{ color: "var(--color-success)" }} />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Step workspace */}
            <div className="workspace">
              {/* Focus mode top progress bar bar */}
              {isFocusMode && (
                <div className="focus-top-bar glass-panel">
                  <button 
                    className="btn btn-secondary flex items-center gap-1" 
                    onClick={resetActiveTask} 
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                  >
                    <ArrowLeft size={12} /> Exit Task
                  </button>
                  <div className="focus-progress-container">
                    <span className="focus-progress-text">
                      Progress: {activeTask.steps.filter(s => s.isCompleted).length} of {activeTask.steps.length} completed
                    </span>
                    <div className="focus-progress-bar">
                      <div 
                        className="focus-progress-fill" 
                        style={{ width: `${(activeTask.steps.filter(s => s.isCompleted).length / activeTask.steps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setIsFocusMode(false)} 
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                  >
                    Show Outline
                  </button>
                </div>
              )}
              
              {/* Looping video card */}
              {activeTask.steps[activeIndex] && (
                <VideoCard
                  step={activeTask.steps[activeIndex]}
                  geminiApiKey={settings.geminiApiKey}
                  localBackendUrl={settings.localBackendUrl}
                  onVideoGenerated={handleVideoOrSubtaskChange}
                  onRetryVideoGeneration={handleRetryVideoGeneration}
                  isFocusMode={isFocusMode}
                  activeIndex={activeIndex}
                  totalSteps={activeTask.steps.length}
                  onChangeStep={setActiveIndex}
                  onCompleteStep={handleCompleteStep}
                  steps={activeTask.steps}
                >
                  {!isFocusMode && (
                    <TaskTimeline
                      steps={activeTask.steps}
                      activeIndex={activeIndex}
                      onChangeStep={setActiveIndex}
                      onCompleteStep={handleCompleteStep}
                    />
                  )}
                </VideoCard>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
