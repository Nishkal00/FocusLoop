/* ==========================================================
   Task Initiation Assessment Module (Revised: Multiple Choice)
   ========================================================== */
(function () {
    window.ADHD = window.ADHD || {};
    window.ADHD.assessments = window.ADHD.assessments || {};

    const SCENARIOS = [
        {
            task: 'Organize your study desk.',
            icon: '✏️',
            options: [
                { id: 'concrete', text: 'Clear off all items from the desk surface and group them on the bed.', points: 100, label: 'Physical/Actionable' },
                { id: 'vague', text: 'Think about how to sort my papers and books.', points: 40, label: 'Mental/Vague' },
                { id: 'delay', text: 'Tell myself I will clean the desk tomorrow morning.', points: 10, label: 'Procrastination/Delay' },
                { id: 'stuck', text: 'Stare at the clutter and feel unsure where to start.', points: 0, label: 'Unsure/Paralyzed' }
            ]
        },
        {
            task: 'Start working on a new school/work project.',
            icon: '💻',
            options: [
                { id: 'concrete', text: 'Open my laptop, create a document named \'Project Outline\', and write the title.', points: 100, label: 'Physical/Actionable' },
                { id: 'vague', text: 'Re-read the project prompt to understand the requirements.', points: 40, label: 'Mental/Vague' },
                { id: 'delay', text: 'Check my email or browse social media to clear my mind first.', points: 10, label: 'Procrastination/Delay' },
                { id: 'stuck', text: 'Feel overwhelmed by the size of the project and put it off.', points: 0, label: 'Unsure/Paralyzed' }
            ]
        },
        {
            task: 'Clean your cluttered kitchen.',
            icon: '🍳',
            options: [
                { id: 'concrete', text: 'Collect all dirty glasses and plates and put them in the sink.', points: 100, label: 'Physical/Actionable' },
                { id: 'vague', text: 'Decide whether to clean the counter or wash dishes first.', points: 40, label: 'Mental/Vague' },
                { id: 'delay', text: 'Grab a snack and sit down until I feel more motivated.', points: 10, label: 'Procrastination/Delay' },
                { id: 'stuck', text: 'Look at the dirty kitchen and feel completely paralyzed.', points: 0, label: 'Unsure/Paralyzed' }
            ]
        },
        {
            task: 'Pay a stack of bills/mail.',
            icon: '✉️',
            options: [
                { id: 'concrete', text: 'Open the top letter on the stack and sit with a pen and phone.', points: 100, label: 'Physical/Actionable' },
                { id: 'vague', text: 'Sort the stack into \'urgent\' and \'not urgent\' piles.', points: 40, label: 'Mental/Vague' },
                { id: 'delay', text: 'Put the stack in a drawer so I don\'t have to look at it now.', points: 10, label: 'Procrastination/Delay' },
                { id: 'stuck', text: 'Avoid opening them because I don\'t know how much I owe.', points: 0, label: 'Unsure/Paralyzed' }
            ]
        },
        {
            task: 'Clean your entire bedroom.',
            icon: '🛏️',
            options: [
                { id: 'concrete', text: 'Pick up all clothes from the floor and throw them into the laundry hamper.', points: 100, label: 'Physical/Actionable' },
                { id: 'vague', text: 'Look around the room and make a mental list of what is messy.', points: 40, label: 'Mental/Vague' },
                { id: 'delay', text: 'Lie down on the bed and browse my phone to relax first.', points: 10, label: 'Procrastination/Delay' },
                { id: 'stuck', text: 'Feel defeated by the mess and leave the room.', points: 0, label: 'Unsure/Paralyzed' }
            ]
        }
    ];

    let container = null;
    let onComplete = null;
    let currentScenario = 0;
    let scenarioResults = [];
    let scenarioStartTime = 0;
    let shuffledOptions = [];

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function renderIntro() {
        container.innerHTML = `
            <div class="assessment-header">
                <div class="assessment-icon">🚀</div>
                <h2>Task Initiation</h2>
                <p>Assess your natural approach to initiating daily tasks and identify actionable first steps.</p>
            </div>
            <div class="assessment-card">
                <div class="assessment-instructions">
                    <strong>How it works:</strong><br>
                    • You will be presented with <strong>5 daily scenarios</strong><br>
                    • For each scenario, select the action that matches what you would <strong>actually</strong> do first<br>
                    • Be honest! There are no wrong answers - this measures your natural initiation style<br>
                    • Your response speed and action choice will determine your profile score
                </div>
                <div class="assessment-footer">
                    <button class="btn btn-primary btn-lg" id="ti-start-btn">Start</button>
                </div>
            </div>`;
        document.getElementById('ti-start-btn').addEventListener('click', startAssessment);
    }

    function startAssessment() {
        currentScenario = 0;
        scenarioResults = [];
        showScenario();
    }

    function showScenario() {
        const scenario = SCENARIOS[currentScenario];
        shuffledOptions = shuffle(scenario.options);
        scenarioStartTime = performance.now();

        let firstClickTime = null;
        let firstClickedOptionType = null;
        let selectedOptionIndex = null;
        let revisionCount = 0;

        container.innerHTML = `
            <div class="assessment-header">
                <div class="round-badge">Scenario ${currentScenario + 1} of ${SCENARIOS.length}</div>
                <h2>What would you do first?</h2>
                <p>Imagine you have to complete the following task:</p>
            </div>
            <div class="assessment-card">
                <div class="ti-scenario" style="text-align: center; padding: var(--space-md); margin-bottom: var(--space-lg)">
                    <div style="font-size: 3rem; margin-bottom: var(--space-sm)">${scenario.icon}</div>
                    <div class="ti-scenario-text" style="font-size: 1.35rem; font-weight: 600; color: var(--accent)">"${scenario.task}"</div>
                </div>
                <div class="ti-options-list" id="ti-options-container" style="display:flex;flex-direction:column;gap:var(--space-sm)">
                    ${shuffledOptions.map((opt, idx) => `
                        <button class="ti-option-btn btn-choice" data-index="${idx}" id="ti-opt-${idx}" style="text-align:left;padding:var(--space-md);border:1px solid var(--border);border-radius:var(--radius-md);background:rgba(255,255,255,0.02);cursor:pointer;color:var(--text-primary);transition:all 0.2s">
                            ${opt.text}
                        </button>
                    `).join('')}
                </div>
                <div class="assessment-footer">
                    <button class="btn btn-primary" id="ti-commit-btn" style="margin-top: var(--space-lg); width: 100%" disabled>Commit Action</button>
                </div>
            </div>`;

        const btns = container.querySelectorAll('.ti-option-btn');
        const commitBtn = document.getElementById('ti-commit-btn');

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                const selected = shuffledOptions[idx];
                const currentTime = performance.now();

                if (firstClickTime === null) {
                    firstClickTime = currentTime;
                    firstClickedOptionType = selected.id;
                } else if (selectedOptionIndex !== idx) {
                    revisionCount++;
                }

                selectedOptionIndex = idx;

                btns.forEach((b, bi) => {
                    if (bi === idx) {
                        b.classList.add('selected');
                        b.style.borderColor = 'var(--accent)';
                        b.style.background = 'var(--accent-dim)';
                    } else {
                        b.classList.remove('selected');
                        b.style.borderColor = 'rgba(255,255,255,0.1)';
                        b.style.background = 'rgba(255,255,255,0.02)';
                    }
                });

                commitBtn.disabled = false;
            });
        });

        commitBtn.addEventListener('click', () => {
            if (selectedOptionIndex === null) return;
            const finalSelected = shuffledOptions[selectedOptionIndex];
            const totalTimeTaken = performance.now() - scenarioStartTime;
            const decisionLatency = firstClickTime - scenarioStartTime;

            recordResponse({
                finalSelected,
                firstClickedOptionType,
                decisionLatency,
                revisionCount,
                totalTimeTaken
            });
        });
    }

    function recordResponse(result) {
        scenarioResults.push({
            scenarioIndex: currentScenario + 1,
            task: SCENARIOS[currentScenario].task,
            selectedOptionText: result.finalSelected.text,
            selectedOptionType: result.finalSelected.id,
            firstClickedOptionType: result.firstClickedOptionType,
            points: result.finalSelected.points,
            decisionLatencyMs: Math.round(result.decisionLatency),
            revisionCount: result.revisionCount,
            timeTakenMs: Math.round(result.totalTimeTaken)
        });

        currentScenario++;
        if (currentScenario < SCENARIOS.length) {
            showScenario();
        } else {
            finishAssessment();
        }
    }

    function finishAssessment() {
        const avgPoints = scenarioResults.reduce((s, r) => s + r.points, 0) / scenarioResults.length;
        const avgRevisions = scenarioResults.reduce((s, r) => s + r.revisionCount, 0) / scenarioResults.length;
        const avgLatency = scenarioResults.reduce((s, r) => s + r.decisionLatencyMs, 0) / scenarioResults.length / 1000;

        const hesitationPenalty = avgRevisions * 5;
        const latencyPenalty = avgLatency > 5 ? Math.min(20, (avgLatency - 5) * 4) : 0;

        const finalScore = Math.max(0, Math.min(100, Math.round(avgPoints - hesitationPenalty - latencyPenalty)));

        onComplete({
            score: finalScore,
            metrics: {
                scenarios: scenarioResults,
                avgPoints: Math.round(avgPoints),
                avgRevisions: Math.round(avgRevisions * 10) / 10,
                avgLatencySeconds: Math.round(avgLatency * 10) / 10,
                hesitationPenalty: Math.round(hesitationPenalty),
                latencyPenalty: Math.round(latencyPenalty)
            }
        });
    }

    window.ADHD.assessments['task-initiation'] = {
        id: 'task-initiation',
        name: 'Task Initiation',
        icon: '🚀',
        shortName: 'Initiation',
        description: 'Measures ability to identify concrete physical steps and start tasks',
        profileKey: 'task_initiation_score',
        init(el, done) {
            container = el;
            onComplete = done;
            renderIntro();
        }
    };
})();
