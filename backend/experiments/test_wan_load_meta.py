import os
import sys
import torch
import psutil
from safetensors import safe_open
from transformers import UMT5Config, UMT5EncoderModel
from accelerate import init_empty_weights
from accelerate.utils import set_module_tensor_to_device

def log_message(msg):
    print(msg)
    with open("load_debug.log", "a", encoding="utf-8") as f:
        f.write(msg + "\n")
        f.flush()

def print_memory():
    process = psutil.Process(os.getpid())
    mem = process.memory_info().rss / 1024 / 1024
    log_message(f"[MEM] Current Memory Usage: {mem:.2f} MB")

def load_fp8_text_encoder_meta(safetensors_path, config_name_or_path, torch_dtype=torch.bfloat16, device="cpu"):
    if os.path.exists("load_debug.log"):
        os.remove("load_debug.log")
        
    log_message(f"Loading config from {config_name_or_path}...")
    config = UMT5Config.from_pretrained(config_name_or_path, subfolder="text_encoder")
    
    log_message("Instantiating UMT5EncoderModel on meta device...")
    with init_empty_weights():
        model = UMT5EncoderModel(config)
        
    print_memory()
    
    log_message(f"Loading weights from {safetensors_path}...")
    count = 0
    with safe_open(safetensors_path, framework="pt", device="cpu") as f:
        for key in sorted(f.keys()):
            if key in ['scaled_fp8', 'spiece_model']:
                continue
            if key.endswith('.scale_weight'):
                continue
                
            count += 1
            if count % 10 == 0:
                log_message(f"Loading key #{count}: {key}")
                print_memory()
                
            try:
                tensor = f.get_tensor(key)
                
                scale_key = key + '.scale_weight'
                if scale_key in f.keys():
                    scale = f.get_tensor(scale_key)
                    unquantized_tensor = tensor.to(torch.float32) * scale.to(torch.float32)
                    tensor_to_load = unquantized_tensor.to(torch_dtype)
                else:
                    tensor_to_load = tensor.to(torch_dtype)
                    
                set_module_tensor_to_device(model, key, device=device, value=tensor_to_load)
            except Exception as e:
                log_message(f"Error loading key '{key}': {e}")
                raise e
                
    log_message("Model loaded successfully!")
    return model

def main():
    safetensors_path = os.getenv("UMT5_FP8_PATH", os.path.join(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."), "downloads", "umt5_xxl_fp8_e4m3fn_scaled.safetensors"))
    config_path = "Wan-AI/Wan2.1-T2V-1.3B-Diffusers"
    
    try:
        model = load_fp8_text_encoder_meta(safetensors_path, config_path, device="cpu")
        log_message("Success! Model loaded and ready.")
    except Exception as e:
        log_message(f"Failed with exception: {e}")
        import traceback
        with open("load_debug.log", "a", encoding="utf-8") as f:
            traceback.print_exc(file=f)

if __name__ == "__main__":
    main()
