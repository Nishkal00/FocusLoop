import React, { useState } from "react";
import { X, Key, Shield, HardDrive } from "lucide-react";

export default function SettingsModal({ onClose, settings, onSave, onRetake, hasProfile }) {
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || "");
  const [localBackendUrl, setLocalBackendUrl] = useState(settings.localBackendUrl || "http://localhost:8000");
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  const handleSave = () => {
    onSave({
      geminiApiKey: geminiApiKey.trim(),
      localBackendUrl: localBackendUrl.trim() || "http://localhost:8000",
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="flex items-center gap-2">
            <Shield className="text-primary" size={24} style={{ color: "var(--color-primary)" }} />
            App Configuration
          </h2>
          <button className="btn btn-secondary btn-icon" onClick={onClose} style={{ borderRadius: "50%", width: 36, height: 36 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ paddingRight: "0.5rem" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
            FocusLoop uses the **Google Gemini 2.5 Flash API** to generate ADHD-friendly step breakdowns, and your **local Wan 2.1 GGUF model** on your GPU to generate looping video guides.
          </p>

          {/* Gemini API Key */}
          <div className="settings-row" style={{ marginBottom: "1.5rem" }}>
            <label className="settings-label flex items-center gap-2" style={{ fontWeight: 600, marginBottom: "0.5rem", display: "block" }}>
              <Key size={16} style={{ display: "inline", marginRight: "4px", verticalAlign: "text-bottom" }} /> Gemini API Key
            </label>
            <div className="flex gap-2">
              <input
                type={showGeminiKey ? "text" : "password"}
                className="input-field"
                placeholder="AIzaSy..."
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                style={{ flex: 1 }}
              />
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
              >
                {showGeminiKey ? "Hide" : "Show"}
              </button>
            </div>
            <div className="settings-sublabel" style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Get your API key from <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)", textDecoration: "underline" }}>Google AI Studio</a>.
            </div>
          </div>

          {/* Local Backend URL */}
          <div className="settings-row" style={{ marginBottom: "1.5rem" }}>
            <label className="settings-label flex items-center gap-2" style={{ fontWeight: 600, marginBottom: "0.5rem", display: "block" }}>
              <HardDrive size={16} style={{ display: "inline", marginRight: "4px", verticalAlign: "text-bottom" }} /> Local Backend URL
            </label>
            <input
              type="text"
              className="input-field"
              value={localBackendUrl}
              onChange={(e) => setLocalBackendUrl(e.target.value)}
              style={{ width: "100%" }}
            />
            <div className="settings-sublabel" style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Default is <code>http://localhost:8000</code>. Make sure the local python server is running.
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-4" style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "1.5rem" }}>
          <div className="flex gap-2">
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setGeminiApiKey("");
                setLocalBackendUrl("http://localhost:8000");
              }}
            >
              Reset defaults
            </button>
            {hasProfile && (
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  if (confirm("Reset your ADHD cognitive assessment and start fresh?")) {
                    onRetake();
                    onClose();
                  }
                }}
                style={{ color: "#cf666a", borderColor: "rgba(207, 102, 106, 0.2)" }}
              >
                ↻ Retake Assessment
              </button>
            )}
          </div>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
