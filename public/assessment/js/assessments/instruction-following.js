/* ==========================================================
   Instruction Following Assessment Module
   ========================================================== */
(function () {
    window.ADHD = window.ADHD || {};
    window.ADHD.assessments = window.ADHD.assessments || {};

    const ROUNDS = [
        {
            name: 'Simple Drawing',
            steps: [
                { id: 's1', text: 'Draw a square', icon: '⬜' },
                { id: 's2', text: 'Put a dot inside the square', icon: '•' },
                { id: 's3', text: 'Write your initials below the square', icon: '✍️' }
            ]
        },
        {
            name: 'Complex Drawing',
            steps: [
                { id: 'c1', text: 'Draw a circle in the center', icon: '⭕' },
                { id: 'c2', text: 'Draw a triangle inside the circle', icon: '△' },
                { id: 'c3', text: 'Color the triangle with any color', icon: '🎨' },
                { id: 'c4', text: 'Draw an arrow pointing right, below everything', icon: '→' },
                { id: 'c5', text: 'Write today\'s date next to the arrow', icon: '📅' }
            ]
        }
    ];

    const COLORS = [
        '#e4e7f1', '#8b7cf7', '#f0a050', '#4ade80', '#f87171',
        '#38bdf8', '#fb923c', '#a78bfa', '#fbbf24', '#f472b6'
    ];

    let container = null;
    let onComplete = null;
    let currentRound = 0;
    let roundResults = [];
    let canvas = null;
    let ctx = null;
    let isDrawing = false;
    let currentTool = 'pen';
    let currentColor = '#e4e7f1';
    let lineWidth = 3;
    let completedSteps = [];
    let completionOrder = [];
    let stepStartTimes = {};
    let roundStartTime = 0;
    let drawHistory = [];

    function renderIntro() {
        container.innerHTML = `
            <div class="assessment-header">
                <div class="assessment-icon">📝</div>
                <h2>Instruction Following</h2>
                <p>Follow multi-step drawing instructions accurately and in order.</p>
            </div>
            <div class="assessment-card">
                <div class="assessment-instructions">
                    <strong>How it works:</strong><br>
                    • You'll see a set of instructions on the right<br>
                    • Use the drawing canvas on the left to follow each instruction<br>
                    • <strong>Click each step</strong> when you've completed it<br>
                    • Try to follow them <strong>in order</strong><br>
                    • There are <strong>2 rounds</strong> with increasing complexity
                </div>
                <div class="assessment-footer">
                    <button class="btn btn-primary btn-lg" id="if-start-btn">Start</button>
                </div>
            </div>`;
        document.getElementById('if-start-btn').addEventListener('click', showRound);
    }

    function showRound() {
        const round = ROUNDS[currentRound];
        completedSteps = [];
        completionOrder = [];
        stepStartTimes = {};
        roundStartTime = performance.now();
        drawHistory = [];

        container.innerHTML = `
            <div class="assessment-header">
                <div class="round-badge">Round ${currentRound + 1} of ${ROUNDS.length} • ${round.name}</div>
                <h2>Follow the Instructions</h2>
            </div>
            <div class="if-workspace">
                <div>
                    <div class="if-canvas-wrap">
                        <canvas class="if-canvas" id="if-canvas" width="520" height="380"></canvas>
                        <div class="if-toolbar" id="if-toolbar">
                            <button class="btn btn-icon btn-secondary active" data-tool="pen" title="Pen">✏️</button>
                            <button class="btn btn-icon btn-secondary" data-tool="rect" title="Rectangle">⬜</button>
                            <button class="btn btn-icon btn-secondary" data-tool="circle" title="Circle">⭕</button>
                            <button class="btn btn-icon btn-secondary" data-tool="triangle" title="Triangle">△</button>
                            <button class="btn btn-icon btn-secondary" data-tool="text" title="Text">T</button>
                            <span style="width:1px;background:var(--border);margin:0 4px"></span>
                            <button class="btn btn-icon btn-secondary" data-tool="undo" title="Undo">↩</button>
                            <button class="btn btn-icon btn-secondary" data-tool="clear" title="Clear">🗑</button>
                        </div>
                    </div>
                    <div class="if-color-palette mt-sm" id="if-colors">
                        ${COLORS.map(c => `<div class="if-color-swatch${c === currentColor ? ' active' : ''}" data-color="${c}" style="background:${c}"></div>`).join('')}
                    </div>
                </div>
                <div class="if-sidebar">
                    <h4 style="margin-bottom:var(--space-sm)">Instructions</h4>
                    <p class="text-sm text-muted mb-md">Click each step when you've completed it.</p>
                    <ul class="if-instructions-list" id="if-steps">
                        ${round.steps.map((step, i) => `
                            <li class="if-instruction-item" data-step="${step.id}" data-index="${i}">
                                <span class="step-num">${i + 1}</span>
                                <span>${step.text}</span>
                            </li>
                        `).join('')}
                    </ul>
                    <div class="assessment-footer" style="margin-top:auto">
                        <button class="btn btn-primary w-full" id="if-done-btn">Done with Round</button>
                    </div>
                </div>
            </div>`;

        initCanvas();
        initToolbar();
        initStepChecks();

        document.getElementById('if-done-btn').addEventListener('click', scoreRound);
    }

    function initCanvas() {
        canvas = document.getElementById('if-canvas');
        ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1e32';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let startX, startY;

        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            startX = (e.clientX - rect.left) * (canvas.width / rect.width);
            startY = (e.clientY - rect.top) * (canvas.height / rect.height);

            if (currentTool === 'pen') {
                isDrawing = true;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.strokeStyle = currentColor;
                ctx.lineWidth = lineWidth;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing || currentTool !== 'pen') return;
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            ctx.lineTo(x, y);
            ctx.stroke();
        });

        canvas.addEventListener('mouseup', (e) => {
            if (currentTool === 'pen') {
                isDrawing = false;
                ctx.closePath();
                saveState();
            } else {
                const rect = canvas.getBoundingClientRect();
                const endX = (e.clientX - rect.left) * (canvas.width / rect.width);
                const endY = (e.clientY - rect.top) * (canvas.height / rect.height);
                drawShape(startX, startY, endX, endY);
            }
        });

        canvas.addEventListener('mouseleave', () => {
            if (isDrawing) {
                isDrawing = false;
                ctx.closePath();
                saveState();
            }
        });

        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            startX = (touch.clientX - rect.left) * (canvas.width / rect.width);
            startY = (touch.clientY - rect.top) * (canvas.height / rect.height);
            if (currentTool === 'pen') {
                isDrawing = true;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.strokeStyle = currentColor;
                ctx.lineWidth = lineWidth;
                ctx.lineCap = 'round';
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!isDrawing || currentTool !== 'pen') return;
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
            ctx.lineTo(x, y);
            ctx.stroke();
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (currentTool === 'pen') {
                isDrawing = false;
                ctx.closePath();
                saveState();
            }
        }, { passive: false });

        saveState();
    }

    function saveState() {
        drawHistory.push(canvas.toDataURL());
        if (drawHistory.length > 30) drawHistory.shift();
    }

    function undo() {
        if (drawHistory.length > 1) {
            drawHistory.pop();
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = drawHistory[drawHistory.length - 1];
        }
    }

    function clearCanvas() {
        ctx.fillStyle = '#1a1e32';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveState();
    }

    function drawShape(x1, y1, x2, y2) {
        ctx.strokeStyle = currentColor;
        ctx.fillStyle = currentColor;
        ctx.lineWidth = lineWidth;

        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const w = Math.abs(x2 - x1);
        const h = Math.abs(y2 - y1);
        const size = Math.max(30, Math.max(w, h));

        switch (currentTool) {
            case 'rect':
                ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
                break;
            case 'circle':
                ctx.beginPath();
                ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.closePath();
                break;
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(cx, cy - size / 2);
                ctx.lineTo(cx - size / 2, cy + size / 2);
                ctx.lineTo(cx + size / 2, cy + size / 2);
                ctx.closePath();
                ctx.stroke();
                break;
            case 'text':
                const text = prompt('Enter text:');
                if (text) {
                    ctx.font = '18px Inter, sans-serif';
                    ctx.fillText(text, x1, y1);
                }
                break;
        }
        saveState();
    }

    function initToolbar() {
        const toolbar = document.getElementById('if-toolbar');
        toolbar.querySelectorAll('[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;

                if (tool === 'undo') { undo(); return; }
                if (tool === 'clear') { clearCanvas(); return; }

                currentTool = tool;
                toolbar.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        document.getElementById('if-colors').querySelectorAll('.if-color-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                currentColor = swatch.dataset.color;
                document.querySelectorAll('.if-color-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
            });
        });
    }

    function initStepChecks() {
        document.querySelectorAll('.if-instruction-item').forEach(item => {
            item.addEventListener('click', () => {
                const stepId = item.dataset.step;
                const stepIndex = parseInt(item.dataset.index);

                if (completedSteps.includes(stepId)) {
                    // Uncheck
                    completedSteps = completedSteps.filter(s => s !== stepId);
                    completionOrder = completionOrder.filter(s => s !== stepId);
                    item.classList.remove('completed');
                } else {
                    // Check
                    completedSteps.push(stepId);
                    completionOrder.push(stepId);
                    stepStartTimes[stepId] = performance.now() - roundStartTime;
                    item.classList.add('completed');
                }
            });
        });
    }

    function scoreRound() {
        const round = ROUNDS[currentRound];
        const totalSteps = round.steps.length;
        const completedCount = completedSteps.length;

        // Check order correctness
        let inOrderCount = 0;
        const expectedOrder = round.steps.map(s => s.id);

        for (let i = 0; i < completionOrder.length; i++) {
            if (completionOrder[i] === expectedOrder[i]) {
                inOrderCount++;
            }
        }

        // Score calculation
        const completionRate = completedCount / totalSteps;
        const orderRate = completedCount > 0 ? inOrderCount / completedCount : 0;
        const timeTaken = performance.now() - roundStartTime;
        const timeSeconds = timeTaken / 1000;
        const expectedTime = totalSteps * 15;
        const timeBonus = timeSeconds < expectedTime ? 5 : 0;

        const baseScore = completionRate * 70 + orderRate * 25 + timeBonus;
        const roundScore = Math.min(100, Math.round(baseScore));

        roundResults.push({
            round: currentRound + 1,
            totalSteps,
            completedCount,
            inOrderCount,
            completionOrder: [...completionOrder],
            expectedOrder,
            timeTaken: Math.round(timeTaken),
            score: roundScore
        });

        showRoundResult(roundScore, completedCount, totalSteps, inOrderCount);
    }

    function showRoundResult(score, completed, total, inOrder) {
        const scoreColor = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--amber)' : 'var(--danger)';

        container.innerHTML = `
            <div class="transition-screen">
                <div class="score-reveal" style="color:${scoreColor}">${score}</div>
                <h3>Instruction Following</h3>
                <p>${getInstructionFeedback(score)}</p>
                <div class="att-stats" style="max-width:400px;width:100%;margin-top:var(--space-lg)">
                    <div class="att-stat">
                        <div class="value" style="color:var(--success)">${completed}/${total}</div>
                        <div class="label">Steps Completed</div>
                    </div>
                    <div class="att-stat">
                        <div class="value" style="color:var(--accent)">${inOrder}</div>
                        <div class="label">In Correct Order</div>
                    </div>
                    <div class="att-stat">
                        <div class="value">${total - completed}</div>
                        <div class="label">Steps Missed</div>
                    </div>
                </div>
                <div class="assessment-footer">
                    <button class="btn btn-primary btn-lg" id="if-next-btn">
                        ${currentRound < ROUNDS.length - 1 ? 'Next Round →' : 'Complete Assessment'}
                    </button>
                </div>
            </div>`;

        document.getElementById('if-next-btn').addEventListener('click', () => {
            currentRound++;
            if (currentRound < ROUNDS.length) {
                showRound();
            } else {
                finishAssessment();
            }
        });
    }

    function getInstructionFeedback(score) {
        if (score >= 90) return 'Excellent! You followed all instructions accurately and in order.';
        if (score >= 70) return 'Good job - most instructions were completed correctly.';
        if (score >= 50) return 'Moderate performance. Some steps were missed or out of order.';
        if (score >= 30) return 'Several instructions were skipped or completed out of sequence.';
        return 'This was challenging. Following multi-step instructions takes practice.';
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

    window.ADHD.assessments['instruction-following'] = {
        id: 'instruction-following',
        name: 'Instruction Following',
        icon: '📝',
        shortName: 'Instructions',
        description: 'Measures ability to follow multi-step instructions',
        profileKey: 'instruction_following_score',
        init(el, done) {
            container = el;
            onComplete = done;
            currentRound = 0;
            roundResults = [];
            completedSteps = [];
            completionOrder = [];
            drawHistory = [];
            currentTool = 'pen';
            currentColor = '#e4e7f1';
            renderIntro();
        }
    };
})();
