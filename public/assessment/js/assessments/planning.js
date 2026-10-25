/* ==========================================================
   Planning Assessment Module
   ========================================================== */
(function () {
    window.ADHD = window.ADHD || {};
    window.ADHD.assessments = window.ADHD.assessments || {};

    const ROUNDS = [
        {
            instruction: 'Arrange these daily tasks into the most efficient schedule, considering dependencies and time constraints.',
            tasks: [
                { id: 'morning', text: 'Morning Routine (Get ready, eat breakfast, get ready to leave)', optimalPos: 0 },
                { id: 'laundry', text: 'Start Laundry Load (Sort clothes, start washing machine to run in background)', optimalPos: 1 },
                { id: 'class', text: 'Attend Lecture Class (10:00 AM - 12:00 PM; learn new concepts)', optimalPos: 2 },
                { id: 'meeting', text: 'Attend Project Meeting (2:00 PM - 3:00 PM; sync with team)', optimalPos: 3 },
                { id: 'assignment', text: 'Complete Homework Assignment (Write report based on lecture notes)', optimalPos: 4 }
            ],
            hint: 'Consider: laundry runs in the background while you do other tasks; homework requires class knowledge; morning routine must start the day.'
        }
    ];

    let container = null;
    let onComplete = null;
    let currentRound = 0;
    let roundResults = [];
    let roundStartTime = 0;
    let currentOrder = [];

    let revisionCount = 0;
    let dragCount = 0;

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
                <div class="assessment-icon">📋</div>
                <h2>Planning & Sequencing</h2>
                <p>Test your ability to organize daily tasks in a logical order.</p>
            </div>
            <div class="assessment-card">
                <div class="assessment-instructions">
                    <strong>How it works:</strong><br>
                    • You'll be given a set of <strong>5 daily tasks</strong> to arrange in order<br>
                    • Drag and drop (or use arrow buttons) to reorder them<br>
                    • Consider <strong>dependencies</strong>, <strong>time constraints</strong>, and <strong>multitasking efficiency</strong><br>
                    • Try to find the most optimal flow to finish the day
                </div>
                <div class="assessment-footer">
                    <button class="btn btn-primary btn-lg" id="plan-start-btn">Start</button>
                </div>
            </div>`;
        document.getElementById('plan-start-btn').addEventListener('click', showRound);
    }

    function showRound() {
        const round = ROUNDS[currentRound];
        currentOrder = shuffle(round.tasks.map(t => ({ ...t })));
        roundStartTime = performance.now();
        revisionCount = 0;
        dragCount = 0;
        renderRound(round);
    }

    function renderRound(round) {
        container.innerHTML = `
            <div class="assessment-header">
                <div class="round-badge">Planning Scenario • ${round.tasks.length} tasks</div>
                <h2>${round.instruction}</h2>
                <p class="text-sm text-muted" style="margin-top:var(--space-sm)">${round.hint}</p>
            </div>
            <div class="assessment-card">
                <ul class="plan-task-list" id="plan-list"></ul>
                <div class="assessment-footer">
                    <button class="btn btn-primary" id="plan-submit-btn">Submit Schedule</button>
                </div>
            </div>`;

        renderList();

        document.getElementById('plan-submit-btn').addEventListener('click', scoreRound);
    }

    function renderList() {
        const list = document.getElementById('plan-list');
        if (!list) return;

        list.innerHTML = currentOrder.map((task, i) => `
            <li class="plan-task-item" draggable="true" data-index="${i}">
                <span class="plan-drag-handle">⠿</span>
                <span class="plan-task-number">${i + 1}</span>
                <span class="plan-task-text">${task.text}</span>
                <span class="plan-move-btns">
                    <button class="plan-move-btn" data-dir="up" data-index="${i}" ${i === 0 ? 'disabled' : ''}>▲</button>
                    <button class="plan-move-btn" data-dir="down" data-index="${i}" ${i === currentOrder.length - 1 ? 'disabled' : ''}>▼</button>
                </span>
            </li>`).join('');

        // Arrow button handlers
        list.querySelectorAll('.plan-move-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                const dir = btn.dataset.dir;
                if (dir === 'up' && idx > 0) {
                    [currentOrder[idx], currentOrder[idx - 1]] = [currentOrder[idx - 1], currentOrder[idx]];
                } else if (dir === 'down' && idx < currentOrder.length - 1) {
                    [currentOrder[idx], currentOrder[idx + 1]] = [currentOrder[idx + 1], currentOrder[idx]];
                }
                revisionCount++;
                renderList();
            });
        });

        // Drag and drop
        let dragIndex = null;

        list.querySelectorAll('.plan-task-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                dragIndex = parseInt(item.dataset.index);
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                dragCount++;
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                list.querySelectorAll('.plan-task-item').forEach(el => el.classList.remove('drag-over'));
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                item.classList.add('drag-over');
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const dropIndex = parseInt(item.dataset.index);
                if (dragIndex !== null && dragIndex !== dropIndex) {
                    const moved = currentOrder.splice(dragIndex, 1)[0];
                    currentOrder.splice(dropIndex, 0, moved);
                    revisionCount++;
                    renderList();
                }
                dragIndex = null;
            });
        });
    }

    function kendallTauDistance(userOrder, optimalOrder) {
        const n = userOrder.length;
        let inversions = 0;
        const maxInversions = (n * (n - 1)) / 2;

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const userI = userOrder[i];
                const userJ = userOrder[j];
                const optI = optimalOrder.indexOf(userI);
                const optJ = optimalOrder.indexOf(userJ);
                if ((optI - optJ) * (i - j) < 0) {
                    inversions++;
                }
            }
        }

        return maxInversions > 0 ? 1 - (inversions / maxInversions) : 1;
    }

    function scoreRound() {
        const timeTaken = performance.now() - roundStartTime;
        const round = ROUNDS[currentRound];

        const optimal = ['morning', 'laundry', 'class', 'meeting', 'assignment'];
        const userOrder = currentOrder.map(t => t.id);

        // Calculate dependency violations
        let violations = 0;
        const morningIdx = userOrder.indexOf('morning');
        const laundryIdx = userOrder.indexOf('laundry');
        const classIdx = userOrder.indexOf('class');
        const meetingIdx = userOrder.indexOf('meeting');
        const assignmentIdx = userOrder.indexOf('assignment');

        // Rule 1: Morning Routine must be first
        if (morningIdx !== 0) violations++;
        // Rule 2: Start Laundry before Class so it runs concurrently
        if (laundryIdx > classIdx) violations++;
        // Rule 3: Attend Class before Assignment
        if (classIdx > assignmentIdx) violations++;
        // Rule 4: Class is morning (10 AM), Meeting is afternoon (2 PM)
        if (classIdx > meetingIdx) violations++;

        // Sequencing similarity (Kendall Tau)
        const tau = kendallTauDistance(userOrder, optimal);
        const sequencingScore = tau * 100;

        // Efficiency score (revisions and drag events)
        const efficiencyScore = revisionCount <= 8 ? 10 : revisionCount <= 15 ? 5 : 0;

        // Combined score formula
        const dependencyRatio = Math.max(0, 1 - (violations / 4));
        const roundScore = Math.min(100, Math.round(
            sequencingScore * 0.50 +
            dependencyRatio * 40 +
            efficiencyScore
        ));

        // Check which positions are correct
        const positionCorrect = userOrder.map((id, i) => id === optimal[i]);

        roundResults.push({
            round: currentRound + 1,
            taskCount: round.tasks.length,
            userOrder,
            optimalOrder: optimal,
            tau: Math.round(tau * 100) / 100,
            violations,
            revisionCount,
            dragCount,
            timeTakenMs: Math.round(timeTaken),
            score: roundScore,
            positionCorrect
        });

        showRoundResult(roundScore, positionCorrect, optimal, violations);
    }

    function showRoundResult(score, positionCorrect, optimal, violations) {
        const round = ROUNDS[currentRound];
        const scoreColor = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--amber)' : 'var(--danger)';

        container.innerHTML = `
            <div class="transition-screen">
                <div class="score-reveal" style="color:${scoreColor}">${score}</div>
                <h3>Planning Score</h3>
                <p>${getOrderFeedback(score, violations)}</p>
                <div style="max-width:450px;width:100%;margin-top:var(--space-lg)">
                    <div class="text-sm text-muted mb-md">Optimal Schedule Order:</div>
                    <ul class="plan-task-list">
                        ${optimal.map((id, i) => {
                            const task = round.tasks.find(t => t.id === id);
                            const isCorrect = positionCorrect[i];
                            return `<li class="plan-task-item" style="border-color:${isCorrect ? 'var(--success)' : 'var(--danger)'}">
                                <span class="plan-task-number" style="background:${isCorrect ? 'var(--success-dim)' : 'var(--danger-dim)'};border-color:${isCorrect ? 'var(--success)' : 'var(--danger)'};color:${isCorrect ? 'var(--success)' : 'var(--danger)'}">${i + 1}</span>
                                <span class="plan-task-text">${task.text}</span>
                                <span style="color:${isCorrect ? 'var(--success)' : 'var(--danger)'}">${isCorrect ? '✓' : '✗'}</span>
                            </li>`;
                        }).join('')}
                    </ul>
                </div>
                <div class="assessment-footer">
                    <button class="btn btn-primary btn-lg" id="plan-next-btn">Complete Assessment</button>
                </div>
            </div>`;

        document.getElementById('plan-next-btn').addEventListener('click', () => {
            finishAssessment();
        });
    }

    function getOrderFeedback(score, violations) {
        if (violations === 0) return 'Perfect schedule planning! You arranged all tasks optimally without breaking any dependencies.';
        if (violations === 1) return 'Good planning. Only one dependency or constraint was violated. Good job!';
        if (violations <= 2) return 'Decent sequence. A couple of dependency conflicts are present (like starting laundry too late).';
        return 'Planning this schedule was tough. Resolving dependencies makes task lists much smoother.';
    }

    function finishAssessment() {
        const avgScore = Math.round(
            roundResults.reduce((s, r) => s + r.score, 0) / roundResults.length
        );

        onComplete({
            score: avgScore,
            metrics: {
                rounds: roundResults
            }
        });
    }

    window.ADHD.assessments['planning'] = {
        id: 'planning',
        name: 'Planning & Sequencing',
        icon: '📋',
        shortName: 'Planning',
        description: 'Measures task sequencing and planning ability',
        profileKey: 'planning_score',
        init(el, done) {
            container = el;
            onComplete = done;
            currentRound = 0;
            roundResults = [];
            renderIntro();
        }
    };
})();
