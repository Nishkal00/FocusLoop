/* ==========================================================
   Scoring Engine
   ========================================================== */
(function () {
    window.ADHD = window.ADHD || {};

    window.ADHD.scoring = {
        /**
         * Normalize a raw score to 0-100 with floor and ceiling.
         */
        normalize(raw, min = 0, max = 100) {
            return Math.round(Math.max(0, Math.min(100, ((raw - min) / (max - min)) * 100)));
        },

        /**
         * Build the final profile from individual assessment results.
         * @param {Object} results - Map of assessmentId → { score, metrics }
         * @returns {Object} profile + metadata
         */
        buildProfile(results) {
            const assessments = window.ADHD.assessments;
            const profile = {};
            const details = {};

            // Map each assessment result to its profile key
            for (const [id, assessment] of Object.entries(assessments)) {
                const result = results[id];
                if (result && id !== 'granularity-cognitive-load') {
                    const key = assessment.profileKey;
                    profile[key] = Math.round(Math.max(0, Math.min(100, result.score)));
                    details[key] = {
                        assessmentName: assessment.name,
                        icon: assessment.icon,
                        rawScore: result.score,
                        normalizedScore: profile[key],
                        metrics: result.metrics
                    };
                }
            }

            // Extract combined granularity & cognitive load scores
            const gclResult = results['granularity-cognitive-load'];
            if (gclResult && gclResult.metrics) {
                profile['granularity_preference_score'] = gclResult.metrics.granularityScore;
                profile['cognitive_load_tolerance_score'] = gclResult.metrics.cognitiveLoadScore;
                
                details['granularity_preference_score'] = {
                    assessmentName: 'Task Granularity Preference',
                    icon: '🔬',
                    rawScore: gclResult.metrics.granularityScore,
                    normalizedScore: gclResult.metrics.granularityScore,
                    metrics: gclResult.metrics
                };
                
                details['cognitive_load_tolerance_score'] = {
                    assessmentName: 'Cognitive Load Tolerance',
                    icon: '⚡',
                    rawScore: gclResult.metrics.cognitiveLoadScore,
                    normalizedScore: gclResult.metrics.cognitiveLoadScore,
                    metrics: gclResult.metrics
                };
            }

            // Ensure all expected keys exist with defaults
            const expectedKeys = [
                'attention_score',
                'working_memory_score',
                'task_initiation_score',
                'planning_score',
                'granularity_preference_score',
                'cognitive_load_tolerance_score'
            ];

            for (const key of expectedKeys) {
                if (!(key in profile)) {
                    profile[key] = 50; // default to 50
                }
            }

            const rawAssessmentData = {};
            for (const [id, result] of Object.entries(results)) {
                rawAssessmentData[id] = result.metrics;
            }

            const traits = this.interpretTraits(profile, results);
            const classification = this.classifyProfile(profile);

            return {
                profile,
                details,
                classification,
                traits,
                rawAssessmentData,
                timestamp: new Date().toISOString(),
                version: '1.1.0'
            };
        },

        /**
         * Rule-Based Interpreter: maps scores and raw metrics to traits & parameters.
         * Contains exactly 50 distinct rules with clear logical thresholds.
         */
        interpretTraits(profile, results) {
            const traits = {
                // Focus & Attention traits
                needs_focus_reminders: false,
                show_visual_separators: false,
                enable_motivational_cues: false,
                needs_focus_anchors: false,
                enable_milestone_celebrations: false,
                unpredictable_attention_lapses: false,
                prone_to_fatigue: false,
                susceptible_to_vigilance_decay: false,
                impulsive_responder: false,
                needs_deliberation_prompts: false,

                // Working Memory traits
                needs_written_references: false,
                needs_reminders: false,
                chunk_information: false,
                max_visible_steps: 999, // default (no limit)
                repeat_important_items: false,
                susceptible_to_interference: false,
                needs_processing_buffer: false,
                prefers_micro_checklists: false,
                can_handle_macro_tasks: false,

                // Task Initiation traits
                needs_starting_nudge: false,
                highlight_first_step: false,
                needs_momentum_booster: false,
                high_starting_hesitation: false,
                decision_paralysis: false,
                active_procrastination_tendency: false,
                starting_blockage: false,
                needs_gamified_start: false,
                needs_micro_commitments: false,
                self_directed_starter: false,

                // Planning & Sequencing traits
                highlight_dependencies: false,
                pre_sequenced_templates: false,
                struggles_with_dependencies: false,
                needs_guided_sequencing: false,
                unstable_planning_revisions: false,
                fine_motor_fidgeting: false,
                logical_planner: false,
                needs_phase_grouping: false,
                needs_pre_conditions_checklist: false,
                needs_clear_time_boxing: false,

                // Granularity & Cognitive Load traits
                prefers_low_granularity: false,
                prefers_high_granularity: false,
                prefers_medium_granularity: false,
                stable_granularity_preference: false,
                context_dependent_granularity: false,
                low_complexity_tolerance: false,
                needs_split_attention_mitigation: false,
                vulnerable_to_complexity_overload: false,
                slow_reading_processor: false,
                fast_reading_processor: false
            };

            const att = profile.attention_score ?? 50;
            const wm = profile.working_memory_score ?? 50;
            const init = profile.task_initiation_score ?? 50;
            const plan = profile.planning_score ?? 50;
            const gran = profile.granularity_preference_score ?? 50;
            const cog = profile.cognitive_load_tolerance_score ?? 50;

            const attMetrics = results['attention']?.metrics || {};
            const wmMetrics = results['working-memory']?.metrics || {};
            const initMetrics = results['task-initiation']?.metrics || {};
            const planMetrics = results['planning']?.metrics || {};
            const gclMetrics = results['granularity-cognitive-load']?.metrics || {};

            // 1. Attention Rules (1-10)
            if (att < 40) traits.needs_focus_reminders = true;
            if (att < 45) traits.show_visual_separators = true;
            if (att < 40) traits.enable_motivational_cues = true;
            if (att < 50) traits.needs_focus_anchors = true;
            if (att < 60) traits.enable_milestone_celebrations = true;
            if ((attMetrics.rtv || 0) > 100) traits.unpredictable_attention_lapses = true;
            if ((attMetrics.rtDecline || 0) > 60) traits.prone_to_fatigue = true;
            if ((attMetrics.accDecline || 0) > 15) traits.susceptible_to_vigilance_decay = true;
            if ((attMetrics.impulsiveCount || 0) > 3) traits.impulsive_responder = true;
            if ((attMetrics.impulsiveCount || 0) > 5) traits.needs_deliberation_prompts = true;

            // 2. Working Memory Rules (11-20)
            if (wm < 40) traits.needs_written_references = true;
            if (wm < 45) traits.needs_reminders = true;
            if (wm < 50) traits.chunk_information = true;
            if (wm < 40) traits.max_visible_steps = 3;
            if (wm < 30) traits.max_visible_steps = 2;
            if (wm < 40) traits.repeat_important_items = true;
            if ((wmMetrics.totalIncorrect || 0) > 2) traits.susceptible_to_interference = true;
            const avgRecallSpeed = (wmMetrics.rounds || []).reduce((s, r) => s + r.timeTakenMs, 0) / ((wmMetrics.rounds || []).length || 1) / 1000;
            if (avgRecallSpeed > 15) traits.needs_processing_buffer = true;
            if ((wmMetrics.estimatedSpan || 5) < 5) traits.prefers_micro_checklists = true;
            if ((wmMetrics.estimatedSpan || 5) >= 8) traits.can_handle_macro_tasks = true;

            // 3. Task Initiation Rules (21-30)
            if (init < 40) traits.needs_starting_nudge = true;
            if (init < 45) traits.highlight_first_step = true;
            if (init < 50) traits.needs_momentum_booster = true;
            if ((initMetrics.avgRevisions || 0) > 1.5) traits.high_starting_hesitation = true;
            if ((initMetrics.avgLatencySeconds || 0) > 6) traits.decision_paralysis = true;
            const delayCount = (initMetrics.scenarios || []).filter(s => s.selectedOptionType === 'delay').length;
            const stuckCount = (initMetrics.scenarios || []).filter(s => s.selectedOptionType === 'stuck').length;
            if (delayCount >= 2) traits.active_procrastination_tendency = true;
            if (stuckCount >= 2) traits.starting_blockage = true;
            if (init < 35) traits.needs_gamified_start = true;
            if (init < 50) traits.needs_micro_commitments = true;
            if (init >= 70) traits.self_directed_starter = true;

            // 4. Planning & Sequencing Rules (31-40)
            if (plan < 50) traits.highlight_dependencies = true;
            if (plan < 45) traits.pre_sequenced_templates = true;
            const planRounds = planMetrics.rounds || [];
            const planViolations = planRounds.reduce((s, r) => s + (r.violations || 0), 0);
            const planRevisions = planRounds.reduce((s, r) => s + (r.revisionCount || 0), 0);
            const planDrags = planRounds.reduce((s, r) => s + (r.dragCount || 0), 0);
            if (planViolations > 1) traits.struggles_with_dependencies = true;
            if (planViolations > 2) traits.needs_guided_sequencing = true;
            if (planRevisions > 10) traits.unstable_planning_revisions = true;
            if (planDrags > 15) traits.fine_motor_fidgeting = true;
            if (plan >= 70) traits.logical_planner = true;
            if (plan < 60) traits.needs_phase_grouping = true;
            if (plan < 50) traits.needs_pre_conditions_checklist = true;
            if (plan < 40) traits.needs_clear_time_boxing = true;

            // 5. Granularity & Cognitive Load Rules (41-50)
            if (gran < 40) traits.prefers_low_granularity = true;
            if (gran >= 70) traits.prefers_high_granularity = true;
            if (gran >= 40 && gran < 70) traits.prefers_medium_granularity = true;
            if ((gclMetrics.granularityConsistency || 100) > 80) traits.stable_granularity_preference = true;
            if ((gclMetrics.granularityConsistency || 100) < 50) traits.context_dependent_granularity = true;
            if (cog < 45) traits.low_complexity_tolerance = true;
            if (cog < 50) traits.needs_split_attention_mitigation = true;
            if ((gclMetrics.dropOffPenalty || 0) > 0) traits.vulnerable_to_complexity_overload = true;
            if ((gclMetrics.totalReadTimeSeconds || 0) > 90) traits.slow_reading_processor = true;
            if ((gclMetrics.totalReadTimeSeconds || 0) < 30) traits.fast_reading_processor = true;

            return traits;
        },

        /**
         * Store profile in localStorage.
         */
        saveProfile(profileData) {
            try {
                localStorage.setItem('adhd_profile', JSON.stringify(profileData));
                localStorage.setItem('adhd_raw_assessment_data', JSON.stringify(profileData.rawAssessmentData));
                // Also save to history
                const history = JSON.parse(localStorage.getItem('adhd_profile_history') || '[]');
                history.push(profileData);
                if (history.length > 10) history.shift();
                localStorage.setItem('adhd_profile_history', JSON.stringify(history));
            } catch (e) {
                console.warn('Could not save profile to localStorage:', e);
            }

            // Also send to Firestore if configured, so submissions can be
            // viewed centrally. Fire-and-forget: local save above already
            // guarantees the person's own results aren't lost either way.
            if (window.ADHD.cloud && typeof window.ADHD.cloud.saveProfile === 'function') {
                window.ADHD.cloud.saveProfile(profileData);
            }
        },

        /**
         * Load most recent profile from localStorage.
         */
        loadProfile() {
            try {
                const data = localStorage.getItem('adhd_profile');
                return data ? JSON.parse(data) : null;
            } catch (e) {
                return null;
            }
        },

        /**
         * Categorize user based on executive functioning profile scores.
         */
        classifyProfile(profile) {
            const att = profile.attention_score ?? 50;
            const wm = profile.working_memory_score ?? 50;
            const init = profile.task_initiation_score ?? 50;
            const plan = profile.planning_score ?? 50;
            const cog = profile.cognitive_load_tolerance_score ?? 50;

            const lowAttention = att < 50;
            const lowMemory = wm < 50;
            const lowInitiation = init < 50;
            const lowPlanning = plan < 50;
            const lowCogLoad = cog < 50;

            let classification = "";
            let description = "";
            let strengths = [];
            let challenges = [];
            let advice = "";

            const under50Count = [lowAttention, lowMemory, lowInitiation, lowPlanning, lowCogLoad].filter(Boolean).length;

            if (under50Count >= 4) {
                classification = "Combined Executive Dysfunction Style";
                description = "Your profile shows significant challenges across multiple core executive functions, including focus, planning, memory, and task starting. This is very common in combined-type ADHD.";
                strengths = ["Capable of highly dynamic thinking", "Thrives in fast-paced or crisis situations", "Unique out-of-the-box brainstorming"];
                challenges = ["Severe task paralysis when beginning", "Easily loses track of instructions midway", "Gets overwhelmed by multi-step activities"];
                advice = "Use maximum task granularity. Always use Single-Step Focus Mode to clear cognitive clutter. Highlight a single first action to bypass starting paralysis.";
            } else if (lowAttention && lowMemory) {
                classification = "Inattentive / Focus-Vulnerable Style";
                description = "Your profile suggests strong starting and planning skills, but you face high susceptibility to distraction and working memory limits. This correlates closely with Predominantly Inattentive ADHD.";
                strengths = ["Logical planner and organizer", "Recognizes task dependencies clearly", "Motivated starter once engaged"];
                challenges = ["Prone to internal and external distractions", "Loses key information when working on complex steps", "Fatigues quickly during long, repetitive tasks"];
                advice = "Use Medium granularity. Enable 'Focus Anchors' (silencing devices, browser blocker). Keep steps short and use checkoffs immediately after finishing a step.";
            } else if (lowInitiation && lowPlanning) {
                classification = "Initiation & Sequencing Paralysis Style";
                description = "Your profile shows good sustained focus and memory capacity, but you struggle with task paralysis (starting) and arranging steps logically. This is common in ADHD with strong executive initiation deficits.";
                strengths = ["Strong detail retention", "Highly persistent once a task is started", "Deep focus capacity (hyperfocus potential)"];
                challenges = ["Friction and anxiety when beginning new projects", "Difficulty identifying the first physical step", "Struggles to order tasks by priority"];
                advice = "Use High granularity. Rely heavily on the 'First Action Highlight' feature. Rely on pre-sequenced templates or guides with clear phase dividers.";
            } else if (lowCogLoad) {
                classification = "Executive Overload-Sensitive Style";
                description = "You have solid focus, starting, and memory capacity, but your performance drops sharply as task complexity increases. Multi-faceted demands easily overwhelm your executive control.";
                strengths = ["High efficiency on single, well-defined tasks", "Excellent quality of work on focused topics", "Reliable execution under simple conditions"];
                challenges = ["Rapid burnout when multitasking", "Anxiety when facing ambiguous or large goals", "Difficulty managing split-attention tasks"];
                advice = "Use Medium/High granularity. Always group tasks into clear chronological phases (Setup, Action, Wrap-up) to limit active cognitive load.";
            } else {
                classification = "Balanced Executive Style";
                description = "Your profile shows well-regulated executive functioning scores. While you might experience symptoms of executive fatigue, your cognitive test metrics suggest balanced baseline regulation.";
                strengths = ["Balanced focus and retention", "Capable of scheduling and starting tasks independently", "Manages moderate complexity with ease"];
                challenges = ["Occasional drops in motivation", "Minor distractions under boring conditions", "Occasional detail errors when rushed"];
                advice = "Use Low or Medium granularity. Expand steps only when dealing with brand new or highly unfamiliar projects.";
            }

            return {
                classification,
                description,
                strengths,
                challenges,
                advice,
                severity: under50Count >= 3 ? "Significant" : under50Count >= 1 ? "Moderate" : "Mild/Balanced"
            };
        },

        /**
         * Get score level label and color class.
         */
        getScoreLevel(score) {
            if (score >= 70) return { label: 'High', cssClass: 'high', color: '#6bb583' };
            if (score >= 40) return { label: 'Moderate', cssClass: 'medium', color: '#d6a35f' };
            return { label: 'Low', cssClass: 'low', color: '#cf6b6b' };
        },

        /**
         * Get human-readable descriptions for each profile dimension.
         */
        getDimensionInfo(key) {
            const info = {
                attention_score: {
                    name: 'Sustained Attention',
                    icon: '🎯',
                    description: 'Ability to maintain focus on a task and respond accurately to stimuli over time.',
                    highText: 'Strong sustained attention. Can focus on repetitive tasks with minimal lapses.',
                    lowText: 'Attention may drift during extended tasks. Benefits from frequent breaks and varied formats.'
                },
                working_memory_score: {
                    name: 'Working Memory',
                    icon: '🧠',
                    description: 'Capacity to hold and manipulate information in short-term memory.',
                    highText: 'Strong working memory. Can handle multiple pieces of information simultaneously.',
                    lowText: 'Working memory may become overloaded. Benefits from written references and smaller information chunks.'
                },
                task_initiation_score: {
                    name: 'Task Initiation',
                    icon: '🚀',
                    description: 'Ability to identify concrete first steps and begin tasks without excessive hesitation.',
                    highText: 'Confident task starter. Quickly identifies actionable first steps.',
                    lowText: 'May struggle to begin tasks. Benefits from explicit first-step suggestions and starter prompts.'
                },
                planning_score: {
                    name: 'Planning & Sequencing',
                    icon: '📋',
                    description: 'Ability to arrange tasks in logical order considering dependencies and priorities.',
                    highText: 'Strong planner. Naturally considers task dependencies and optimal ordering.',
                    lowText: 'Sequencing can be challenging. Benefits from pre-ordered task lists and dependency highlights.'
                },

                granularity_preference_score: {
                    name: 'Granularity Preference',
                    icon: '🔬',
                    description: 'Natural level of task decomposition detail - how finely you break down tasks.',
                    highText: 'Naturally thinks in fine-grained steps. Prefers detailed, step-by-step instructions.',
                    lowText: 'Prefers high-level overviews. Detailed instructions may feel overwhelming - use expandable detail.'
                },
                cognitive_load_tolerance_score: {
                    name: 'Cognitive Load Tolerance',
                    icon: '⚡',
                    description: 'Ability to handle tasks of increasing complexity without significant quality drop-off.',
                    highText: 'Handles complex, multi-faceted tasks well. Comfortable with ambiguity and many moving parts.',
                    lowText: 'Performs best with well-defined, focused tasks. Complex tasks should be chunked into smaller pieces.'
                }
            };
            return info[key] || { name: key, icon: '📊', description: '', highText: '', lowText: '' };
        }
    };
})();
