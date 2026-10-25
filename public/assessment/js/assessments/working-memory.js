/* ==========================================================
   Working Memory Assessment Module (Revised: Multiple Choice)
   ========================================================== */
(function () {
    window.ADHD = window.ADHD || {};
    window.ADHD.assessments = window.ADHD.assessments || {};

    const WORD_POOLS = [
        ['Apple', 'Chair', 'Blue', 'River', 'Dog', 'Pencil', 'Mountain', 'Clock', 'Garden', 'Hammer',
         'Sunset', 'Bottle', 'Forest', 'Candle', 'Bridge', 'Mirror', 'Piano', 'Rocket', 'Blanket', 'Anchor'],
        ['Window', 'Tiger', 'Bread', 'Ocean', 'Lamp', 'Castle', 'Feather', 'Dragon', 'Pillow', 'Trumpet',
         'Volcano', 'Basket', 'Diamond', 'Pebble', 'Compass', 'Shovel', 'Marble', 'Falcon', 'Ribbon', 'Thunder'],
        ['Ladder', 'Coral', 'Spark', 'Meadow', 'Glove', 'Helmet', 'Puzzle', 'Violin', 'Lantern', 'Parrot',
         'Crystal', 'Wagon', 'Dolphin', 'Cactus', 'Magnet', 'Snowflake', 'Pepper', 'Trophy', 'Whistle', 'Curtain']
    ];

    const DISTRACTION_DURATION = 10000; // 10 seconds

    let container = null;
    let onComplete = null;
    let currentRound = 0;
    let currentWordCount = 5;
    let roundWords = [];
    let distractorWords = [];
    let allOptions = []; // Combined, shuffled list of roundWords + distractorWords
    let selectedWords = new Set();
    let roundResults = [];
    let currentWordIndex = 0;
    let timerInterval = null;
    let recallStartTime = 0;

    let mathTotal = 0;
    let mathCorrect = 0;
    let currentEquation = null;

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function selectWords(count) {
        const pool = WORD_POOLS[currentRound % WORD_POOLS.length];
        const shuffledPool = shuffle(pool);
        
        const shown = shuffledPool.slice(0, count);
        const unused = shuffledPool.slice(count);
        
        // Pick an equal number of distractors from the unused words
        const distractors = unused.slice(0, count);
        
        return { shown, distractors };
    }

    function renderIntro() {
        container.innerHTML = `
            <div class="assessment-header">
                <div class="assessment-icon">🧠</div>
                <h2>Working Memory</h2>
                <p>Memorize a series of words shown one-by-one. After a brief delay, pick the words you saw from a grid.</p>
            </div>
            <div class="assessment-card">
                <div class="assessment-instructions">
                    <strong>How it works:</strong><br>
                    • Words will appear on screen one at a time (starting with <strong>5 words</strong>)<br>
                    • Try to memorize each word as it appears<br>
                    • Solve rapid <strong>math verification equations</strong> for 10 seconds to challenge your memory<br>
                    • Select all the words you remember seeing from a grid<br>
                    • The difficulty will <strong>adaptively scale</strong> up or down across <strong>3 rounds</strong>
                </div>
                <div class="assessment-footer">
                    <button class="btn btn-primary btn-lg" id="wm-start-btn">Start</button>
                </div>
            </div>`;
        document.getElementById('wm-start-btn').addEventListener('click', startRound);
    }

    function startRound() {
        const { shown, distractors } = selectWords(currentWordCount);
        roundWords = shown;
        distractorWords = distractors;
        allOptions = shuffle([...roundWords, ...distractorWords]);
        selectedWords.clear();
        currentWordIndex = 0;
        showWords();
    }

    function showWords() {
        container.innerHTML = `
            <div class="assessment-header">
                <div class="round-badge">Round ${currentRound + 1} of 3 • ${currentWordCount} words</div>
                <h2>Memorize These Words</h2>
                <p>Focus on each word as it appears.</p>
            </div>
            <div class="assessment-card">
                <div class="wm-display" id="wm-word-area">
                    <div class="wm-countdown" id="wm-ready-text">Get Ready…</div>
                </div>
                <div style="text-align:center;margin-top:var(--space-md)">
                    <span class="text-muted text-sm">Word <span id="wm-word-counter">0</span> of ${currentWordCount}</span>
                </div>
            </div>`;

        setTimeout(() => {
            displayNextWord();
        }, 1500);
    }

    function displayNextWord() {
        const area = document.getElementById('wm-word-area');
        const counter = document.getElementById('wm-word-counter');
        if (!area) return;

        if (currentWordIndex >= roundWords.length) {
            startDistraction();
            return;
        }

        area.innerHTML = `<div class="wm-word">${roundWords[currentWordIndex]}</div>`;
        if (counter) counter.textContent = currentWordIndex + 1;
        currentWordIndex++;

        setTimeout(displayNextWord, 1500);
    }

    function generateMathEquation() {
        const num1 = Math.floor(Math.random() * 9) + 2; // 2-10
        const num2 = Math.floor(Math.random() * 9) + 2; // 2-10
        const op = Math.random() > 0.5 ? '+' : '-';
        let displayAnswer = 0;
        const actualAnswer = op === '+' ? (num1 + num2) : (num1 - num2);
        
        // 50% chance of correct vs incorrect
        if (Math.random() > 0.5) {
            displayAnswer = actualAnswer;
        } else {
            displayAnswer = actualAnswer + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 2) + 1);
        }
        
        return {
            text: `${num1} ${op} ${num2} = ${displayAnswer}`,
            isCorrect: (actualAnswer === displayAnswer)
        };
    }

    function startDistraction() {
        mathTotal = 0;
        mathCorrect = 0;
        let timeLeft = DISTRACTION_DURATION / 1000;

        container.innerHTML = `
            <div class="assessment-header">
                <div class="round-badge">Round ${currentRound + 1} • Distraction Phase</div>
                <h2>Verify Equations</h2>
                <p>Solve these math equations rapidly in your head. This blocks verbal rehearsal!</p>
            </div>
            <div class="assessment-card">
                <div class="wm-distraction" style="text-align:center">
                    <div class="wm-math-equation" id="wm-math-eq" style="font-size: 2.5rem; font-weight: 700; margin: var(--space-md) 0; color: var(--accent); min-height: 70px; display: flex; align-items: center; justify-content: center;"></div>
                    <div style="display: flex; gap: var(--space-md); justify-content: center; margin-bottom: var(--space-lg)">
                        <button class="btn btn-primary" id="wm-math-true" style="padding: var(--space-sm) var(--space-xl)">True</button>
                        <button class="btn btn-secondary" id="wm-math-false" style="padding: var(--space-sm) var(--space-xl)">False</button>
                    </div>
                    <div style="font-size:1.3rem;font-weight:600;color:var(--amber)">
                        <span id="wm-dist-timer">${timeLeft}</span>s remaining
                    </div>
                    <div class="text-sm text-muted" style="margin-top: var(--space-xs)">
                        Solved: <span id="wm-math-score">0 / 0</span>
                    </div>
                </div>
            </div>`;

        showNextEquation();

        document.getElementById('wm-math-true').addEventListener('click', () => handleMathAnswer(true));
        document.getElementById('wm-math-false').addEventListener('click', () => handleMathAnswer(false));

        timerInterval = setInterval(() => {
            timeLeft--;
            const el = document.getElementById('wm-dist-timer');
            if (el) el.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                showRecallGrid();
            }
        }, 1000);
    }

    function showNextEquation() {
        currentEquation = generateMathEquation();
        const eqEl = document.getElementById('wm-math-eq');
        if (eqEl) {
            eqEl.textContent = currentEquation.text;
        }
    }

    function handleMathAnswer(userAnswer) {
        if (!currentEquation) return;
        mathTotal++;
        const isCorrect = (userAnswer === currentEquation.isCorrect);
        if (isCorrect) {
            mathCorrect++;
        }
        
        const scoreEl = document.getElementById('wm-math-score');
        if (scoreEl) {
            scoreEl.textContent = `${mathCorrect} / ${mathTotal}`;
        }
        
        const eqEl = document.getElementById('wm-math-eq');
        if (eqEl) {
            eqEl.style.color = isCorrect ? 'var(--success)' : 'var(--danger)';
            setTimeout(() => {
                eqEl.style.color = 'var(--accent)';
                showNextEquation();
            }, 150);
        } else {
            showNextEquation();
        }
    }

    function showRecallGrid() {
        recallStartTime = performance.now();
        container.innerHTML = `
            <div class="assessment-header">
                <div class="round-badge">Round ${currentRound + 1} • Select Remembered Words</div>
                <h2>Which words did you see?</h2>
                <p>Select all the words you recall seeing, then click Submit.</p>
            </div>
            <div class="assessment-card">
                <div class="wm-grid" id="wm-options-grid">
                    ${allOptions.map((word, idx) => `
                        <div class="wm-grid-item" data-word="${word}" id="wm-item-${idx}">
                            ${word}
                        </div>
                    `).join('')}
                </div>
                <div class="assessment-footer">
                    <button class="btn btn-primary" id="wm-submit-recall" style="margin-top: var(--space-lg)">Submit Selections</button>
                </div>
            </div>`;

        const gridItems = container.querySelectorAll('.wm-grid-item');
        gridItems.forEach(item => {
            item.addEventListener('click', () => {
                const word = item.dataset.word;
                if (selectedWords.has(word)) {
                    selectedWords.delete(word);
                    item.classList.remove('selected');
                } else {
                    selectedWords.add(word);
                    item.classList.add('selected');
                }
            });
        });

        document.getElementById('wm-submit-recall').addEventListener('click', scoreRound);
    }

    function scoreRound() {
        const timeTaken = performance.now() - recallStartTime;
        
        let correctCount = 0;
        let incorrectCount = 0;

        selectedWords.forEach(word => {
            if (roundWords.includes(word)) {
                correctCount++;
            } else {
                incorrectCount++;
            }
        });

        const total = roundWords.length;
        const accuracyRatio = correctCount / total;
        const accuracyScore = accuracyRatio * 90;
        const falsePositivePenalty = Math.min(30, incorrectCount * 10);

        const timeSeconds = timeTaken / 1000;
        const totalOptions = allOptions.length;
        // Speed bonus if they answer under 1.5s per grid option
        const speedBonus = timeSeconds < (totalOptions * 1.0) ? 10 : timeSeconds < (totalOptions * 1.8) ? 5 : 0;

        const diffMultiplier = 0.5 + (currentWordCount * 0.1); // difficulty scaling: 5 words is 1.0, 7 words is 1.2
        const roundScore = Math.max(0, Math.min(100, Math.round((accuracyScore - falsePositivePenalty + speedBonus) * diffMultiplier)));

        roundResults.push({
            round: currentRound + 1,
            wordCount: currentWordCount,
            correct: correctCount,
            incorrect: incorrectCount,
            score: roundScore,
            mathCorrect,
            mathTotal,
            wordsShown: [...roundWords],
            distractors: [...distractorWords],
            userSelections: Array.from(selectedWords),
            timeTakenMs: Math.round(timeTaken)
        });

        // Adapt difficulty for next round
        let nextWordCount = currentWordCount;
        if (accuracyRatio >= 0.8 && incorrectCount === 0) {
            nextWordCount = Math.min(10, currentWordCount + 1);
        } else if (accuracyRatio <= 0.4) {
            nextWordCount = Math.max(3, currentWordCount - 1);
        } else if (accuracyRatio >= 0.6 && incorrectCount <= 1) {
            nextWordCount = Math.min(10, currentWordCount + 1);
        }

        const oldWordCount = currentWordCount;
        currentWordCount = nextWordCount;

        showRoundResult(correctCount, incorrectCount, total, oldWordCount);
    }

    function showRoundResult(correct, incorrect, total, wordCountShown) {
        const scoreColor = (correct - incorrect) / total >= 0.7 ? 'var(--success)' : (correct - incorrect) / total >= 0.4 ? 'var(--amber)' : 'var(--danger)';

        container.innerHTML = `
            <div class="transition-screen">
                <div class="score-reveal" style="color:${scoreColor}">${correct} / ${total}</div>
                <h3 style="margin-top:var(--space-md)">Recall Result</h3>
                <p>${getRoundFeedback(correct, incorrect, total)}</p>
                
                <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);padding:var(--space-sm) var(--space-md);border-radius:var(--radius-md);font-size:0.85rem;margin-bottom:var(--space-md)">
                    ⚡ <strong>Distraction Task:</strong> Answered <strong>${mathCorrect} / ${mathTotal}</strong> equations correctly.
                </div>

                <div class="wm-round-result mt-lg" style="flex-direction:column;align-items:stretch;max-width:480px;width:100%">
                    <div class="text-sm text-muted" style="margin-bottom:var(--space-sm)">Selections review (green = correct, red = distractor, orange = missed):</div>
                    <div class="wm-grid" style="grid-template-columns: repeat(auto-fill, minmax(110px, 1fr))">
                        ${allOptions.map(w => {
                            const isOriginal = roundWords.includes(w);
                            const isSelected = selectedWords.has(w);
                            let borderStyle = 'opacity: 0.5; border-color: rgba(255,255,255,0.06)';
                            let badge = '';
                            
                            if (isOriginal && isSelected) {
                                borderStyle = 'border-color: var(--success); color: var(--success); background: var(--success-dim)';
                                badge = ' ✓';
                            } else if (!isOriginal && isSelected) {
                                borderStyle = 'border-color: var(--danger); color: var(--danger); background: var(--danger-dim)';
                                badge = ' ✗';
                            } else if (isOriginal && !isSelected) {
                                borderStyle = 'border-color: var(--amber); color: var(--amber); opacity: 0.7';
                                badge = ' (missed)';
                            }
                            
                            return `<div class="wm-grid-item" style="cursor: default; pointer-events: none; ${borderStyle}">${w}${badge}</div>`;
                        }).join('')}
                    </div>
                </div>
                
                <div class="assessment-footer">
                    <button class="btn btn-primary btn-lg" id="wm-next-btn">
                        ${currentRound < 2 ? 'Next Round →' : 'Complete Assessment'}
                    </button>
                </div>
            </div>`;

        document.getElementById('wm-next-btn').addEventListener('click', () => {
            currentRound++;
            if (currentRound < 3) {
                startRound();
            } else {
                finishAssessment();
            }
        });
    }

    function getRoundFeedback(correct, incorrect, total) {
        const netCorrect = correct - incorrect;
        const ratio = netCorrect / total;
        if (ratio >= 0.8) return 'Superb recall! Your visual working memory is highly precise.';
        if (ratio >= 0.5) return 'Good recall - you picked out most of the original words with minimal errors.';
        if (ratio >= 0.2) return 'Moderate recall. Distractor words and arithmetic can make recognition tricky!';
        return 'That was tough. Multiple choice recognition tests show how distractors compete for memory slots.';
    }

    function finishAssessment() {
        const totalCorrect = roundResults.reduce((s, r) => s + r.correct, 0);
        const totalIncorrect = roundResults.reduce((s, r) => s + r.incorrect, 0);
        const totalWords = roundResults.reduce((s, r) => s + r.wordCount, 0);
        
        const avgRoundScore = roundResults.reduce((s, r) => s + r.score, 0) / roundResults.length;
        
        // Distraction compliance check
        const totalMathCorrect = roundResults.reduce((s, r) => s + r.mathCorrect, 0);
        const totalMathTotal = roundResults.reduce((s, r) => s + r.mathTotal, 0);
        let mathPenalty = 0;
        if (totalMathTotal < 3 || (totalMathCorrect / totalMathTotal) < 0.4) {
            mathPenalty = 15; // penalize if they ignored math equations or got them all wrong
        }

        const finalScore = Math.max(0, Math.min(100, Math.round(avgRoundScore - mathPenalty)));

        onComplete({
            score: finalScore,
            metrics: {
                rounds: roundResults,
                totalCorrect,
                totalIncorrect,
                totalWords,
                totalMathCorrect,
                totalMathTotal,
                mathPenalty,
                estimatedSpan: Math.max(...roundResults.map(r => r.wordCount))
            }
        });
    }

    window.ADHD.assessments['working-memory'] = {
        id: 'working-memory',
        name: 'Working Memory',
        icon: '🧠',
        shortName: 'Memory',
        description: 'Measures working memory via list recognition under math interference',
        profileKey: 'working_memory_score',
        init(el, done) {
            container = el;
            onComplete = done;
            currentRound = 0;
            currentWordCount = 5;
            roundResults = [];
            selectedWords.clear();
            if (timerInterval) clearInterval(timerInterval);
            renderIntro();
        }
    };
})();
