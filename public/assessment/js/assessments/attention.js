/* ==========================================================
   Attention Assessment Module (Continuous Performance Test)
   ========================================================== */
(function () {
    window.ADHD = window.ADHD || {};
    window.ADHD.assessments = window.ADHD.assessments || {};

    const TOTAL_STIMULI = 36;
    const TARGET_RATIO = 0.30;
    const DISPLAY_MS = 800;
    const GAP_MS = 400;
    const TARGET_LETTER = 'A';
    const DISTRACTOR_LETTERS = 'BCDEFGHJKLMNPQRSTUVWXYZ'.split('');

    let container = null;
    let onComplete = null;
    let stimuli = [];
    let currentIndex = 0;
    let hits = 0;
    let misses = 0;
    let falseAlarms = 0;
    let reactionTimes = [];
    let trials = [];
    let stimulusShownAt = 0;
    let responded = false;
    let running = false;
    let stimulusTimeout = null;
    let gapTimeout = null;
    let keyHandler = null;

    function generateStimuli() {
        const targetCount = Math.round(TOTAL_STIMULI * TARGET_RATIO);
        const arr = [];
        for (let i = 0; i < targetCount; i++) arr.push(TARGET_LETTER);
        for (let i = targetCount; i < TOTAL_STIMULI; i++) {
            arr.push(DISTRACTOR_LETTERS[Math.floor(Math.random() * DISTRACTOR_LETTERS.length)]);
        }
        // Shuffle with constraint: no two targets in a row
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function renderIntro() {
        container.innerHTML = `
            <div class="assessment-header">
                <div class="assessment-icon">🎯</div>
                <h2>Sustained Attention</h2>
                <p>Test your ability to maintain focus and respond quickly to targets.</p>
            </div>
            <div class="assessment-card">
                <div class="assessment-instructions">
                    <strong>How it works:</strong><br>
                    • Letters will appear on screen one at a time<br>
                    • Press the <strong>button</strong> or <strong>spacebar</strong> ONLY when you see the letter <strong style="color:var(--accent);font-size:1.1em">"A"</strong><br>
                    • Respond as <strong>quickly</strong> as you can<br>
                    • Do <strong>NOT</strong> press for any other letter<br>
                    • There are <strong>${TOTAL_STIMULI} letters</strong> in total
                </div>
                <div class="assessment-footer">
                    <button class="btn btn-primary btn-lg" id="att-start-btn">Start</button>
                </div>
            </div>`;
        document.getElementById('att-start-btn').addEventListener('click', startTest);
    }

    function startTest() {
        stimuli = generateStimuli();
        currentIndex = 0;
        hits = 0;
        misses = 0;
        falseAlarms = 0;
        reactionTimes = [];
        trials = [];
        running = true;

        container.innerHTML = `
            <div class="assessment-header">
                <div class="round-badge">Press spacebar or click when you see "A"</div>
                <h2 class="text-muted text-sm" style="font-weight:400">Stimulus <span id="att-counter">0</span> / ${TOTAL_STIMULI}</h2>
            </div>
            <div class="assessment-card">
                <div class="att-display">
                    <div class="att-char" id="att-char-display">&nbsp;</div>
                    <button class="att-response-btn" id="att-response-btn">${TARGET_LETTER}!</button>
                </div>
                <div class="att-hint">Press <strong>Spacebar</strong> or click the button when you see "${TARGET_LETTER}"</div>
            </div>`;

        const btn = document.getElementById('att-response-btn');
        btn.addEventListener('click', handleResponse);
        btn.addEventListener('mousedown', (e) => e.preventDefault()); // prevent focus shift

        keyHandler = (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                handleResponse();
            }
        };
        document.addEventListener('keydown', keyHandler);

        // Short countdown before starting
        const charDisplay = document.getElementById('att-char-display');
        charDisplay.textContent = '3';
        setTimeout(() => {
            charDisplay.textContent = '2';
            setTimeout(() => {
                charDisplay.textContent = '1';
                setTimeout(() => {
                    showNextStimulus();
                }, 800);
            }, 800);
        }, 800);
    }

    function handleResponse() {
        if (!running || responded) return;
        responded = true;

        const rt = performance.now() - stimulusShownAt;
        const isTarget = stimuli[currentIndex] === TARGET_LETTER;
        const btn = document.getElementById('att-response-btn');

        if (trials[currentIndex]) {
            trials[currentIndex].responded = true;
            trials[currentIndex].rt = rt;
        }

        if (isTarget) {
            hits++;
            reactionTimes.push(rt);
            if (trials[currentIndex]) trials[currentIndex].type = 'hit';
            if (btn) {
                btn.classList.add('flash-hit');
                setTimeout(() => btn.classList.remove('flash-hit'), 200);
            }
        } else {
            falseAlarms++;
            if (trials[currentIndex]) trials[currentIndex].type = 'false_alarm';
            if (btn) {
                btn.classList.add('flash-miss');
                setTimeout(() => btn.classList.remove('flash-miss'), 200);
            }
        }
    }

    function showNextStimulus() {
        if (!running) return;

        if (currentIndex >= TOTAL_STIMULI) {
            finishTest();
            return;
        }

        const charDisplay = document.getElementById('att-char-display');
        const counter = document.getElementById('att-counter');
        if (!charDisplay) return;

        responded = false;
        stimulusShownAt = performance.now();
        const letter = stimuli[currentIndex];

        trials[currentIndex] = {
            index: currentIndex,
            letter,
            isTarget: letter === TARGET_LETTER,
            responded: false,
            rt: null,
            type: letter === TARGET_LETTER ? 'miss' : 'correct_rejection'
        };

        charDisplay.textContent = letter;
        charDisplay.className = 'att-char' + (letter === TARGET_LETTER ? ' target' : '');
        charDisplay.style.animation = 'none';
        charDisplay.offsetHeight; // trigger reflow
        charDisplay.style.animation = '';

        if (counter) counter.textContent = currentIndex + 1;

        stimulusTimeout = setTimeout(() => {
            // Check if target was missed
            if (!responded && letter === TARGET_LETTER) {
                misses++;
            }

            // Gap
            charDisplay.textContent = '+';
            charDisplay.className = 'att-char';
            charDisplay.style.color = 'var(--text-muted)';
            charDisplay.style.fontSize = '3rem';

            currentIndex++;
            gapTimeout = setTimeout(() => {
                charDisplay.style.color = '';
                charDisplay.style.fontSize = '';
                showNextStimulus();
            }, GAP_MS);
        }, DISPLAY_MS);
    }

    function finishTest() {
        running = false;
        if (keyHandler) document.removeEventListener('keydown', keyHandler);
        clearTimeout(stimulusTimeout);
        clearTimeout(gapTimeout);

        const totalTargets = stimuli.filter(s => s === TARGET_LETTER).length;
        const totalNonTargets = TOTAL_STIMULI - totalTargets;

        const hitRate = totalTargets > 0 ? hits / totalTargets : 0;
        const falseAlarmRate = totalNonTargets > 0 ? falseAlarms / totalNonTargets : 0;

        const avgRT = reactionTimes.length > 0
            ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
            : 999;

        // 1. Reaction Time Variability (RTV)
        const hitRTs = trials.filter(t => t.type === 'hit' && t.rt !== null).map(t => t.rt);
        let rtv = 0;
        if (hitRTs.length > 1) {
            const mean = hitRTs.reduce((sum, val) => sum + val, 0) / hitRTs.length;
            const variance = hitRTs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (hitRTs.length - 1);
            rtv = Math.sqrt(variance);
        }

        // 2. Attention Decline Over Time
        const halfSize = Math.floor(TOTAL_STIMULI / 2);
        const firstHalf = trials.slice(0, halfSize);
        const secondHalf = trials.slice(halfSize);

        const firstHalfHits = firstHalf.filter(t => t.type === 'hit').length;
        const firstHalfTargets = firstHalf.filter(t => t.isTarget).length;
        const firstHalfAcc = firstHalfTargets > 0 ? firstHalfHits / firstHalfTargets : 0;

        const secondHalfHits = secondHalf.filter(t => t.type === 'hit').length;
        const secondHalfTargets = secondHalf.filter(t => t.isTarget).length;
        const secondHalfAcc = secondHalfTargets > 0 ? secondHalfHits / secondHalfTargets : 0;

        const firstHalfRTs = firstHalf.filter(t => t.type === 'hit' && t.rt !== null).map(t => t.rt);
        const secondHalfRTs = secondHalf.filter(t => t.type === 'hit' && t.rt !== null).map(t => t.rt);

        const firstHalfMeanRT = firstHalfRTs.length > 0 ? firstHalfRTs.reduce((a, b) => a + b, 0) / firstHalfRTs.length : 0;
        const secondHalfMeanRT = secondHalfRTs.length > 0 ? secondHalfRTs.reduce((a, b) => a + b, 0) / secondHalfRTs.length : 0;

        const rtDecline = secondHalfMeanRT > 0 && firstHalfMeanRT > 0 ? secondHalfMeanRT - firstHalfMeanRT : 0;
        const accDecline = firstHalfAcc - secondHalfAcc;

        // 3. Impulsive Responses (False Alarms + Anticipatory Responses under 150ms)
        const anticipatoryCount = trials.filter(t => t.responded && t.rt !== null && t.rt < 150).length;
        const impulsiveCount = falseAlarms + anticipatoryCount;

        // Scoring Formula mapping
        const rtvFactor = rtv === 0 ? 0.5 : Math.max(0, Math.min(1, 1 - (rtv - 30) / 120)); // baseline 30ms to 150ms
        const accDeclineNormalized = Math.max(0, Math.min(1, accDecline / 0.4)); // max penalty at 40% accuracy drop
        const rtDeclineNormalized = Math.max(0, Math.min(1, rtDecline / 150)); // max penalty at 150ms slowdown
        const declineFactor = Math.max(0, 1 - (accDeclineNormalized + rtDeclineNormalized) / 2);
        const impulsivityFactor = Math.max(0, 1 - impulsiveCount / 6); // max penalty at 6 impulsive responses

        const score = Math.round(
            hitRate * 40 +
            (1 - falseAlarmRate) * 20 +
            rtvFactor * 20 +
            declineFactor * 10 +
            impulsivityFactor * 10
        );

        showResults({
            score: Math.max(0, Math.min(100, score)),
            hits, misses, falseAlarms, totalTargets,
            avgRT, rtv, rtDecline, accDecline,
            anticipatoryCount, impulsiveCount,
            hitRate, falseAlarmRate, rtvFactor, declineFactor, impulsivityFactor
        });
    }

    function showResults(data) {
        const scoreColor = data.score >= 70 ? 'var(--success)' : data.score >= 40 ? 'var(--amber)' : 'var(--danger)';

        container.innerHTML = `
            <div class="transition-screen">
                <div class="score-reveal" style="color:${scoreColor}">${data.score}</div>
                <h3>Attention Score</h3>
                <div class="att-stats" style="max-width:500px;width:100%;margin-top:var(--space-lg);display:grid;grid-template-columns:repeat(3, 1fr);gap:var(--space-sm)">
                    <div class="att-stat">
                        <div class="value" style="color:var(--success)">${data.hits}</div>
                        <div class="label">Hits (of ${data.totalTargets})</div>
                    </div>
                    <div class="att-stat">
                        <div class="value" style="color:var(--danger)">${data.misses}</div>
                        <div class="label">Misses</div>
                    </div>
                    <div class="att-stat">
                        <div class="value" style="color:var(--amber)">${data.falseAlarms}</div>
                        <div class="label">False Alarms</div>
                    </div>
                </div>
                <div class="att-stats" style="max-width:500px;width:100%;margin-top:var(--space-sm);display:grid;grid-template-columns:repeat(3, 1fr);gap:var(--space-sm)">
                    <div class="att-stat">
                        <div class="value">${data.avgRT < 999 ? Math.round(data.avgRT) + 'ms' : 'N/A'}</div>
                        <div class="label">Avg RT</div>
                    </div>
                    <div class="att-stat" title="Reaction Time Variability: measures inconsistencies in focus.">
                        <div class="value">${Math.round(data.rtv)}ms</div>
                        <div class="label">RT Variability</div>
                    </div>
                    <div class="att-stat" title="Attention decline over time: performance change between first and second halves.">
                        <div class="value">${data.rtDecline > 0 ? '+' : ''}${Math.round(data.rtDecline)}ms</div>
                        <div class="label">Fatigue Decline</div>
                    </div>
                </div>
                <div class="att-stats" style="max-width:500px;width:100%;margin-top:var(--space-sm);display:grid;grid-template-columns:1fr;gap:var(--space-sm)">
                    <div class="att-stat">
                        <div class="value" style="color:${data.impulsiveCount > 2 ? 'var(--danger)' : 'var(--text-primary)'}">${data.impulsiveCount}</div>
                        <div class="label">Impulsive Actions (False Alarms + Anticipations)</div>
                    </div>
                </div>
                <div class="assessment-footer">
                    <button class="btn btn-primary btn-lg" id="att-done-btn">Continue →</button>
                </div>
            </div>`;

        document.getElementById('att-done-btn').addEventListener('click', () => {
            onComplete({
                score: data.score,
                metrics: {
                    hits: data.hits,
                    misses: data.misses,
                    falseAlarms: data.falseAlarms,
                    totalTargets: data.totalTargets,
                    hitRate: Math.round(data.hitRate * 100),
                    falseAlarmRate: Math.round(data.falseAlarmRate * 100),
                    avgReactionTime: Math.round(data.avgRT),
                    rtv: Math.round(data.rtv),
                    rtvFactor: Math.round(data.rtvFactor * 100),
                    rtDecline: Math.round(data.rtDecline),
                    accDecline: Math.round(data.accDecline * 100),
                    declineFactor: Math.round(data.declineFactor * 100),
                    anticipatoryCount: data.anticipatoryCount,
                    impulsiveCount: data.impulsiveCount,
                    impulsivityFactor: Math.round(data.impulsivityFactor * 100),
                    reactionTimes: reactionTimes
                }
            });
        });
    }

    window.ADHD.assessments['attention'] = {
        id: 'attention',
        name: 'Sustained Attention',
        icon: '🎯',
        shortName: 'Attention',
        description: 'Measures sustained attention and response accuracy',
        profileKey: 'attention_score',
        init(el, done) {
            container = el;
            onComplete = done;
            running = false;
            if (keyHandler) document.removeEventListener('keydown', keyHandler);
            clearTimeout(stimulusTimeout);
            clearTimeout(gapTimeout);
            renderIntro();
        }
    };
})();
