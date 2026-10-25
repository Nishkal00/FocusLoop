import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Video, AlertTriangle, ArrowLeft, ArrowRight, Clock, Loader2 } from "lucide-react";

export default function VideoCard({ 
  step, 
  geminiApiKey,
  localBackendUrl, 
  onVideoGenerated,
  onRetryVideoGeneration,
  isFocusMode,
  activeIndex,
  totalSteps,
  onChangeStep,
  onCompleteStep,
  steps = [],
  children
}) {
  console.log("VideoCard rendering, step:", step ? step.title : "null");
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(step.duration);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const videoRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Sync state when step changes
  useEffect(() => {
    setTimeLeft(step.duration);
    setIsTimerRunning(false);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [step]);

  // Handle Video Playback Control
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, step.videoUrl]);

  // Handle Timer ticking
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }

    return () => clearInterval(timerIntervalRef.current);
  }, [isTimerRunning]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(step.duration);
  };

  // Calculate queue progress
  const stepsAhead = steps.slice(0, activeIndex).filter(s => s.videoStatus === 'pending' || s.videoStatus === 'generating').length;

  // Format Time: e.g. 120 -> "2:00"
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  // Progress percentage of timer
  const timerPercentage = ((step.duration - timeLeft) / step.duration) * 100;
  
  // Radial SVG calculation
  const radius = 18;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="focus-card glass-panel" style={{ background: "transparent", border: "none", boxShadow: "none" }}>
      {/* Left side: Looping Video Player Column */}
      <div className="flex flex-col gap-4" style={{ minWidth: 0 }}>
        <div className="video-frame" style={{ background: "#000", border: "1px solid rgba(255,255,255,0.08)" }}>
          {step.videoStatus === 'generating' ? (
            <div className="video-placeholder generate-pulse" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", padding: "1.5rem", gap: "0.5rem", boxSizing: "border-box" }}>
              <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "var(--color-accent)" }} />
              <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#ffffff" }}>
                Generating video...
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", maxWidth: "90%" }}>
                Rendering Step {activeIndex + 1} of {totalSteps} guides on your GPU (~30s)
              </span>
            </div>
          ) : step.videoStatus === 'pending' ? (
            <div className="video-placeholder" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", padding: "1.5rem", gap: "0.5rem", boxSizing: "border-box", background: "#16161a" }}>
              <Clock size={28} style={{ color: "rgba(255,255,255,0.3)" }} />
              <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-muted)" }}>
                Waiting in queue
              </span>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textAlign: "center", maxWidth: "90%" }}>
                {stepsAhead > 0 
                  ? `${stepsAhead} step${stepsAhead > 1 ? 's' : ''} ahead of this one` 
                  : "Next up in queue..."}
              </span>
            </div>
          ) : step.videoStatus === 'error' ? (
            <div className="video-placeholder" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", padding: "1.5rem", gap: "0.5rem", boxSizing: "border-box", background: "#16161a" }}>
              <AlertTriangle size={28} style={{ color: "var(--color-error)" }} />
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-error)", display: "block" }}>Generation Failed</span>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", textAlign: "center", maxWidth: "90%", display: "block", marginBottom: "0.5rem" }}>
                {step.videoError || "Unknown error occurred"}
              </span>
              <button 
                className="btn btn-primary" 
                onClick={() => onRetryVideoGeneration(step.id)}
                style={{ 
                  padding: "0.4rem 0.8rem", 
                  fontSize: "0.8rem", 
                  borderRadius: "4px",
                  fontWeight: 600,
                  background: "var(--color-accent)",
                  color: "#ffffff"
                }}
              >
                Retry Generation
              </button>
            </div>
          ) : step.videoUrl ? (
            <>
              <video
                ref={videoRef}
                className="step-video"
                src={step.videoUrl}
                loop
                muted={isMuted}
                playsInline
                onClick={togglePlay}
              />
              {/* Custom overlay controls */}
              <div className="video-overlay flex gap-2">
                <button className="video-control-btn" onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <button className="video-control-btn" onClick={togglePlay} title={isPlaying ? "Pause Video" : "Play Video"}>
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
              </div>
              
              {/* Visual looping indicator */}
              <div style={{ position: "absolute", bottom: "0.5rem", left: "0.75rem", background: "rgba(0,0,0,0.5)", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", color: "rgba(255,255,255,0.7)", pointerEvents: "none" }}>
                Loop active
              </div>
            </>
          ) : (
            <div className="video-placeholder" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", padding: "1.5rem", gap: "0.4rem", boxSizing: "border-box", background: "#16161a" }}>
              <Video size={24} style={{ opacity: 0.5, color: "#ffffff" }} />
              <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)", display: "block" }}>No video generated</span>
              <button 
                className="btn btn-primary" 
                onClick={() => onRetryVideoGeneration(step.id)}
                style={{ 
                  padding: "0.4rem 0.8rem", 
                  fontSize: "0.8rem", 
                  borderRadius: "4px",
                  fontWeight: 600,
                  marginTop: "0.25rem",
                  background: "var(--color-accent)",
                  color: "#ffffff"
                }}
              >
                <Sparkles size={12} style={{ display: "inline", marginRight: "4px", verticalAlign: "text-bottom" }} /> Generate Video
              </button>
            </div>
          )}
        </div>

        {/* Centered Next Step button / Navigation controls */}
        <div className="flex justify-between items-center w-full" style={{ padding: "0.5rem 0", gap: "0.5rem" }}>
          {/* Prev step */}
          <button 
            className="btn btn-secondary btn-icon"
            style={{ width: 36, height: 36, borderRadius: "50%", background: "#22252a", color: "#ffffff", border: "1px solid rgba(255,255,255,0.05)" }}
            disabled={activeIndex === 0}
            onClick={() => onChangeStep(activeIndex - 1)}
            title="Previous Step"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Complete Step button */}
          <button 
            className={`btn ${step.isCompleted ? "btn-secondary" : "btn-primary"}`}
            style={{ 
              padding: "0.5rem 1.5rem", 
              borderRadius: "50px",
              fontSize: "0.85rem",
              fontWeight: 600,
              flex: 1,
              background: step.isCompleted ? "#22252a" : "var(--color-accent)",
              color: "#ffffff",
              border: step.isCompleted ? "1px solid rgba(255,255,255,0.05)" : "none",
              boxShadow: step.isCompleted ? "none" : "0 4px 12px var(--color-accent-shadow)"
            }}
            onClick={() => onCompleteStep(step.index)}
          >
            {step.isCompleted ? "Completed ✓" : "Complete Step"}
          </button>

          {/* Next step */}
          <button 
            className="btn btn-secondary btn-icon"
            style={{ width: 36, height: 36, borderRadius: "50%", background: "#22252a", color: "#ffffff", border: "1px solid rgba(255,255,255,0.05)" }}
            disabled={activeIndex === totalSteps - 1}
            onClick={() => onChangeStep(activeIndex + 1)}
            title="Next Step"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Right side: ADHD instructions & subtasks */}
      <div className="instruction-panel flex flex-col gap-4" style={{ minWidth: 0 }}>
        <div className="flex justify-between items-start w-full gap-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1rem" }}>
          <div className="step-details" style={{ textAlign: "left", flex: 1 }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#ffffff", marginBottom: "0.25rem" }}>{step.title}</h2>
            <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.4, margin: "0" }}>{step.description}</p>
          </div>
          
          {/* Visual timer next to the step details */}
          <div className="visual-timer flex items-center gap-2" style={{ background: "#16161a", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <svg width="24" height="24" style={{ transform: "rotate(-90deg)" }}>
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="transparent"
                stroke="#22252a"
                strokeWidth="2"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="transparent"
                stroke="var(--color-accent)"
                strokeWidth="2"
                strokeDasharray={2 * Math.PI * 10}
                strokeDashoffset={(2 * Math.PI * 10) - (timerPercentage / 100) * (2 * Math.PI * 10)}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
              />
            </svg>
            <div className="timer-number" style={{ fontSize: "0.9rem", minWidth: "30px", fontWeight: 600, color: "#ffffff" }}>{formatTime(timeLeft)}</div>
            <button className="btn btn-secondary btn-icon" onClick={toggleTimer} style={{ width: 20, height: 20, borderRadius: "50%", background: "#22252a", color: "#ffffff", padding: 0, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {isTimerRunning ? <Pause size={8} /> : <Play size={8} />}
            </button>
            <button className="btn btn-secondary btn-icon" onClick={resetTimer} style={{ width: 20, height: 20, borderRadius: "50%", background: "#22252a", color: "#ffffff", padding: 0, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <RotateCcw size={8} />
            </button>
          </div>
        </div>

        {/* Visual progress bar at step level / checklist */}
        {step.subtasks && step.subtasks.length > 0 && (
          <div className="checklist-container" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {step.subtasks.map((sub, sIdx) => {
              const isSubChecked = step.checkedSubtasks?.includes(sIdx);
              return (
                <div 
                  key={sIdx}
                  className={`checklist-item ${isSubChecked ? "checked" : ""}`}
                  style={{ 
                    background: isSubChecked ? "rgba(110, 147, 214, 0.04)" : "#16161a", 
                    border: "1px solid rgba(255,255,255,0.08)", 
                    borderRadius: "8px", 
                    padding: "1rem 1.25rem", 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "1rem" 
                  }}
                  onClick={() => onVideoGenerated(step.id, null, sIdx)} // Trigger toggle event
                >
                  <div className="checkbox-circle" style={{ 
                    border: "2px solid rgba(255,255,255,0.4)", 
                    background: "transparent",
                    flexShrink: 0,
                    width: "20px",
                    height: "20px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isSubChecked ? "#cf666a" : "transparent",
                    fontSize: "0.95rem",
                    fontWeight: "bold",
                    transition: "all 0.12s ease"
                  }}>
                    ✓
                  </div>
                  <span className="checklist-text" style={{ 
                    color: isSubChecked ? "var(--text-muted)" : "#ffffff",
                    fontSize: "0.95rem",
                    lineHeight: "1.4",
                    fontWeight: "500",
                    textAlign: "left"
                  }}>{sub}</span>
                </div>
              );
            })}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
