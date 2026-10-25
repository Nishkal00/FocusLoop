import os
# Set HF_HOME in your environment to control where Hugging Face caches models

import sys
import torch
from transformers import UMT5EncoderModel, BitsAndBytesConfig

def main():
    print("Testing UMT5EncoderModel loading with correct dtype and low CPU memory usage...")
    
    quantization_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True
    )
    
    try:
        print("Loading 4-bit UMT5 text encoder (specifying torch_dtype=torch.bfloat16 and low_cpu_mem_usage=True)...")
        model = UMT5EncoderModel.from_pretrained(
            "Wan-AI/Wan2.1-T2V-1.3B-Diffusers",
            subfolder="text_encoder",
            quantization_config=quantization_config,
            device_map="auto",
            torch_dtype=torch.bfloat16,
            low_cpu_mem_usage=True,
            offload_folder=".offload",
            offload_state_dict=True
        )
        print("Success! UMT5EncoderModel loaded successfully.")
        print("Parameters device:", next(model.parameters()).device)
        print("Parameters dtype:", next(model.parameters()).dtype)
        
    except Exception as e:
        print(f"Failed to load: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
