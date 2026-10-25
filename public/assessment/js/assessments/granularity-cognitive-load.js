/* ==========================================================
   Granularity & Cognitive Load Assessment Module
   ========================================================== */
(function () {
    window.ADHD = window.ADHD || {};
    window.ADHD.assessments = window.ADHD.assessments || {};

    const WORD_POOLS = [
        ['Apple', 'Chair', 'Blue', 'River', 'Dog', 'Pencil', 'Mountain', 'Clock', 'Garden', 'Hammer'],
        ['Window', 'Tiger', 'Bread', 'Ocean', 'Lamp', 'Castle', 'Feather', 'Dragon', 'Pillow', 'Trumpet']
    ];

    const GRAN_TASKS = [
        {
            id: 'brush-teeth',
            name: 'Brush Teeth',
            icon: '🪥',
            options: {
                A: { text: '"Brush your teeth."' },
                B: { text: '1. Get toothbrush and apply toothpaste.\n2. Brush teeth thoroughly for two minutes.\n3. Rinse mouth and toothbrush with water.' },
                C: { text: '1. Walk to the bathroom sink.\n2. Pick up your toothbrush.\n3. Open the tube of toothpaste.\n4. Squeeze a pea-sized amount of toothpaste onto the bristles.\n5. Turn on the cold water tap briefly to wet the brush.\n6. Brush front teeth, back teeth, and chewing surfaces for 2 minutes.\n7. Spit out the excess toothpaste.\n8. Rinse your mouth and toothbrush with clean water.' }
            }
        },
        {
            id: 'make-tea',
            name: 'Make Tea',
            icon: '🍵',
            options: {
                A: { text: '"Make a cup of tea."' },
                B: { text: '1. Boil water in a kettle.\n2. Put a tea bag in a mug.\n3. Pour boiling water into the mug and let it steep for 3 minutes.\n4. Remove the tea bag and add sugar or milk if desired.' },
                C: { text: '1. Fill the kettle with cold water.\n2. Place the kettle on the stove or plug in the electric base, and turn it on.\n3. Take a clean mug from the cupboard.\n4. Choose a tea bag and place it at the bottom of the mug.\n5. Wait for the water to boil completely.\n6. Carefully pour the boiling water into the mug, filling it to about 1 inch below the rim.\n7. Set a timer for 3 minutes to let the tea steep.\n8. Remove the tea bag with a spoon and discard it.\n9. Add your preferred amount of milk and sugar, and stir gently.' }
            }
        },
        {
            id: 'do-laundry',
            name: 'Do Laundry',
            icon: '🧺',
            options: {
                A: { text: '"Wash and dry a load of laundry."' },
                B: { text: '1. Separate clothes into lights and darks.\n2. Load clothes into the washing machine and add detergent.\n3. Select the appropriate wash cycle and start the machine.\n4. Transfer wet clothes to the dryer and run a drying cycle.' },
                C: { text: '1. Gather dirty laundry and sort into separate piles: white/light colors and dark colors.\n2. Take one sorted pile and place it inside the washing machine drum.\n3. Measure the correct amount of liquid detergent using the cap.\n4. Pour the detergent into the designated dispenser drawer.\n5. Close the washing machine door firmly.\n6. Turn the cycle selector dial to "Normal" (or "Delicates" if applicable).\n7. Press the "Start" button and wait for the cycle to finish.\n8. Remove wet clothes, place them in the dryer, and clean the lint trap.\n9. Select "Medium Heat" and start the dryer.' }
            }
        }
    ];

    const COMP_TASKS = [
        {
            level: 1,
            badge: 'simple',
            badgeLabel: '● Simple Complexity',
            title: 'Boil Water',
            text: '1. Fill a clean pot with cold water from the tap.\n2. Place the pot on the stove burner and turn the heat to high.\n3. Wait for large bubbles to rise rapidly to the surface (rolling boil) before adding food.',
            questions: [
                {
                    q: 'What type of water should you fill the pot with?',
                    options: ['Cold water', 'Hot water', 'Warm soapy water', 'Distilled water'],
                    correct: 0
                }
            ]
        },
        {
            level: 2,
            badge: 'moderate',
            badgeLabel: '●● Moderate Complexity',
            title: 'Configure a Smart Thermostat',
            text: '1. Turn off the main electrical power switch connected to your HVAC system.\n2. Remove the old thermostat faceplate and label each wire using the colored stickers provided.\n3. Mount the new thermostat baseplate to the wall using the two mounting screws.\n4. Connect the labeled wires to the matching terminals (e.g., red wire to R terminal, yellow to Y).\n5. Snap the smart faceplate onto the baseplate and turn the HVAC power switch back on.',
            questions: [
                {
                    q: 'What is the very first step before wire labeling?',
                    options: ['Turn off HVAC main power switch', 'Remove the old faceplate', 'Mount the new baseplate', 'Connect wires to matching terminals'],
                    correct: 0
                },
                {
                    q: 'How should you label the wires after removing the old faceplate?',
                    options: ['Using colored stickers provided', 'Using a black marker', 'By memory of their colors', 'By wrapping tape around them'],
                    correct: 0
                }
            ]
        },
        {
            level: 3,
            badge: 'complex',
            badgeLabel: '●●● High Complexity',
            title: 'Install and Configure a Database Server',
            text: '1. Run the database installer executable package.\n2. If your server RAM is 8GB or less, select \'Lightweight Installation Mode\'; if RAM is greater than 8GB, select \'Standard Installation Mode\'.\n3. Choose port 5432 for connections, unless it is already occupied, in which case increment the port by 1 (e.g., 5433).\n4. When prompted for database initialization, check the option \'Enable Security Logs\' and specify a secure administrator password of at least 12 characters.\n5. After installation, copy the configuration file template from the installation directory to the active directory.\n6. Open the active configuration file and modify the parameter \'max_connections\' to 100.\n7. In the firewall setup, add an inbound rules exception specifically for the selected port.\n8. Start the database service and verify the connection status by running the test utility script.',
            questions: [
                {
                    q: 'If your server has 16GB of RAM, which installation mode should you select?',
                    options: ['Standard Installation Mode', 'Lightweight Installation Mode', 'Custom Installation Mode', 'Automatic Installation Mode'],
                    correct: 0
                },
                {
                    q: 'What is the backup action if port 5432 is already occupied?',
                    options: ['Increment the port number by 1 (e.g., 5433)', 'Cancel the installation process', 'Deactivate the database service', 'Disable firewall inbound rules'],
                    correct: 0
                },
                {
                    q: 'What specific checkbox option must you check during database initialization?',
                    options: ['Enable Security Logs', 'Standard Installation Mode', 'max_connections', 'Firewall Exception Rules'],
                    correct: 0
                }
            ]
        }
    ];

    let container = null;
    let onComplete = null;
    
    // State
    let currentPart = 1; // 1 = Granularity, 2 = Cognitive Load
    let currentStepIdx = 0;
    
    // Part 1 Data
    let granSelections = [];
    
    // Part 2 Data
    let compResults = [];
    let readingStartTime = 0;
    let questionStartTime = 0;
    let compAnswers = [];

    function renderIntro() {
        container.innerHTML = `
            <div class="assessment-header">
                <div class="assessment-icon">🔬</div>
                <h2>Granularity & Cognitive Load</h2>
                <p>Measures how detailed your instructions should be, and your capacity to process text under cognitive load.</p>
            </div>
            <div class="assessment-card">
                <div class="assessment-instructions">
                    <strong>How it works:</strong><br>
                    • <strong>Part 1 (Granularity)</strong>: View 3 tasks and select which instruction detail level works best and which feels most frustrating.<br>
                    • <strong>Part 2 (Cognitive Load)</strong>: Read instructions of increasing complexity. Once finished reading, the text will hide, and you will answer quick comprehension questions.
                </div>
                <div class="assessment-footer">
                    <button class="btn btn-primary btn-lg" id="gcl-start-btn">Start</button>
                </div>
            </div>`;
        document.getElementById('gcl-start-btn').addEventListener('click', startPart1);
    }

    function startPart1() {
        currentPart = 1;
        currentStepIdx = 0;
        granSelections = [];
        showGranularityTask();
    }

    function showGranularityTask() {
        const task = GRAN_TASKS[currentStepIdx];
        const taskStartTime = performance.now();

        container.innerHTML = `
            <div class="assessment-header">
                <div class="round-badge">Part 1: Detail Preference • Task ${currentStepIdx + 1} of ${GRAN_TASKS.length}</div>
                <h2>Instruction Preference</h2>
                <p>Consider the task: <strong style="color:var(--accent);font-size:1.1rem">${task.icon} ${task.name}</strong></p>
            </div>
            <div class="assessment-card">
                <div class="gran-options-display" style="display: flex; flex-direction: column; gap: var(--space-md); margin-bottom: var(--space-lg)">
                    <div class="gran-option-preview" id="preview-A" style="background:rgba(255,255,255,0.01); border:1px solid var(--border); border-radius:var(--radius-md); padding:var(--space-md)">
                        <div class="gran-option-label" style="font-weight:600;font-size:0.75rem;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Style A - Low Detail</div>
                        <pre style="white-space: pre-wrap; font-family: inherit; margin: 0; color: var(--text-primary); font-size: 0.9rem; line-height: 1.65">${task.options.A.text}</pre>
                    </div>
                    <div class="gran-option-preview" id="preview-B" style="background:rgba(255,255,255,0.01); border:1px solid var(--border); border-radius:var(--radius-md); padding:var(--space-md)">
                        <div class="gran-option-label" style="font-weight:600;font-size:0.75rem;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Style B - Medium Detail</div>
                        <pre style="white-space: pre-wrap; font-family: inherit; margin: 0; color: var(--text-primary); font-size: 0.9rem; line-height: 1.65">${task.options.B.text}</pre>
                    </div>
                    <div class="gran-option-preview" id="preview-C" style="background:rgba(255,255,255,0.01); border:1px solid var(--border); border-radius:var(--radius-md); padding:var(--space-md)">
                        <div class="gran-option-label" style="font-weight:600;font-size:0.75rem;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Style C - High Detail</div>
                        <pre style="white-space: pre-wrap; font-family: inherit; margin: 0; color: var(--text-primary); font-size: 0.9rem; line-height: 1.65">${task.options.C.text}</pre>
                    </div>
                </div>

                <div class="gran-questions" style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: var(--space-md)">
                    <div class="question-block" style="margin-bottom: var(--space-md)">
                        <h4 style="margin-bottom: var(--space-xs); font-size: 0.95rem">1. Which style would help you complete this task most reliably?</h4>
                        <div style="display: flex; gap: var(--space-md)">
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer">
                                <input type="radio" name="reliable" value="A" id="rel-A"> Style A
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer">
                                <input type="radio" name="reliable" value="B" id="rel-B"> Style B
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer">
                                <input type="radio" name="reliable" value="C" id="rel-C"> Style C
                            </label>
                        </div>
                    </div>
                    <div class="question-block" style="margin-bottom: var(--space-lg)">
                        <h4 style="margin-bottom: var(--space-xs); font-size: 0.95rem">2. Which style would feel most frustrating or unnecessary?</h4>
                        <div style="display: flex; gap: var(--space-md)">
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer">
                                <input type="radio" name="frustrating" value="A" id="frust-A"> Style A
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer">
                                <input type="radio" name="frustrating" value="B" id="frust-B"> Style B
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer">
                                <input type="radio" name="frustrating" value="C" id="frust-C"> Style C
                            </label>
                        </div>
                    </div>
                </div>

                <div class="assessment-footer">
                    <button class="btn btn-primary" id="gran-submit-btn" style="width: 100%" disabled>Please make both selections</button>
                </div>
            </div>`;

        const relRadios = container.querySelectorAll('input[name="reliable"]');
        const frustRadios = container.querySelectorAll('input[name="frustrating"]');
        const submitBtn = document.getElementById('gran-submit-btn');

        function checkFormValidity() {
            let reliableVal = null;
            let frustratingVal = null;
            
            relRadios.forEach(r => { if (r.checked) reliableVal = r.value; });
            frustRadios.forEach(r => { if (r.checked) frustratingVal = r.value; });

            if (reliableVal && frustratingVal) {
                if (reliableVal === frustratingVal) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Select different styles';
                } else {
                    submitBtn.disabled = false;
                    submitBtn.textContent = currentStepIdx === GRAN_TASKS.length - 1 ? 'Save Preferences & Continue →' : 'Next Task →';
                }
            } else {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Please make both selections';
            }
        }

        relRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                frustRadios.forEach(frust => {
                    if (frust.value === radio.value && frust.checked) frust.checked = false;
                });
                checkFormValidity();
            });
        });

        frustRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                relRadios.forEach(rel => {
                    if (rel.value === radio.value && rel.checked) rel.checked = false;
                });
                checkFormValidity();
            });
        });

        submitBtn.addEventListener('click', () => {
            let reliableVal = null;
            let frustratingVal = null;
            
            relRadios.forEach(r => { if (r.checked) reliableVal = r.value; });
            frustRadios.forEach(r => { if (r.checked) frustratingVal = r.value; });

            recordGranSelection(reliableVal, frustratingVal, performance.now() - taskStartTime);
        });
    }

    function recordGranSelection(reliable, frustrating, timeTaken) {
        let score = 50;
        if (reliable === 'A') {
            score = frustrating === 'C' ? 0 : 20;
        } else if (reliable === 'B') {
            score = frustrating === 'C' ? 40 : 60;
        } else if (reliable === 'C') {
            score = frustrating === 'B' ? 80 : 100;
        }

        granSelections.push({
            taskIndex: currentStepIdx + 1,
            taskName: GRAN_TASKS[currentStepIdx].name,
            reliableChoice: reliable,
            frustratingChoice: frustrating,
            score: score,
            timeTakenMs: Math.round(timeTaken)
        });

        currentStepIdx++;
        if (currentStepIdx < GRAN_TASKS.length) {
            showGranularityTask();
        } else {
            startPart2();
        }
    }

    function startPart2() {
        currentPart = 2;
        currentStepIdx = 0;
        compResults = [];
        showComprehensionReading();
    }

    function showComprehensionReading() {
        const task = COMP_TASKS[currentStepIdx];
        readingStartTime = performance.now();

        container.innerHTML = `
            <div class="assessment-header">
                <div class="round-badge">Part 2: Comprehension • Scenario ${currentStepIdx + 1} of ${COMP_TASKS.length}</div>
                <h2>${task.title}</h2>
                <div style="margin-top:var(--space-sm)">
                    <span class="cl-level-badge ${task.badge}" style="padding:4px 10px;border-radius:var(--radius-md);font-size:0.75rem;font-weight:600">${task.badgeLabel}</span>
                </div>
            </div>
            <div class="assessment-card">
                <div class="cl-reading-box" style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-lg);margin-bottom:var(--space-lg)">
                    <pre style="white-space:pre-wrap;font-family:inherit;margin:0;font-size:0.95rem;line-height:1.7;color:var(--text-primary)">${task.text}</pre>
                </div>
                <div style="background:var(--accent-dim);border:1px dashed var(--border-accent);padding:var(--space-md);border-radius:var(--radius-md);font-size:0.85rem;margin-bottom:var(--space-lg);line-height:1.5">
                    💡 <strong>Important</strong>: Read the instructions carefully to understand the details. Once you click <strong>Proceed</strong>, the text will be <strong>hidden</strong> and you will answer comprehension questions about it.
                </div>
                <div class="assessment-footer">
                    <button class="btn btn-primary btn-lg" id="comp-proceed-btn" style="width:100%">I have finished reading. Proceed to Questions →</button>
                </div>
            </div>`;

        document.getElementById('comp-proceed-btn').addEventListener('click', () => {
            const readTime = performance.now() - readingStartTime;
            showComprehensionQuestions(task, readTime);
        });
    }

    function showComprehensionQuestions(task, readTime) {
        questionStartTime = performance.now();
        compAnswers = new Array(task.questions.length).fill(null);

        renderQuestionsView(task, readTime);
    }

    function renderQuestionsView(task, readTime) {
        container.innerHTML = `
            <div class="assessment-header">
                <div class="round-badge">Part 2: Comprehension Questions</div>
                <h2>Answer Questions for: ${task.title}</h2>
                <p>Select the correct answer based on what you just read. (Instructions are hidden)</p>
            </div>
            <div class="assessment-card">
                <div class="comp-questions-list" style="display:flex;flex-direction:column;gap:var(--space-lg);margin-bottom:var(--space-xl);text-align:left">
                    ${task.questions.map((qObj, qIdx) => `
                        <div class="comp-question-block" style="border-bottom:1px solid rgba(255,255,255,0.04);padding-bottom:var(--space-md)">
                            <h4 style="font-size:1rem;margin-bottom:var(--space-md);color:var(--text-primary)">${qIdx + 1}. ${qObj.q}</h4>
                            <div style="display:flex;flex-direction:column;gap:var(--space-xs)">
                                ${qObj.options.map((opt, oIdx) => {
                                    const isSelected = compAnswers[qIdx] === oIdx;
                                    const borderStyle = isSelected ? 'border-color:var(--accent);background:var(--accent-dim)' : 'border-color:rgba(255,255,255,0.1);background:rgba(255,255,255,0.01)';
                                    return `
                                        <button class="comp-opt-btn btn-choice" data-qidx="${qIdx}" data-oidx="${oIdx}" style="text-align:left;padding:var(--space-sm) var(--space-md);border:1px solid;border-radius:var(--radius-md);cursor:pointer;color:var(--text-primary);transition:all 0.2s; ${borderStyle}">
                                            ${opt}
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="assessment-footer">
                    <button class="btn btn-primary" id="comp-submit-btn" style="width:100%" disabled>Please answer all questions</button>
                </div>
            </div>`;

        const optBtns = container.querySelectorAll('.comp-opt-btn');
        const submitBtn = document.getElementById('comp-submit-btn');

        optBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const qIdx = parseInt(btn.dataset.qidx);
                const oIdx = parseInt(btn.dataset.oidx);
                compAnswers[qIdx] = oIdx;

                renderQuestionsView(task, readTime);
            });
        });

        const allAnswered = compAnswers.every(ans => ans !== null);
        if (allAnswered) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Answers →';
            // Use unique listener wrapper
            const clickHandler = () => {
                const qTime = performance.now() - questionStartTime;
                recordComprehensionAnswers(task, readTime, qTime);
            };
            submitBtn.replaceWith(submitBtn.cloneNode(true));
            document.getElementById('comp-submit-btn').addEventListener('click', clickHandler);
        }
    }

    function recordComprehensionAnswers(task, readTime, qTime) {
        let correctCount = 0;
        task.questions.forEach((qObj, idx) => {
            if (compAnswers[idx] === qObj.correct) {
                correctCount++;
            }
        });

        compResults.push({
            level: task.level,
            title: task.title,
            complexity: task.badge,
            questionCount: task.questions.length,
            correctCount: correctCount,
            readTimeMs: Math.round(readTime),
            questionTimeMs: Math.round(qTime)
        });

        currentStepIdx++;
        if (currentStepIdx < COMP_TASKS.length) {
            showComprehensionReading();
        } else {
            finishAssessment();
        }
    }

    function finishAssessment() {
        const avgGranScore = Math.round(
            granSelections.reduce((s, r) => s + r.score, 0) / granSelections.length
        );

        let prefLevel = 'medium';
        if (avgGranScore >= 70) prefLevel = 'high';
        else if (avgGranScore < 40) prefLevel = 'low';

        const choices = granSelections.map(s => s.reliableChoice);
        const uniqueChoices = new Set(choices).size;
        const consistency = uniqueChoices === 1 ? 100 : uniqueChoices === 2 ? 67 : 33;

        const totalCorrect = compResults.reduce((s, r) => s + r.correctCount, 0);
        const totalQuestions = compResults.reduce((s, r) => s + r.questionCount, 0);
        const accuracyRatio = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;
        
        const totalReadTime = compResults.reduce((s, r) => s + r.readTimeMs, 0) / 1000;
        const speedBonus = totalReadTime < 45 ? 10 : totalReadTime < 90 ? 5 : 0;

        let dropOffPenalty = 0;
        if (compResults.length >= 3) {
            const simpleAcc = compResults[0].correctCount / compResults[0].questionCount;
            const complexAcc = compResults[2].correctCount / compResults[2].questionCount;
            const dropOff = simpleAcc - complexAcc;
            if (dropOff > 0.5) dropOffPenalty = 15;
            else if (dropOff > 0.3) dropOffPenalty = 8;
        }

        const cognitiveLoadScore = Math.max(0, Math.min(100, Math.round(accuracyRatio * 90 + speedBonus - dropOffPenalty)));

        onComplete({
            score: cognitiveLoadScore,
            metrics: {
                granularityScore: avgGranScore,
                cognitiveLoadScore: cognitiveLoadScore,
                granularitySelections: granSelections,
                granularityPreferredLevel: prefLevel,
                granularityConsistency: consistency,
                comprehensionResults: compResults,
                totalCompCorrect: totalCorrect,
                totalCompQuestions: totalQuestions,
                totalReadTimeSeconds: Math.round(totalReadTime),
                dropOffPenalty
            }
        });
    }

    window.ADHD.assessments['granularity-cognitive-load'] = {
        id: 'granularity-cognitive-load',
        name: 'Granularity & Cognitive Load',
        icon: '🔬',
        shortName: 'Cog. Style',
        description: 'Measures instruction detail preference and reading comprehension limits under text load',
        profileKey: 'granularity-cognitive-load',
        init(el, done) {
            container = el;
            onComplete = done;
            currentPart = 1;
            currentStepIdx = 0;
            granSelections = [];
            compResults = [];
            renderIntro();
        }
    };
})();
