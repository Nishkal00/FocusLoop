import os
import time
import json
from typing import List
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from dotenv import load_dotenv

# Load environmental variables from .env file
load_dotenv()

# Try importing torch and diffusers for local Wan execution
try:
    import torch
    from diffusers import WanPipeline
    from diffusers.utils import export_to_video
    HAS_DIFFUSERS = True
except ImportError:
    HAS_DIFFUSERS = False

app = FastAPI(title="FocusLoop Local Backend", description="Local server for running Gemini 2.5 Flash and Wan 2.1")

# Enable CORS for React Vite frontend (allowing all origins for local IP access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model lazy-loading
wan_pipeline = None

# Input schemas
class BreakdownRequest(BaseModel):
    taskName: str
    model: str = "gemini-2.5-flash"
    numSteps: int = 6
    severity: str = "Moderate"

class VideoRequest(BaseModel):
    prompt: str
    stepId: str
    model: str = "Wan-AI/Wan2.1-T2V-1.3B"

class StepResponse(BaseModel):
    title: str
    description: str
    duration: int
    subtasks: List[str]
    prompt: str

# Create output folders inside React public directory
PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../public"))
GENERATED_DIR = os.path.join(PUBLIC_DIR, "generated")
os.makedirs(GENERATED_DIR, exist_ok=True)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "has_diffusers": HAS_DIFFUSERS,
        "cuda_available": torch.cuda.is_available() if HAS_DIFFUSERS else False,
        "cuda_device": torch.cuda.get_device_name(0) if (HAS_DIFFUSERS and torch.cuda.is_available()) else None
    }

def generate_breakdown_via_gemini(task_name: str, api_key: str, num_steps: int = 6, severity: str = "Moderate") -> List[dict]:
    """
    Calls Google Gemini 2.5 Flash API directly using an HTTP request.
    Uses Structured Outputs (responseSchema) to guarantee a valid list of steps.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    # ADHD severity-specific language guidelines
    severity_guideline = ""
    if severity == "Significant":
        severity_guideline = (
            "The user has Significant/Severe executive dysfunction. Keep titles and descriptions extremely short, "
            "direct, and concrete. Write in simple, imperative sentences. Minimize any cognitive clutter. "
            "For subtasks, write very simple physical micro-tasks (e.g. 'pick up toothbrush', 'apply toothpaste')."
        )
    elif severity == "Moderate":
        severity_guideline = (
            "The user has Moderate executive dysfunction. Keep steps clear and actionable, with balanced details. "
            "Include helpful checklist items that break each step down into logical sub-phases."
        )
    else:
        severity_guideline = (
            "The user has Balanced/Mild executive functioning. Keep steps concise but you can use standard "
            "instructional complexity. Focus more on higher-level flow than basic micro-gestures."
        )

    prompt = (
        f"You are an expert occupational therapist specializing in ADHD task breakdowns and analysis.\n"
        f"Deconstruct the everyday task '{task_name}' into a sequence of exactly {num_steps} sequential steps.\n"
        f"Each step must focus on ONE simple, concrete milestone or phase of the task. Keep steps mature, functional, and helpful.\n"
        f"{severity_guideline}\n"
        f"If the task is extremely simple (e.g. 'drink water'), deconstruct it into mature, helpful steps by incorporating ADHD-specific strategies like preparing the environment, eliminating distractions, double-checking, and resetting the space."
    )
    
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "title": { "type": "STRING", "description": "Short, clear title of the step" },
                        "description": { "type": "STRING", "description": "ADHD-friendly description of the action required in this step" },
                        "duration": { "type": "INTEGER", "description": "Estimated time for the step in seconds, as a single integer (e.g., 90)" },
                        "subtasks": { 
                            "type": "ARRAY", 
                            "items": { "type": "STRING" },
                            "description": "List of 2 to 4 simpler, concrete sub-actions for the checklist"
                        },
                        "prompt": { "type": "STRING", "description": "An optimized video generation prompt for the Wan 2.1 model, describing a clear, focused, photorealistic video loop of the action being performed (e.g., 'Close up shot of a hand pouring water into a glass, clean background, slow motion')" }
                    },
                    "required": ["title", "description", "duration", "subtasks", "prompt"]
                }
            }
        }
    }
    
    headers = {"Content-Type": "application/json"}
    
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Gemini API request failed with status code {response.status_code}: {response.text}")
        
    result = response.json()
    
    # Check response structure
    try:
        text_content = result['candidates'][0]['content']['parts'][0]['text']
        return json.loads(text_content)
    except (KeyError, IndexError, ValueError) as e:
        raise Exception(f"Failed to parse Gemini API response: {str(e)}. Raw response: {result}")

@app.post("/api/breakdown", response_model=List[StepResponse])
def get_task_breakdown(request: BreakdownRequest, req: Request):
    print(f"Received request: taskName='{request.taskName}', model='{request.model}', numSteps={request.numSteps}, severity='{request.severity}'")
    
    # Extract Gemini API key from request headers or environment
    api_key = req.headers.get("x-gemini-api-key") or req.headers.get("X-Gemini-API-Key")
    if not api_key:
        api_key = os.getenv("GEMINI_API_KEY")
        
    if not api_key or api_key == "PASTE_YOUR_GEMINI_API_KEY_HERE" or not api_key.strip():
        raise HTTPException(
            status_code=400,
            detail="Gemini API Key is missing. Please paste your API key in the settings modal or in the backend/.env file."
        )

    try:
        parsed_steps = generate_breakdown_via_gemini(
            request.taskName, 
            api_key, 
            num_steps=request.numSteps, 
            severity=request.severity
        )
        print(f"Successfully generated {len(parsed_steps)} steps via Gemini.")
        return parsed_steps
    except Exception as e:
        print(f"Gemini generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini breakdown generation failed: {str(e)}")

@app.post("/api/generate-video")
def generate_video_locally(request: VideoRequest):
    global wan_pipeline
    
    if not HAS_DIFFUSERS:
        raise HTTPException(status_code=500, detail="Diffusers library not installed or GPU support is missing.")
        
    if not torch.cuda.is_available():
        raise HTTPException(status_code=503, detail="Local video generation requires an Nvidia GPU with CUDA. CPU is not supported.")

    output_filename = f"{request.stepId}_{int(time.time())}.mp4"
    output_path = os.path.join(GENERATED_DIR, output_filename)

    try:
        if wan_pipeline is None:
            print("Loading local Wan 2.1 GGUF model and VAE into VRAM...")
            from diffusers import WanTransformer3DModel, AutoencoderKLWan, GGUFQuantizationConfig
            
            # Paths to local files (reading from environment variables for Docker)
            gguf_path = os.getenv("GGUF_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "downloads", "Wan2.1-T2V-1.3B-Q4_K_M.gguf"))
            vae_path = os.getenv("VAE_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "downloads", "wan_2.1_vae.safetensors"))
            
            if not os.path.exists(gguf_path):
                raise FileNotFoundError(f"GGUF model not found at: {gguf_path}")
            if not os.path.exists(vae_path):
                raise FileNotFoundError(f"VAE model not found at: {vae_path}")
                
            # Load quantized transformer
            print(f"Loading transformer from {gguf_path}...")
            transformer = WanTransformer3DModel.from_single_file(
                gguf_path,
                config="Wan-AI/Wan2.1-T2V-1.3B-Diffusers",
                subfolder="transformer",
                quantization_config=GGUFQuantizationConfig(compute_dtype=torch.bfloat16),
                torch_dtype=torch.bfloat16,
            )
            
            # Load VAE
            print(f"Loading VAE from {vae_path}...")
            vae = AutoencoderKLWan.from_single_file(
                vae_path,
                torch_dtype=torch.bfloat16
            )
            vae.enable_tiling()
            vae.enable_slicing()
            
            # Load 4-bit UMT5 text encoder using bitsandbytes for maximum efficiency and VRAM savings
            print("Loading 4-bit UMT5 text encoder...")
            from transformers import UMT5EncoderModel, BitsAndBytesConfig
            quantization_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.bfloat16,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True
            )
            text_encoder = UMT5EncoderModel.from_pretrained(
                "Wan-AI/Wan2.1-T2V-1.3B-Diffusers",
                subfolder="text_encoder",
                quantization_config=quantization_config,
                device_map={"": 0},
                torch_dtype=torch.bfloat16,
                low_cpu_mem_usage=True
            )
            
            # Initialize pipeline with local components
            print("Initializing WanPipeline...")
            wan_pipeline = WanPipeline.from_pretrained(
                "Wan-AI/Wan2.1-T2V-1.3B-Diffusers",
                transformer=transformer,
                vae=vae,
                text_encoder=text_encoder,
                torch_dtype=torch.bfloat16
            )
            
            # Optionally load fine-tuned LoRA weights
            lora_path = os.path.join(os.path.dirname(__file__), "weights", "wan_lora.safetensors")
            if os.path.exists(lora_path):
                print(f"Loading fine-tuned LoRA weights from {lora_path}...")
                try:
                    # In diffusers, LoRA weights are loaded directly on the pipeline
                    # and merged into the active transformer/text encoder layers.
                    wan_pipeline.load_lora_weights(lora_path, adapter_name="wan_lora")
                    # Optionally set active adapter scale (e.g. 0.9 or 1.0)
                    wan_pipeline.set_adapters(["wan_lora"], adapter_weights=[0.9])
                    print("LoRA weights loaded and activated successfully!")
                except Exception as lora_err:
                    print(f"Warning: Failed to load LoRA weights: {lora_err}. Proceeding with base model.")
            else:
                print("No fine-tuned LoRA weights found at backend/weights/wan_lora.safetensors. Running base model.")
            
            # Move pipeline components directly to GPU instead of using CPU offloading
            # to avoid device mismatch conflicts with the quantized 4-bit UMT5 text encoder.
            wan_pipeline.to("cuda") 
            print("Model loaded successfully on GPU!")

        print(f"Generating video for prompt: {request.prompt}")
        video_frames = wan_pipeline(
            prompt=request.prompt,
            num_frames=17,
            width=512,
            height=288,
            num_inference_steps=20,
            generator=torch.manual_seed(42)
        ).frames[0]

        export_to_video(video_frames, output_path, fps=16)
        return {"videoUrl": f"/generated/{output_filename}"}

    except Exception as e:
        print(f"Video generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Local Wan generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
