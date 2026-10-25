import os
import sys
import torch
from transformers import UMT5EncoderModel, BitsAndBytesConfig

def main():
    print("Testing loading UMT5EncoderModel in 4-bit using bitsandbytes...")
    
    # Configure 4-bit quantization for maximum efficiency
    quantization_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True
    )
    
    try:
        print("Starting UMT5EncoderModel loading in 4-bit...")
        model = UMT5EncoderModel.from_pretrained(
            "Wan-AI/Wan2.1-T2V-1.3B-Diffusers",
            subfolder="text_encoder",
            quantization_config=quantization_config,
            device_map="auto"
        )
        print("Success! UMT5EncoderModel loaded successfully in 4-bit.")
        print("Model device map:", model.hf_device_map)
        
    except Exception as e:
        print(f"Failed to load: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
