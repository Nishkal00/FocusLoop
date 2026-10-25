import os
# Set HF_HOME in your environment to control where Hugging Face caches models

import sys
import torch
from diffusers import WanPipeline, WanTransformer3DModel, AutoencoderKLWan, GGUFQuantizationConfig
from transformers import UMT5EncoderModel, BitsAndBytesConfig

def test_load():
    gguf_path = os.getenv("GGUF_PATH", os.path.join(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."), "downloads", "Wan2.1-T2V-1.3B-Q4_K_M.gguf"))
    vae_path = os.getenv("VAE_PATH", os.path.join(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."), "downloads", "wan_2.1_vae.safetensors"))
    
    print("Loading local GGUF transformer...")
    transformer = WanTransformer3DModel.from_single_file(
        gguf_path,
        config="Wan-AI/Wan2.1-T2V-1.3B-Diffusers",
        subfolder="transformer",
        quantization_config=GGUFQuantizationConfig(compute_dtype=torch.bfloat16),
        torch_dtype=torch.bfloat16,
    )
    
    print("Loading local VAE...")
    vae = AutoencoderKLWan.from_single_file(
        vae_path,
        torch_dtype=torch.float32
    )
    
    print("Loading 4-bit UMT5 text encoder...")
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
        device_map="auto"
    )
    
    print("Initializing WanPipeline...")
    wan_pipeline = WanPipeline.from_pretrained(
        "Wan-AI/Wan2.1-T2V-1.3B-Diffusers",
        transformer=transformer,
        vae=vae,
        text_encoder=text_encoder,
        torch_dtype=torch.bfloat16
    )
    
    print("Enabling model CPU offload...")
    wan_pipeline.enable_model_cpu_offload()
    
    print("Success! WanPipeline loaded successfully.")

if __name__ == "__main__":
    test_load()
