// API Service for Qwen and Wan 2.1/2.2 via Replicate

const REPLICATE_API_URL = "https://api.replicate.com/v1";

// Default models on Replicate
export const DEFAULT_MODELS = {
  qwen: "lucataco/qwen2.5-72b-instruct",
  wan: "lucataco/wan2.1-t2v-14b"
};

/**
 * Polls a prediction until it completes (succeeded or failed)
 */
async function pollPrediction(predictionId, token) {
  const url = `${REPLICATE_API_URL}/predictions/${predictionId}`;
  
  while (true) {
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to check prediction status: ${response.statusText}`);
    }

    const prediction = await response.json();
    
    if (prediction.status === "succeeded") {
      return prediction;
    } else if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(`Generation prediction failed: ${prediction.error || "Unknown error"}`);
    }

    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2500));
  }
}

/**
 * Calls Replicate to start a prediction
 */
async function createPrediction(modelName, input, token) {
  // Check if we are using model deployments or official model paths
  const url = `${REPLICATE_API_URL}/models/${modelName}/predictions`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Prefer": "wait=false"
    },
    body: JSON.stringify({ input })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `Replicate API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Prompts Qwen to break down an everyday task
 */
export async function generateTaskBreakdown(taskName, token, model = DEFAULT_MODELS.qwen) {
  if (!token) {
    throw new Error("Replicate API token is required for live generation.");
  }

  const systemPrompt = `You are an expert occupational therapist specializing in ADHD support and task analysis.
Your job is to take an everyday task and break it down into a sequence of 3 to 5 clear, micro-steps.
Individuals with ADHD experience executive dysfunction, so:
- Each step must focus on ONE simple, concrete physical action.
- Use direct, encouraging, clear language.
- Minimize text. Do not overwhelm them.
- For each step, provide a checklist of 2 to 4 even simpler sub-tasks.
- For each step, create an optimized video generation prompt for the Wan2.1 video model. The prompt should describe a clear, focused, photorealistic video loop of the action being performed (e.g., "Close up shot of a hand placing a cup under a tap, clean background, slow motion, photorealistic, 4k").
- Estimate the time for each step in seconds.

You MUST respond ONLY with a valid JSON array of steps. Do not include any markdown formatting, backticks, or intro/outro text. The format must match:
[
  {
    "title": "Step title",
    "description": "ADHD-friendly step explanation",
    "duration": 60,
    "subtasks": ["subtask 1", "subtask 2"],
    "prompt": "Wan video prompt describing the action"
  }
]`;

  const userPrompt = `Break down this everyday task: "${taskName}"`;

  const input = {
    prompt: userPrompt,
    system_prompt: systemPrompt,
    max_tokens: 1500,
    temperature: 0.2
  };

  const prediction = await createPrediction(model, input, token);
  const result = await pollPrediction(prediction.id, token);
  
  // Parse the output from Qwen
  // Replicate output for LLMs is usually an array of strings representing tokens
  let outputText = "";
  if (Array.isArray(result.output)) {
    outputText = result.output.join("");
  } else if (typeof result.output === "string") {
    outputText = result.output;
  } else {
    throw new Error("Invalid output format returned by Qwen.");
  }

  // Clean JSON string from markdown blocks if any
  const cleanedText = outputText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    const steps = JSON.parse(cleanedText);
    if (!Array.isArray(steps)) {
      throw new Error("Output is not an array");
    }
    return steps.map((step, idx) => ({
      id: `live-step-${idx}`,
      ...step,
      videoUrl: null // Generated on demand
    }));
  } catch (err) {
    console.error("Failed to parse Qwen output as JSON:", cleanedText);
    throw new Error("Failed to parse the structured step list. Please try again.");
  }
}

/**
 * Generates a video using Wan 2.1/2.2 on Replicate
 */
export async function generateWanVideo(prompt, token, model = DEFAULT_MODELS.wan) {
  if (!token) {
    throw new Error("Replicate API token is required for live video generation.");
  }

  // Wan input parameters: prompt, aspect_ratio, frame_rate, etc.
  const input = {
    prompt: prompt,
    aspect_ratio: "16:9",
    num_frames: 81, // Standard for Wan 2.1 t2v (approx. 5 seconds)
    resolution: "480p" // 480p is fast and cheap for prototyping
  };

  const prediction = await createPrediction(model, input, token);
  const result = await pollPrediction(prediction.id, token);
  
  // Replicate Wan outputs are usually a URL string or an array containing a single URL string
  let videoUrl = "";
  if (Array.isArray(result.output) && result.output.length > 0) {
    videoUrl = result.output[0];
  } else if (typeof result.output === "string") {
    videoUrl = result.output;
  } else {
    throw new Error("Invalid output format returned by Wan video generator.");
  }

  return videoUrl;
}

/**
 * Prompts Qwen locally via the local Python/Ollama backend (no GPU needed for Qwen)
 */
export async function generateTaskBreakdownLocal(taskName, model = "qwen2.5:7b", backendUrl = "http://localhost:8000", geminiApiKey = null, numSteps = 6, severity = "Moderate") {
  let cleanUrl = backendUrl.trim().replace(/\/+$/, "");
  try {
    const parsed = new URL(cleanUrl);
    cleanUrl = parsed.origin;
    if (cleanUrl.includes("0.0.0.0")) {
      cleanUrl = cleanUrl.replace("0.0.0.0", "localhost");
    }
  } catch (e) {}

  const headers = {
    "Content-Type": "application/json"
  };
  if (geminiApiKey) {
    headers["X-Gemini-API-Key"] = geminiApiKey;
  }

  const response = await fetch(`${cleanUrl}/api/breakdown`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({ taskName, model, numSteps, severity })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `Local server error: ${response.status} ${response.statusText}`);
  }

  const steps = await response.json();
  return steps.map((step, idx) => ({
    id: `local-step-${idx}`,
    ...step,
    videoUrl: null // Ready to be assigned a local loop or generated on demand
  }));
}

/**
 * Triggers local Wan 2.1 video generation on the Python backend (requires Nvidia GPU)
 */
export async function generateWanVideoLocal(prompt, stepId, model = "Wan-AI/Wan2.1-T2V-1.3B", backendUrl = "http://localhost:8000", geminiApiKey = null) {
  let cleanUrl = backendUrl.trim().replace(/\/+$/, "");
  try {
    const parsed = new URL(cleanUrl);
    cleanUrl = parsed.origin;
    if (cleanUrl.includes("0.0.0.0")) {
      cleanUrl = cleanUrl.replace("0.0.0.0", "localhost");
    }
  } catch (e) {}

  const headers = {
    "Content-Type": "application/json"
  };
  if (geminiApiKey) {
    headers["X-Gemini-API-Key"] = geminiApiKey;
  }

  const response = await fetch(`${cleanUrl}/api/generate-video`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({ prompt, stepId, model })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `Local video generation failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.videoUrl;
}

