# FocusLoop Benchmark & Resource Execution Profile
This document presents the experimental profiling and benchmark results of the FocusLoop local Edge-AI video generation pipeline on an **NVIDIA GeForce RTX 4050 Laptop GPU (6GB VRAM)**.

## Experimental Parameters
* **Base Model**: Wan 2.1 1.3B (Q4_K_M GGUF Transformer + FP16 VAE)
* **Text Encoder**: UMT5 XXL (4-bit bitsandbytes quantization)
* **LoRA Adapter**: fine-tuned task-specific adapter (`wan_lora.safetensors`)
* **Output Dimensions**: 512x288 resolution, 17 frames at 16 FPS (~1.06s duration)
* **Sampling settings**: 20 Denoising Steps, Euler Ancestral scheduler, fixed seed (42)
* **Optimization**: Modular Loading (Pre-embedding prompts & clearing text encoder before loading diffusion model)
* **Warm-up**: Run 1 discarded. Means and standard deviations computed over Runs 2–5.

---

## Table 1: Model & Adapter Architectural Footprint
This table evaluates the parameters and disk storage footprint of the local model components.

| Model / Component | Parameter Count | File Size on Disk (MB) | File Size on Disk (GB) |
| :--- | :--- | :--- | :--- |
| **GGUF Transformer (Wan 2.1 1.3B Q4)** | 952,943,680 (952.94 M) | 937.19 MB | 0.9152 GB |
| **VAE Decoder (Wan 2.1)** | 126,892,531 (126.89 M) | 242.06 MB | 0.2364 GB |
| **UMT5 Text Encoder (4-bit)** | 3,868,971,008 (3868.97 M) | *HF Download cache* | *HF Download cache* |
| **Total Base Model (Combined)** | 4,948,807,219 (4.95 B) | 1179.25 MB | 1.1516 GB |
| **LoRA Adapter (`wan_lora.safetensors`)** | 87,490,860 (87.49 M) | 333.85 MB | 0.3260 GB |

---

## Table 2: Hardware Execution & Resource Profile (RTX 4050 6GB)
This table evaluates execution latency and peak physical VRAM usage across distinct processing stages.

| Processing Stage | Latency (s) (Mean ± SD) | Peak Allocated VRAM (GB) (Mean) | Peak Reserved VRAM (GB) (Mean) |
| :--- | :--- | :--- | :--- |
| **Stage 1: Gemini API Task Breakdown** | 1.498 ± 0.098 s | *Cloud Execution (0.000 GB)* | *Cloud Execution (0.000 GB)* |
| **Stage 2: Model & LoRA Loading** | 60.147 ± 2.237 s | 5.684 GB | 6.814 GB |
| **Stage 3: Diffusion Sampling Loop (20 steps)** | 57.226 ± 1.118 s | 1.516 GB | 4.930 GB |
| **Stage 4: VAE Decoding** | 4.829 ± 0.023 s | 2.035 GB | 4.938 GB |
| **End-to-End: Local Generation (Load + Generate)** | 122.559 ± 3.351 s | 5.684 GB | 6.814 GB |
| **End-to-End: Complete Pipeline (Cloud + Local)** | 124.057 ± 3.324 s | 5.684 GB | 6.814 GB |

*Note: Peak Allocated VRAM measures actual memory requested by active PyTorch tensors. Peak Reserved VRAM measures total GPU block allocation managed by PyTorch's caching allocator. Total Local Generation includes disk load times, sampling, VAE decode, and final MP4 file export.*
