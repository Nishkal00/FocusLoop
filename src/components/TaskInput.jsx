import React, { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

export default function TaskInput({ onSubmit, isLoading }) {
  const [task, setTask] = useState("");

  const suggestions = [
    { label: "☕ Make Latte", value: "make a latte" },
    { label: "🛢️ Change Motor Oil", value: "change motor oil" },
    { label: "🛞 Change Car Tyre", value: "change a car tyre" },
    { label: "🥞 Make Pancakes", value: "make pancakes" },
    { label: "🦷 Brush Teeth", value: "brush teeth" }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (task.trim()) {
      onSubmit(task.trim());
    }
  };

  return (
    <div className="input-panel glass-panel" style={{ background: "#16161a", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
      <div className="brand-icon" style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(255,255,255,0.03)" }}>
        <Sparkles size={24} style={{ color: "#ffffff" }} />
      </div>
      <h2 className="input-title" style={{ color: "#ffffff", fontSize: "1.5rem" }}>Tasks you want to do</h2>
      <p className="input-subtitle" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
        Type any task or select a shortcut. Gemini will break it down into steps, and the local GPU will render a looping video guide.
      </p>

      {isLoading ? (
        <div className="w-full flex flex-col items-center gap-4 mt-4" style={{ padding: "1rem" }}>
          <div className="loading-spinner"></div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.95rem", fontWeight: 500 }}>
            Gemini is organizing your task steps. Just a moment...
          </div>
          <div className="progress-loader">
            <div className="progress-loader-bar"></div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="input-group" style={{ background: "#0c0c0e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius-md)" }}>
            <input
              type="text"
              className="input-field"
              placeholder="What task would you like to accomplish?"
              value={task}
              disabled={isLoading}
              onChange={(e) => setTask(e.target.value)}
              style={{ color: "#ffffff", background: "transparent" }}
              autoFocus
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!task.trim() || isLoading}
              style={{ borderRadius: "var(--radius-sm)", background: "var(--color-accent)", color: "#ffffff" }}
            >
              Generate Steps <ArrowRight size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-2 w-full text-center">
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>
              PRE-DESIGNED SIMPLE TASKS
            </div>
            <div className="flex justify-center" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.value}
                  type="button"
                  className="btn btn-secondary"
                  style={{ 
                    padding: "0.4rem 0.8rem", 
                    fontSize: "0.85rem",
                    borderRadius: "4px",
                    background: "#22252a",
                    border: "1px solid rgba(255,255,255,0.05)",
                    color: "#ffffff"
                  }}
                  onClick={() => {
                    setTask(suggestion.value);
                    onSubmit(suggestion.value);
                  }}
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
