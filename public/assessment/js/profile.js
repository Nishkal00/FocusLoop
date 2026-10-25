/* ==========================================================
   Profile Display, Radar Chart & Adaptive Task Generator
   ========================================================== */
(function () {
    window.ADHD = window.ADHD || {};

    const TASK_TEMPLATES = {
        'clean bedroom': {
            low: [
                { title: 'Clear floor clutter', desc: 'Sort items on the floor and put them away.' },
                { title: 'Wipe surfaces', desc: 'Dust and wipe down your desk and shelves.' },
                { title: 'Make bed and vacuum', desc: 'Tidy your bed sheets and vacuum the carpet.' }
            ],
            medium: [
                { title: 'Sort clothes', desc: 'Gather dirty clothes and place them in the laundry hamper.' },
                { title: 'Clear trash and dishes', desc: 'Throw wrappers in the bin and return cups to the kitchen.' },
                { title: 'Organize desk', desc: 'Clear off books, papers, and laptop from your desk.' },
                { title: 'Make the bed', desc: 'Pull up the sheets, fluff pillows, and lay comforter flat.' },
                { title: 'Vacuum the floor', desc: 'Run the vacuum cleaner over the entire carpeted area.' }
            ],
            high: [
                { title: 'Pick up floor clothes', desc: 'Gather all dirty clothes from the floor and drop them in the hamper.' },
                { title: 'Put away clean clothes', desc: 'Hang shirts in the closet and put socks/underwear in their drawers.' },
                { title: 'Empty the trash', desc: 'Collect all wrappers, papers, and trash and put them in the trash bin.' },
                { title: 'Remove dishes', desc: 'Take any cups, mugs, plates, or cutlery back to the kitchen sink.' },
                { title: 'Wipe down the desk', desc: 'Move everything off your desk surface and wipe it down with cleaner.' },
                { title: 'Organize papers/books', desc: 'Stack loose books in the corner and place pens back in their holders.' },
                { title: 'Make the bed sheets', desc: 'Pull the fitted sheet tight, lay the flat sheet, and adjust the comforter.' },
                { title: 'Vacuum the corners', desc: 'Vacuum the floor, moving chairs out of the way to reach under the desk.' }
            ]
        },
        'research report': {
            low: [
                { title: 'Gather references', desc: 'Search for articles and save relevant reference links.' },
                { title: 'Create report outline', desc: 'Write down a bulleted outline for each major section.' },
                { title: 'Draft and review', desc: 'Write the introduction, body paragraphs, and proofread.' }
            ],
            medium: [
                { title: 'Search credible articles', desc: 'Find 3 credible source articles or papers on the topic.' },
                { title: 'Create structured outline', desc: 'Outline sections for Intro, 3 Body points, and Conclusion.' },
                { title: 'Draft intro and thesis', desc: 'Write your introduction and 1-sentence main thesis.' },
                { title: 'Draft body points', desc: 'Write 3 paragraphs supporting your thesis with sources.' },
                { title: 'Proofread and cite', desc: 'Check spelling and add your source bibliography links.' }
            ],
            high: [
                { title: 'Open search engine', desc: 'Open your browser and navigate to Google Scholar or your library database.' },
                { title: 'Save source links', desc: 'Search terms, select 3 articles, and copy their citation links to a document.' },
                { title: 'Draft outline bullet points', desc: 'Write a quick list containing 3 supporting points you plan to make.' },
                { title: 'Write introduction', desc: 'Write your opening paragraph including your core thesis statement.' },
                { title: 'Write body point 1', desc: 'Draft the first body section, incorporating evidence from source 1.' },
                { title: 'Write body point 2', desc: 'Draft the second body section, incorporating evidence from source 2.' },
                { title: 'Write body point 3', desc: 'Draft the third body section, incorporating evidence from source 3.' },
                { title: 'Run a spelling check', desc: 'Activate spellcheck, correct typos, and verify proper section headings.' },
                { title: 'Format bibliography', desc: 'Format your 3 source links at the bottom under references.' }
            ]
        },
        'pay bills': {
            low: [
                { title: 'Collect all bills', desc: 'Locate paper bills and online billing statements.' },
                { title: 'Pay bills online', desc: 'Log in to your bank and process the outstanding payments.' },
                { title: 'Record confirmations', desc: 'Note down payment dates and save confirmation numbers.' }
            ],
            medium: [
                { title: 'Gather bills', desc: 'Collect paper mail bills and search inbox for email invoices.' },
                { title: 'Log in to bank portal', desc: 'Open your bank account dashboard in your browser.' },
                { title: 'Pay utility bills', desc: 'Use bill pay to send money to electricity and water services.' },
                { title: 'Pay credit card bills', desc: 'Submit at least the minimum amount due on your credit card.' },
                { title: 'File confirmation', desc: 'Log the payment amounts and dates in your budget sheet.' }
            ],
            high: [
                { title: 'Collect paper & e-mail bills', desc: 'Stack paper envelopes on your desk and search email for "statement".' },
                { title: 'Log in securely', desc: 'Log in to your primary online bank account securely.' },
                { title: 'Pay electric bill online', desc: 'Navigate to your electric account provider, enter details, and pay.' },
                { title: 'Pay water bill online', desc: 'Navigate to your water provider portal and submit payment.' },
                { title: 'Pay credit card statement', desc: 'Log in to your credit card bank and pay statement or minimum balance.' },
                { title: 'Note confirmation codes', desc: 'Copy payment confirmations and write "PAID [Date]" on paper bills.' },
                { title: 'Organize paid documents', desc: 'File the paid invoices into a cabinet folder or recycle envelopes.' }
            ]
        },
        'morning routine': {
            low: [
                { title: 'Wake up and wash up', desc: 'Stretch, get out of bed, wash face, and brush teeth.' },
                { title: 'Dressed and fed', desc: 'Change into clothes and eat a quick breakfast.' },
                { title: 'Bag check and leave', desc: 'Grab keys/wallet and lock the front door.' }
            ],
            medium: [
                { title: 'Drink water and stretch', desc: 'Get out of bed, stretch, and drink a glass of water.' },
                { title: 'Brush teeth & wash face', desc: 'Brush teeth for 2 minutes and splash cold water on face.' },
                { title: 'Get dressed', desc: 'Change into clean clothes selected the night before.' },
                { title: 'Eat breakfast', desc: 'Eat cereal, toast, or fruit and take daily vitamins.' },
                { title: 'Grab bag and keys', desc: 'Check that you have keys, wallet, and phone, then lock up.' }
            ],
            high: [
                { title: 'Turn off alarm', desc: 'Turn off your morning alarm buzzer and sit up straight in bed.' },
                { title: 'Drink water', desc: 'Drink a full glass of fresh water placed on your bedside table.' },
                { title: 'Brush teeth', desc: 'Squeeze toothpaste on brush and brush all surfaces for 2 minutes.' },
                { title: 'Wash face & shower', desc: 'Splash cold water on your face and take a quick warm shower.' },
                { title: 'Select clean clothes', desc: 'Pick out clean underwear, socks, shirt, and pants, and put them on.' },
                { title: 'Eat breakfast cereal', desc: 'Pour a bowl of cereal or toast bread, and eat at the kitchen table.' },
                { title: 'Take vitamins', desc: 'Take any morning vitamins or supplements with a glass of juice.' },
                { title: 'Tidy kitchen counter', desc: 'Rinse your bowl/plate and place it neatly inside the kitchen sink.' },
                { title: 'Check pockets', desc: 'Put your phone, keys, and wallet in your pocket or backpack.' },
                { title: 'Lock front door', desc: 'Walk outside and lock the front door handle securely.' }
            ]
        }
    };

    window.ADHD.profile = {
        /**
         * Render the full profile results page.
         */
        render(container, profileData) {
            const { profile, details, timestamp, traits } = profileData;
            const scoring = window.ADHD.scoring;

            const dimensionKeys = [
                'attention_score',
                'working_memory_score',
                'task_initiation_score',
                'planning_score',
                'granularity_preference_score',
                'cognitive_load_tolerance_score'
            ];

            const date = new Date(timestamp);
            const dateStr = date.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            const classification = profileData.classification || window.ADHD.scoring.classifyProfile(profile);

            container.innerHTML = `
                <div class="profile-container">
                    <div class="profile-hero">
                        <div style="font-size:3rem;margin-bottom:var(--space-md)">📊</div>
                        <h1>Your <span class="text-gradient">Cognitive Profile</span></h1>
                        <p>Completed on ${dateStr}</p>
                    </div>

                    <div class="radar-chart-container">
                        <canvas id="radar-chart" width="420" height="420"></canvas>
                    </div>

                    <div class="classification-card" style="background: var(--bg-card); border: 1px solid var(--border-accent); border-radius: var(--radius-lg); padding: var(--space-xl); margin-bottom: var(--space-xl); text-align: left; max-width: 800px; margin-left: auto; margin-right: auto; box-shadow: var(--shadow-glow);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-md); flex-wrap: wrap; gap: var(--space-sm)">
                            <div>
                                <span class="text-xs text-muted" style="text-transform: uppercase; letter-spacing: 0.05em">Your results</span>
                                <h2 style="color: var(--accent); margin-top: 4px; font-size: 1.65rem">${classification.classification}</h2>
                            </div>
                            <span class="wm-tag" style="background: ${classification.severity === 'Significant' ? 'var(--amber-dim)' : classification.severity === 'Moderate' ? 'var(--amber-dim)' : 'var(--success-dim)'}; color: ${classification.severity === 'Significant' ? 'var(--amber)' : classification.severity === 'Moderate' ? 'var(--amber)' : 'var(--success)'}; border-color: transparent; font-size: 0.8rem; padding: 6px 14px; border-radius: var(--radius-full); font-weight: 600">
                                Support level: ${classification.severity}
                            </span>
                        </div>
                        <p style="color: var(--text-primary); font-size: 0.95rem; margin-bottom: var(--space-lg); line-height: 1.7">${classification.description}</p>
                        
                        <div class="classification-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-md); margin-bottom: var(--space-lg)">
                            <div style="background: rgba(255,255,255,0.02); padding: var(--space-md); border-radius: var(--radius-md); border: 1px solid var(--border)">
                                <h4 style="color: var(--success); font-size: 0.9rem; margin-bottom: var(--space-sm); display: flex; align-items: center; gap: 6px">💪 What comes naturally</h4>
                                <ul style="padding-left: 18px; margin: 0; font-size: 0.85rem; color: var(--text-secondary)">
                                    ${classification.strengths.map(s => `<li style="margin-bottom:4px">${s}</li>`).join('')}
                                </ul>
                            </div>
                            <div style="background: rgba(255,255,255,0.02); padding: var(--space-md); border-radius: var(--radius-md); border: 1px solid var(--border)">
                                <h4 style="color: var(--amber); font-size: 0.9rem; margin-bottom: var(--space-sm); display: flex; align-items: center; gap: 6px">🌱 Where extra support helps</h4>
                                <ul style="padding-left: 18px; margin: 0; font-size: 0.85rem; color: var(--text-secondary)">
                                    ${classification.challenges.map(c => `<li style="margin-bottom:4px">${c}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                        
                        <div style="background: var(--accent-dim); border: 1px dashed var(--border-accent); padding: var(--space-md); border-radius: var(--radius-md); font-size: 0.9rem; color: var(--text-primary); line-height: 1.6">
                            <strong>💡 Adaptive Recommendation:</strong> ${classification.advice}
                        </div>
                    </div>

                    <div class="score-cards" id="score-cards"></div>

                    <div class="form-copy-banner">
                        <div>
                            <strong>Submitting this somewhere?</strong>
                            <p class="text-sm text-muted" style="margin-top:2px">Copy a plain-text summary of your results below and paste it into the form you were given.</p>
                        </div>
                        <button class="btn btn-primary" id="copy-summary-btn">📋 Copy My Results</button>
                    </div>

                    <details class="traits-card" style="background: var(--bg-card); border: 1px solid var(--border-accent); border-radius: var(--radius-lg); padding: var(--space-lg) var(--space-xl); margin-bottom: var(--space-xl); text-align: left; max-width: 800px; margin-left: auto; margin-right: auto;">
                        <summary style="cursor:pointer; color:var(--accent); font-weight:700; display:flex; align-items:center; gap:8px; list-style:none">🧠 See the details behind these scores</summary>
                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: var(--space-sm); margin-top: var(--space-md)">
                            ${Object.entries(traits || {}).map(([key, val]) => {
                                if (val === false || val === 999) return '';
                                let label = key.replace(/_/g, ' ');
                                label = label.charAt(0).toUpperCase() + label.slice(1);
                                let icon = '⚙️';
                                if (key.includes('focus') || key.includes('attention')) icon = '🎯';
                                else if (key.includes('memory') || key.includes('remind') || key.includes('written') || key.includes('chunk')) icon = '🧠';
                                else if (key.includes('starting') || key.includes('initiation') || key.includes('latency') || key.includes('procrastination') || key.includes('paralysis') || key.includes('nudge')) icon = '🚀';
                                else if (key.includes('planning') || key.includes('dependency') || key.includes('sequence')) icon = '📋';
                                else if (key.includes('granularity')) icon = '🔬';
                                else if (key.includes('complexity') || key.includes('overload') || key.includes('load')) icon = '⚡';
                                
                                let valText = val === true ? 'Active' : `Value: ${val}`;
                                return `
                                    <div style="background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.04); border-radius:var(--radius-md); padding:var(--space-sm) var(--space-md); display:flex; align-items:center; gap:8px">
                                        <span style="font-size:1.15rem">${icon}</span>
                                        <div>
                                            <div style="font-weight:600; font-size:0.85rem; color:var(--text-primary); line-height:1.2">${label}</div>
                                            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px">${valText}</div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </details>

                    <div class="profile-actions" style="display:flex; flex-direction:column; gap:var(--space-sm); width:100%">
                        <button class="btn btn-primary btn-lg w-full" id="proceed-planner-btn" style="background:var(--accent); color:white; border:none; padding:12px; font-weight:700">🚀 Proceed to Task Planner</button>
                        <div style="display:flex; gap:var(--space-sm); width:100%">
                            <button class="btn btn-secondary btn-lg" id="download-json-btn" style="flex:1">⬇ Download Profile</button>
                            <button class="btn btn-secondary btn-lg" id="retake-btn" style="flex:1">↻ Retake</button>
                        </div>
                    </div>
                </div>`;

            // Render score cards
            const cardsContainer = document.getElementById('score-cards');
            dimensionKeys.forEach(key => {
                const info = scoring.getDimensionInfo(key);
                const score = profile[key] || 0;
                const level = scoring.getScoreLevel(key === 'granularity_preference_score' ? 50 : score);
                const isGranularity = key === 'granularity_preference_score';
                const barClass = isGranularity ? 'medium' : level.cssClass;
                const descText = score >= 50 ? info.highText : info.lowText;

                const card = document.createElement('div');
                card.className = 'score-card';
                card.innerHTML = `
                    <div class="score-card-header">
                        <span class="score-card-icon">${info.icon}</span>
                        <span class="score-card-title">${info.name}</span>
                    </div>
                    <div class="score-card-value" style="color:${isGranularity ? 'var(--accent)' : level.color}">${score}</div>
                    <div class="score-bar-track">
                        <div class="score-bar-fill ${barClass}" data-score="${score}"></div>
                    </div>
                    <p class="score-card-desc">${descText}</p>`;
                cardsContainer.appendChild(card);
            });

            // Animate score bars
            requestAnimationFrame(() => {
                setTimeout(() => {
                    document.querySelectorAll('.score-bar-fill').forEach(bar => {
                        bar.style.width = bar.dataset.score + '%';
                    });
                }, 100);
            });

            // Draw radar chart
            this.drawRadarChart(
                document.getElementById('radar-chart'),
                dimensionKeys.map(k => profile[k] || 0),
                dimensionKeys.map(k => scoring.getDimensionInfo(k).name)
            );

            // Copy plain-text summary (for pasting into a Google Form, email, etc.)
            document.getElementById('copy-summary-btn').addEventListener('click', () => {
                const lines = [];
                lines.push(`ADHD Adaptive Planner - Results`);
                lines.push(`Completed: ${dateStr}`);
                lines.push(`Classification: ${classification.classification}`);
                lines.push(`Support level: ${classification.severity}`);
                lines.push('');
                lines.push('Scores (0-100):');
                dimensionKeys.forEach(key => {
                    const info = scoring.getDimensionInfo(key);
                    const score = profile[key] || 0;
                    lines.push(`- ${info.name}: ${score}`);
                });
                lines.push('');
                lines.push('What comes naturally:');
                classification.strengths.forEach(s => lines.push(`- ${s}`));
                lines.push('');
                lines.push('Where extra support helps:');
                classification.challenges.forEach(c => lines.push(`- ${c}`));
                const summaryText = lines.join('\n');

                const GOOGLE_FORM_URL = 'https://forms.gle/TWbKfefAhw7teB4B9';
                const btn = document.getElementById('copy-summary-btn');
                const resetLabel = () => setTimeout(() => btn.textContent = '📋 Copy My Results', 2500);

                const openForm = () => {
                    btn.textContent = '✓ Copied - paste it in the tab that opened';
                    window.open(GOOGLE_FORM_URL, '_blank', 'noopener');
                    resetLabel();
                };

                navigator.clipboard.writeText(summaryText).then(openForm).catch(() => {
                    const textarea = document.createElement('textarea');
                    textarea.value = summaryText;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    openForm();
                });
            });

            // Download JSON
            document.getElementById('download-json-btn').addEventListener('click', () => {
                const blob = new Blob([JSON.stringify(profileData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `adhd-profile-${date.toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
            });

            // Retake
            document.getElementById('retake-btn').addEventListener('click', () => {
                if (confirm('Start a new assessment? Your current results are saved.')) {
                    // Clear profile to allow starting fresh
                    localStorage.removeItem('adhd_profile');
                    localStorage.removeItem('adhd_raw_assessment_data');
                    window.ADHD.app.restart();
                }
            });

            // Proceed to Planner
            const proceedBtn = document.getElementById('proceed-planner-btn');
            if (proceedBtn) {
                proceedBtn.addEventListener('click', () => {
                    window.parent.postMessage({ type: 'assessment_complete' }, '*');
                });
            }
        },

        /**
         * Draw a radar / spider chart on a canvas.
         */
        drawRadarChart(canvas, values, labels) {
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2;
            const maxRadius = Math.min(cx, cy) - 55;
            const n = values.length;
            const angleStep = (Math.PI * 2) / n;
            const startAngle = -Math.PI / 2;

            ctx.clearRect(0, 0, w, h);

            // concentric rings
            const rings = [20, 40, 60, 80, 100];
            rings.forEach(ring => {
                const r = (ring / 100) * maxRadius;
                ctx.beginPath();
                for (let i = 0; i <= n; i++) {
                    const angle = startAngle + i * angleStep;
                    const x = cx + r * Math.cos(angle);
                    const y = cy + r * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
                ctx.lineWidth = 1;
                ctx.stroke();

                if (ring % 40 === 0 || ring === 100) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.font = '10px Inter, sans-serif';
                    ctx.fillText(ring.toString(), cx + 4, cy - r + 12);
                }
            });

            // axis lines
            for (let i = 0; i < n; i++) {
                const angle = startAngle + i * angleStep;
                const x = cx + maxRadius * Math.cos(angle);
                const y = cy + maxRadius * Math.sin(angle);
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(x, y);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // data polygon
            ctx.beginPath();
            for (let i = 0; i <= n; i++) {
                const idx = i % n;
                const angle = startAngle + idx * angleStep;
                const r = (values[idx] / 100) * maxRadius;
                const x = cx + r * Math.cos(angle);
                const y = cy + r * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fillStyle = 'rgba(110, 147, 214, 0.15)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(110, 147, 214, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // data points
            for (let i = 0; i < n; i++) {
                const angle = startAngle + i * angleStep;
                const r = (values[i] / 100) * maxRadius;
                const x = cx + r * Math.cos(angle);
                const y = cy + r * Math.sin(angle);

                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fillStyle = '#6e93d6';
                ctx.fill();
                ctx.strokeStyle = '#8ba9de';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            ctx.fillStyle = '#a5a9b2';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            for (let i = 0; i < n; i++) {
                const angle = startAngle + i * angleStep;
                const labelR = maxRadius + 35;
                let x = cx + labelR * Math.cos(angle);
                let y = cy + labelR * Math.sin(angle);

                const words = labels[i].split(' ');
                if (words.length > 1) {
                    const lineHeight = 14;
                    const totalHeight = words.length * lineHeight;
                    const startY = y - totalHeight / 2 + lineHeight / 2;
                    words.forEach((word, wi) => {
                        ctx.fillText(word, x, startY + wi * lineHeight);
                    });
                } else {
                    ctx.fillText(labels[i], x, y);
                }

                const scoreR = maxRadius + 18;
                const sx = cx + scoreR * Math.cos(angle);
                const sy = cy + scoreR * Math.sin(angle);
                ctx.fillStyle = '#edeef0';
                ctx.font = 'bold 12px Inter, sans-serif';
                ctx.fillText(values[i].toString(), sx, sy);
                ctx.fillStyle = '#a5a9b2';
                ctx.font = '11px Inter, sans-serif';
            }
        }
    };
})();
