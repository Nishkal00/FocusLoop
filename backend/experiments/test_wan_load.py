import os
import sys
import torch
from safetensors import safe_open
from transformers import UMT5Config, UMT5EncoderModel, AutoTokenizer

def load_fp8_text_encoder(safetensors_path, config_name_or_path, torch_dtype=torch.bfloat16):
    print(f"Loading config from {config_name_or_path}...")
    config = UMT5Config.from_pretrained(config_name_or_path, subfolder="text_encoder")
    
    print("Instantiating UMT5EncoderModel on CPU (empty weights)...")
    # To save memory, we can initialize the model structure first
    # and then load weights directly.
    # Since we might not have 'accelerate' installed or it might be easier,
    # let's just create the model. An 11B model config will allocate empty tensors.
    # We can use PyTorch's 'meta' device if we want to be extremely fast,
    # but we eventually need to put the weights on CPU/GPU.
    # Let's try instantiating it directly. If we run out of memory, we can use meta device.
    model = UMT5EncoderModel(config)
    
    print(f"Loading weights from {safetensors_path}...")
    state_dict = {}
    with safe_open(safetensors_path, framework="pt", device="cpu") as f:
        for key in f.keys():
            # Skip metadata keys like spiece_model or scaled_fp8
            if key in ['scaled_fp8', 'spiece_model']:
                continue
                
            tensor = f.get_tensor(key)
            
            # If it's a weight scale, we'll process it when we see the weight itself
            if key.endswith('.scale_weight'):
                continue
                
            # If there's a corresponding scale weight, multiply them to unquantize
            scale_key = key + '.scale_weight'
            if scale_key in f.keys():
                scale = f.get_tensor(scale_key)
                # Unquantize FP8 weight by multiplying with scale, and cast to desired dtype
                unquantized_tensor = tensor.to(torch.float32) * scale.to(torch.float32)
                state_dict[key] = unquantized_tensor.to(torch_dtype)
            else:
                state_dict[key] = tensor.to(torch_dtype)
                
    print("Loading state dict into model...")
    # Check if keys have 'encoder.' prefix but the model expects it or not.
    # In transformers, UMT5EncoderModel's parameters start with 'encoder.'
    # (e.g. 'encoder.block.0...') or 'shared.weight'.
    # Let's check if the keys match the model's state dict.
    model_keys = set(model.state_dict().keys())
    sd_keys = set(state_dict.keys())
    
    missing = model_keys - sd_keys
    unexpected = sd_keys - model_keys
    print(f"Missing keys: {len(missing)}, Unexpected keys: {len(unexpected)}")
    
    model.load_state_dict(state_dict, strict=False)
    print("Model loaded successfully!")
    return model

def main():
    safetensors_path = os.getenv("UMT5_FP8_PATH", os.path.join(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."), "downloads", "umt5_xxl_fp8_e4m3fn_scaled.safetensors"))
    config_path = "Wan-AI/Wan2.1-T2V-1.3B-Diffusers"
    
    try:
        model = load_fp8_text_encoder(safetensors_path, config_path)
        print("Success! Model loaded and ready.")
    except Exception as e:
        print(f"Failed to load: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
