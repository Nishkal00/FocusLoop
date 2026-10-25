/* ==========================================================
   Main App Controller - State Machine & Navigation
   ========================================================== */
(function () {
    window.ADHD = window.ADHD || {};

    const ASSESSMENT_ORDER = [
        'working-memory',
        'attention',
        'task-initiation',
        'planning',
        'granularity-cognitive-load'
    ];

    let currentStep = -1; // -1 = landing, 0-6 = assessments, 7 = results
    let results = {};
    let header = null;
    let main = null;
    let elapsedSeconds = 0;
    let timerInterval = null;

    function skipAndSaveMockProfile(tier) {
        let severity = "Moderate";
        let classificationName = "Moderate Executive Style";
        let scoreVal = 50;

        if (tier === 1) {
            severity = "Mild/Balanced";
            classificationName = "Balanced Executive Style";
            scoreVal = 80;
        } else if (tier === 3) {
            severity = "Significant";
            classificationName = "Combined Executive Dysfunction Style";
            scoreVal = 30;
        }

        const mockProfile = {
            profile: {
                attention_score: scoreVal,
                working_memory_score: scoreVal,
                task_initiation_score: scoreVal,
                planning_score: scoreVal,
                granularity_preference_score: scoreVal,
                cognitive_load_tolerance_score: scoreVal
            },
            details: {},
            classification: {
                classification: classificationName,
                description: `Mock profile created for ${severity} executive functioning tier.`,
                strengths: ["Dynamic thinking", "Adaptability"],
                challenges: ["Starting friction", "Sequencing complex tasks"],
                advice: `Use tailored granularity settings for ${severity} style.`,
                severity: severity
            },
            traits: {},
            rawAssessmentData: {},
            timestamp: new Date().toISOString(),
            version: '1.1.0'
        };

        localStorage.setItem('adhd_profile', JSON.stringify(mockProfile));
        window.parent.postMessage({ type: 'assessment_complete' }, '*');
    }

    function showSkipTierModal() {
        const overlay = document.createElement('div');
        overlay.className = 'pause-overlay';
        overlay.id = 'skip-tier-overlay';
        overlay.innerHTML = `
            <div class="pause-card skip-card" style="max-width: 500px; text-align: center;">
                <h3 style="margin-bottom: var(--space-md);">Skip Onboarding Assessment</h3>
                <p style="color: var(--text-secondary); margin-bottom: var(--space-lg); font-size: 0.95rem;">Select your profile tier below to directly configure the task planner and skip the cognitive check-ins.</p>
                
                <div style="display: flex; flex-direction: column; gap: var(--space-sm); margin-bottom: var(--space-lg); width: 100%;">
                    <button class="btn btn-secondary w-full tier-btn" data-tier="1" style="text-align: left; padding: var(--space-md); display: block; border: 1px solid var(--border); background: var(--bg-elevated);">
                        <div style="font-weight: 600; color: #ffffff;">Tier 1: Mild / Balanced ADHD</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Generates 4 high-level overview steps.</div>
                    </button>
                    <button class="btn btn-secondary w-full tier-btn" data-tier="2" style="text-align: left; padding: var(--space-md); display: block; border: 1px solid var(--border); background: var(--bg-elevated);">
                        <div style="font-weight: 600; color: #ffffff;">Tier 2: Moderate ADHD</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Generates 6 standard sequential planning steps.</div>
                    </button>
                    <button class="btn btn-secondary w-full tier-btn" data-tier="3" style="text-align: left; padding: var(--space-md); display: block; border: 1px solid var(--border); background: var(--bg-elevated);">
                        <div style="font-weight: 600; color: #ffffff;">Tier 3: Significant / Extreme ADHD</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Generates 8 detailed micro-steps for starting support.</div>
                    </button>
                </div>
                
                <button class="btn btn-ghost" id="close-skip-modal-btn">Cancel</button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        overlay.querySelectorAll('.tier-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tier = parseInt(e.currentTarget.getAttribute('data-tier'));
                skipAndSaveMockProfile(tier);
                overlay.remove();
            });
        });
        
        document.getElementById('close-skip-modal-btn').addEventListener('click', () => {
            overlay.remove();
        });
    }

    function startGlobalTimer() {
        clearInterval(timerInterval);
        elapsedSeconds = 0;
        const timerVal = document.getElementById('timer-sidebar-value');
        if (timerVal) timerVal.textContent = '00:00';
        
        timerInterval = setInterval(() => {
            elapsedSeconds++;
            const mins = Math.floor(elapsedSeconds / 60);
            const secs = elapsedSeconds % 60;
            const display = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            const val = document.getElementById('timer-sidebar-value');
            if (val) val.textContent = display;
        }, 1000);
    }

    function init() {
        header = document.getElementById('app-header');
        main = document.getElementById('main-content');
        
        const existingProfile = window.ADHD.scoring.loadProfile();
        if (existingProfile) {
            currentStep = ASSESSMENT_ORDER.length;
            renderHeader();
            window.ADHD.profile.render(main, existingProfile);
        } else {
            showLanding();
        }
    }

    function renderHeader() {
        const assessments = window.ADHD.assessments;
        const inAssessment = currentStep >= 0 && currentStep < ASSESSMENT_ORDER.length;

        header.innerHTML = `
            <div class="header-inner">
                <div class="header-left">
                    ${inAssessment
                        ? `<button class="back-btn-round" id="back-btn" type="button" aria-label="Go back">←</button>`
                        : ''}
                    <div class="logo">
                        <img src="/focusloop.png" style="height:34px; width:auto; display:block;" alt="FocusLoop">
                    </div>
                </div>
                <div class="header-right flex items-center gap-sm">
                    ${inAssessment
                        ? `<button class="btn btn-ghost btn-sm" id="skip-header-btn" style="color:var(--accent); font-weight:600;">Skip to Planner</button>`
                        : ''}
                </div>
            </div>
            ${currentStep >= 0 && currentStep < ASSESSMENT_ORDER.length ? renderStepperCircles() : ''}`;

        const skipHeaderBtn = document.getElementById('skip-header-btn');
        if (skipHeaderBtn) {
            skipHeaderBtn.addEventListener('click', showSkipTierModal);
        }

        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', prevAssessment);
        }
    }

    function showPauseOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'pause-overlay';
        overlay.id = 'pause-overlay';
        overlay.innerHTML = `
            <div class="pause-card">
                <div class="pause-icon">🌿</div>
                <h3>Take your time</h3>
                <p>Your progress is saved right where you left off. Step away, breathe, stretch - come back whenever you're ready. There's no clock running on this pause.</p>
                <button class="btn btn-primary" id="resume-btn">Resume when ready →</button>
            </div>`;
        document.body.appendChild(overlay);
        const resumeBtn = document.getElementById('resume-btn');
        resumeBtn.addEventListener('click', () => overlay.remove());
        resumeBtn.focus();

        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') overlay.remove();
        });
    }

    function renderStepperCircles() {
        const total = ASSESSMENT_ORDER.length;
        const pct = Math.round((currentStep / total) * 100);
        const currentName = window.ADHD.assessments[ASSESSMENT_ORDER[currentStep]]?.shortName || ASSESSMENT_ORDER[currentStep] || '';
        return `
            <div style="max-width:900px; margin:0.5rem auto 0; padding:0 1rem; box-sizing:border-box;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.3rem;">
                    <span style="font-size:0.75rem; font-weight:600; color:var(--text-secondary);">${currentName} — Step ${currentStep + 1} of ${total}</span>
                    <span style="font-size:0.7rem; font-weight:700; color:var(--accent);">${pct}%</span>
                </div>
                <div style="width:100%; height:6px; background:var(--border); border-radius:3px; overflow:hidden;">
                    <div style="width:${pct}%; height:100%; background:var(--accent); border-radius:3px; transition:width 0.4s ease;"></div>
                </div>
            </div>
        `;
    }

    function showLanding() {
        currentStep = -1;
        results = {};
        renderHeader();

        const assessments = window.ADHD.assessments;

        main.innerHTML = `
            <div class="landing" style="padding-top: var(--space-sm);">
                <h1 style="font-size:2.4rem; font-weight:700; color:#ffffff; margin-bottom:var(--space-md); text-align:center;">Assessment</h1>
                <p style="margin-bottom:var(--space-md); font-size:1rem; line-height:1.5;">Six short, interactive check-ins build a profile of how your brain focuses, remembers, and starts tasks - then we use it to shape instructions around your strengths.</p>

                <div class="calm-banner" style="margin-bottom:var(--space-md);">
                    <span>💬</span>
                    <span><strong>Before you start:</strong> there are no right or wrong answers, nothing is being graded against anyone else, and you can pause at any point - a "Take a break" button stays visible the whole way through.</span>
                </div>

                <div class="landing-features" style="margin-bottom:var(--space-md);">
                    ${ASSESSMENT_ORDER.map(id => {
                        const a = assessments[id];
                        return a ? `<div class="feature-chip"><span>${a.icon}</span><span>${a.shortName || a.name}</span></div>` : '';
                    }).join('')}
                </div>

                <div class="landing-meta" style="margin-bottom:var(--space-md);">
                    <span>⏱ ~8-10 minutes, pause anytime</span>
                    <span>📊 6 short check-ins</span>
                    <span>🔒 Responses are saved anonymously</span>
                </div>

                <button class="btn btn-primary btn-lg" id="start-assessment-btn">
                    Let's start →
                </button>

                ${renderPreviousProfile()}
            </div>`;

        document.getElementById('start-assessment-btn').addEventListener('click', () => {
            nextAssessment();
        });

        const viewPrevBtn = document.getElementById('view-prev-profile');
        if (viewPrevBtn) {
            viewPrevBtn.addEventListener('click', () => {
                const profileData = window.ADHD.scoring.loadProfile();
                if (profileData) {
                    currentStep = ASSESSMENT_ORDER.length;
                    renderHeader();
                    window.ADHD.profile.render(main, profileData);
                }
            });
        }
    }

    function renderPreviousProfile() {
        const prev = window.ADHD.scoring.loadProfile();
        if (!prev) return '';

        const date = new Date(prev.timestamp);
        const dateStr = date.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });

        return `
            <div class="assessment-card" style="margin-top:var(--space-xl);max-width:500px;width:100%;text-align:left">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-sm)">
                    <h4 style="font-size:0.9rem">Previous Profile</h4>
                    <span class="text-xs text-muted">${dateStr}</span>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);margin-bottom:var(--space-md)">
                    ${Object.entries(prev.profile).map(([key, val]) => {
                        const info = window.ADHD.scoring.getDimensionInfo(key);
                        return `<span class="wm-tag" style="font-size:0.75rem">${info.icon} ${val}</span>`;
                    }).join('')}
                </div>
                <button class="btn btn-secondary btn-sm w-full" id="view-prev-profile">View Full Profile</button>
            </div>`;
    }

    function renderAssessmentLayout(assessment, assessmentId) {
        main.innerHTML = `
            <div class="assessment-layout" style="position:relative; width:100%; max-width:900px; margin:0 auto; padding:1rem 0; box-sizing:border-box;">
                <!-- Modules: floated in the left margin -->
                <div style="position:absolute; left:-200px; top:0; width:180px; display:flex; flex-direction:column; gap:0.35rem;">
                    <div style="font-size:0.65rem; font-weight:700; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.08em; padding:0 0.2rem; margin-bottom:0.2rem;">Modules</div>
                    ${ASSESSMENT_ORDER.map((id, idx) => {
                        const a = window.ADHD.assessments[id];
                        const isActive = idx === currentStep;
                        const isDone = idx < currentStep;
                        const statusIcon = isDone ? '✓' : isActive ? '●' : '○';
                        const statusText = isDone ? 'Done' : isActive ? 'Active' : 'Pending';
                        const statusColor = isDone ? 'var(--success)' : isActive ? 'var(--accent)' : 'var(--text-muted)';
                        const bg = isActive ? 'rgba(110,147,214,0.06)' : 'transparent';
                        const border = isActive ? '1px solid var(--accent)' : '1px solid var(--border)';
                        return `
                            <div style="padding:0.4rem 0.5rem; background:${bg}; border:${border}; border-radius:6px; display:flex; align-items:center; gap:0.4rem;">
                                <span style="font-size:1rem; flex-shrink:0;">${a.icon}</span>
                                <div style="min-width:0; flex:1;">
                                    <div style="font-size:0.75rem; font-weight:600; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${a.shortName || a.name}</div>
                                    <div style="font-size:0.6rem; color:${statusColor}; font-weight:500;">${statusIcon} ${statusText}</div>
                                </div>
                            </div>`;
                    }).join('')}
                </div>

                <!-- Timer: floated in the right margin -->
                <div style="position:absolute; right:-200px; top:0; width:180px; display:flex; flex-direction:column; gap:0.5rem;">
                    <button class="btn btn-secondary" id="pause-btn-sidebar" type="button" style="width:100%; border:1px solid var(--border); padding:0.5rem; display:flex; align-items:center; justify-content:center; gap:0.3rem; font-weight:600; font-size:0.8rem; cursor:pointer; background:var(--bg-surface); border-radius:6px;">⏸ Break</button>
                    <div style="padding:0.6rem; background:var(--bg-surface); border:1px solid var(--border); border-radius:6px; text-align:center;">
                        <div style="font-size:0.6rem; color:var(--text-muted); font-weight:700; letter-spacing:0.06em; margin-bottom:0.2rem;">ELAPSED</div>
                        <div id="timer-sidebar-value" style="font-family:var(--font-mono); font-size:1.5rem; color:#ffffff; font-weight:600;">00:00</div>
                    </div>
                    <div style="padding:0.5rem; background:var(--bg-surface); border:1px solid var(--border); border-radius:6px; font-size:0.7rem; color:var(--text-secondary); line-height:1.3;">
                        <div style="font-weight:700; color:#ffffff; margin-bottom:0.15rem; font-size:0.7rem;">About</div>
                        <p style="margin:0;">${assessment.description || 'Evaluates cognitive functions to tailor your experience.'}</p>
                    </div>
                </div>

                <!-- CENTER: Full-width test window -->
                <div class="test-window-container" style="background:var(--bg-surface); border:1px solid var(--border); border-radius:8px; padding:1.5rem; display:flex; flex-direction:column; justify-content:space-between; min-width:0; box-sizing:border-box;">
                    <div id="test-window" class="test-window" style="width:100%;"></div>
                    <div style="margin-top:0.75rem; padding-top:0.75rem; border-top:1px solid var(--border); text-align:center;">
                        <button class="btn btn-secondary" id="skip-checkin-btn" style="border:1px solid var(--border); padding:0.4rem 1rem; font-size:0.85rem; cursor:pointer;">Skip Check-in & Choose Tier</button>
                    </div>
                </div>
            </div>
        `;

        const testWindow = document.getElementById('test-window');
        const pauseBtn = document.getElementById('pause-btn-sidebar');
        const skipBtn = document.getElementById('skip-checkin-btn');

        if (pauseBtn) {
            pauseBtn.addEventListener('click', showPauseOverlay);
        }
        if (skipBtn) {
            skipBtn.addEventListener('click', showSkipTierModal);
        }

        startGlobalTimer();

        return testWindow;
    }

    function prevAssessment() {
        const confirmed = window.confirm(
            currentStep === 0
                ? 'Go back to the start? Your answers on this step will be cleared.'
                : "Go back to the previous check-in? You'll redo it - your answer here will be cleared."
        );
        if (!confirmed) return;

        clearInterval(timerInterval);
        currentStep--;

        if (currentStep < 0) {
            showLanding();
            return;
        }

        renderHeader();

        const assessmentId = ASSESSMENT_ORDER[currentStep];
        const assessment = window.ADHD.assessments[assessmentId];
        delete results[assessmentId];

        main.innerHTML = '';
        main.className = '';

        const testWindow = renderAssessmentLayout(assessment, assessmentId);
        assessment.init(testWindow, (result) => {
            results[assessmentId] = result;
            showTransition(assessment, result);
        });
    }

    function nextAssessment() {
        clearInterval(timerInterval);
        currentStep++;

        if (currentStep >= ASSESSMENT_ORDER.length) {
            showResults();
            return;
        }

        renderHeader();

        const assessmentId = ASSESSMENT_ORDER[currentStep];
        const assessment = window.ADHD.assessments[assessmentId];

        if (!assessment) {
            console.error('Assessment not found:', assessmentId);
            nextAssessment();
            return;
        }

        main.innerHTML = '';
        main.className = '';

        main.style.opacity = '0';
        main.style.transform = 'translateY(16px)';

        requestAnimationFrame(() => {
            main.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            main.style.opacity = '1';
            main.style.transform = 'translateY(0)';
        });

        const testWindow = renderAssessmentLayout(assessment, assessmentId);
        assessment.init(testWindow, (result) => {
            results[assessmentId] = result;
            showTransition(assessment, result);
        });
    }

    function showTransition(assessment, result) {
        clearInterval(timerInterval);
        const isLast = currentStep >= ASSESSMENT_ORDER.length - 1;

        main.innerHTML = `
            <div class="transition-screen">
                <div style="font-size:2.5rem;margin-bottom:var(--space-md)">${assessment.icon}</div>
                <h3>${assessment.name} - done ✓</h3>
                <p style="max-width:360px;margin-top:var(--space-md)">${getTransitionMessage()}</p>

                ${!isLast ? `
                    <div class="mt-lg text-sm text-muted">
                        Next up: ${window.ADHD.assessments[ASSESSMENT_ORDER[currentStep + 1]]?.icon || ''} 
                        ${window.ADHD.assessments[ASSESSMENT_ORDER[currentStep + 1]]?.name || ''}
                        &nbsp;·&nbsp;${ASSESSMENT_ORDER.length - currentStep - 1} to go
                    </div>
                ` : ''}

                <div class="assessment-footer">
                    <button class="btn btn-ghost" id="transition-redo-btn">↺ Redo this one</button>
                    <button class="btn btn-primary btn-lg" id="transition-next-btn">
                        ${isLast ? '📊 View Your Profile' : 'Next Assessment →'}
                    </button>
                </div>
            </div>`;

        document.getElementById('transition-next-btn').addEventListener('click', nextAssessment);
        document.getElementById('transition-next-btn').focus();
        document.getElementById('transition-redo-btn').addEventListener('click', redoCurrentAssessment);
    }

    function redoCurrentAssessment() {
        clearInterval(timerInterval);
        const assessmentId = ASSESSMENT_ORDER[currentStep];
        const assessment = window.ADHD.assessments[assessmentId];
        delete results[assessmentId];

        renderHeader();
        main.innerHTML = '';
        main.className = '';

        const testWindow = renderAssessmentLayout(assessment, assessmentId);
        assessment.init(testWindow, (result) => {
            results[assessmentId] = result;
            showTransition(assessment, result);
        });
    }

    function getTransitionMessage() {
        const messages = [
            'Nice - that\'s one more piece of the picture.',
            'Captured. On to the next one whenever you\'re ready.',
            'Good. Every check-in adds detail, not a grade.',
            'That\'s in. No need to overthink it, keep going.'
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    function showResults() {
        clearInterval(timerInterval);
        currentStep = ASSESSMENT_ORDER.length;
        renderHeader();

        const profileData = window.ADHD.scoring.buildProfile(results);
        window.ADHD.scoring.saveProfile(profileData);
        window.ADHD.profile.render(main, profileData);
    }

    // Public API
    window.ADHD.app = {
        init,
        restart() {
            clearInterval(timerInterval);
            results = {};
            currentStep = -1;
            showLanding();
        },
        getCurrentStep() { return currentStep; },
        getResults() { return results; }
    };

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
