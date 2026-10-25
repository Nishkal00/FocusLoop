import os
import torch
from safetensors.torch import load_file

def inspect_lora_adapter():
    lora_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "weights", "wan_lora.safetensors"))
    print(f"Inspecting LoRA adapter at: {lora_path}")
    
    if not os.path.exists(lora_path):
        print(f"Error: LoRA file not found at {lora_path}")
        return
        
    # 1. File size on disk
    file_size_bytes = os.path.getsize(lora_path)
    file_size_mb = file_size_bytes / (1024 * 1024)
    file_size_gb = file_size_bytes / (1024 * 1024 * 1024)
    
    # 2. Load tensors
    tensors = load_file(lora_path)
    num_tensors = len(tensors)
    
    # Calculate parameter count and analyze dtypes
    total_params = 0
    dtypes_summary = {}
    
    for name, tensor in tensors.items():
        # Parameter count for this tensor
        num_elements = tensor.numel()
        total_params += num_elements
        
        # Dtype analysis
        dtype_str = str(tensor.dtype)
        dtypes_summary[dtype_str] = dtypes_summary.get(dtype_str, 0) + 1
        
    total_params_m = total_params / 1_000_000
    
    print("\n--- LoRA ADAPTER INSPECTION RESULTS ---")
    print(f"File Size: {file_size_mb:.2f} MB ({file_size_gb:.4f} GB)")
    print(f"Number of Stored Tensors: {num_tensors}")
    print(f"Total Parameter Count: {total_params:,} ({total_params_m:.2f} Million parameters)")
    print("Tensor Data Types Summary:")
    for dtype, count in dtypes_summary.items():
        print(f"  - {dtype}: {count} tensors")
    print("---------------------------------------\n")
    
    # Write to a log file
    log_path = os.path.join(os.path.dirname(__file__), "lora_inspection.log")
    with open(log_path, "w", encoding="utf-8") as f:
        f.write("--- LoRA ADAPTER INSPECTION RESULTS ---\n")
        f.write(f"File Size: {file_size_mb:.2f} MB ({file_size_gb:.4f} GB)\n")
        f.write(f"Number of Stored Tensors: {num_tensors}\n")
        f.write(f"Total Parameter Count: {total_params:,} ({total_params_m:.2f} Million parameters)\n")
        f.write("Tensor Data Types Summary:\n")
        for dtype, count in dtypes_summary.items():
            f.write(f"  - {dtype}: {count} tensors\n")
        f.write("---------------------------------------\n")
    print(f"Saved inspection log to {log_path}")

if __name__ == "__main__":
    inspect_lora_adapter()
