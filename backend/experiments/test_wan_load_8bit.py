import os
import sys
import torch
from transformers import UMT5EncoderModel, BitsAndBytesConfig

def main():
    print("Testing loading UMT5EncoderModel in 8-bit using bitsandbytes...")
    
    # Configure 8-bit quantization
    quantization_config = BitsAndBytesConfig(
        load_in_8bit=True
    )
    
    try:
        # Load the model. Since it's not fully in the cache, this will resume/start downloading the shards.
        # It will load and quantize them layer-by-layer.
        print("Starting UMT5EncoderModel loading...")
        model = UMT5EncoderModel.from_pretrained(
            "Wan-AI/Wan2.1-T2V-1.3B-Diffusers",
            subfolder="text_encoder",
            quantization_config=quantization_config,
            device_map="auto"
        )
        print("Success! UMT5EncoderModel loaded successfully in 8-bit.")
        print("Model device map:", model.hf_device_map)
        
    except Exception as e:
        print(f"Failed to load: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
