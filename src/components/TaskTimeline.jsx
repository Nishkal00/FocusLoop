import React from "react";

export default function TaskTimeline({ steps, activeIndex, onChangeStep, onCompleteStep }) {
  const completedCount = steps.filter(s => s.isCompleted).length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <div style={{
      background: "#16161a",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "8px",
      padding: "0.75rem 1rem",
    }}>
      {/* Label row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#ffffff" }}>
          Step {activeIndex + 1} of {steps.length} — {steps[activeIndex]?.title || ""}
        </span>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-accent, #6e93d6)" }}>
          {progressPercent}%
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        width: "100%",
        height: "8px",
        background: "rgba(255,255,255,0.08)",
        borderRadius: "4px",
        overflow: "hidden",
      }}>
        <div style={{
          width: `${progressPercent}%`,
          height: "100%",
          background: "var(--color-accent, #6e93d6)",
          borderRadius: "4px",
          transition: "width 0.4s ease",
        }} />
      </div>

      {/* Completed count */}
      <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #888)", marginTop: "0.3rem" }}>
        {completedCount} of {steps.length} steps completed
      </div>
    </div>
  );
}
