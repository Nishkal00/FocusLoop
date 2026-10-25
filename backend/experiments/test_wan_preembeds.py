import os
import sys
import torch
import gc

# Set HF_HOME in your environment to control where Hugging Face caches models

from diffusers import WanPipeline, WanTransformer3DModel, AutoencoderKLWan, GGUFQuantizationConfig
from diffusers.utils import export_to_video
from transformers import AutoTokenizer, UMT5EncoderModel, BitsAndBytesConfig

def test_preembeds():
    gguf_path = os.getenv("GGUF_PATH", os.path.join(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."), "downloads", "Wan2.1-T2V-1.3B-Q4_K_M.gguf"))
    vae_path = os.getenv("VAE_PATH", os.path.join(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."), "downloads", "wan_2.1_vae.safetensors"))
    prompt = "Close up shot of a hand pouring water into a glass, clean background, slow motion"
    
    # 1. Load tokenizer and 4-bit text encoder on GPU 0
    print("Loading 4-bit UMT5 text encoder on GPU...")
    tokenizer = AutoTokenizer.from_pretrained(
        "Wan-AI/Wan2.1-T2V-1.3B-Diffusers",
        subfolder="tokenizer"
    )
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
        device_map={"": 0}  # Force entire model to GPU (prevents CPU offload error!)
    )
    
    # 2. Encode prompt
    print(f"Encoding prompt: '{prompt}'")
    text_inputs = tokenizer(
        [prompt],
        padding="max_length",
        max_length=226,
        truncation=True,
        add_special_tokens=True,
        return_attention_mask=True,
        return_tensors="pt"
    )
    text_input_ids = text_inputs.input_ids.to(0)
    mask = text_inputs.attention_mask.to(0)
    
    with torch.no_grad():
        prompt_embeds = text_encoder(text_input_ids, mask).last_hidden_state
        
    seq_lens = mask.gt(0).sum(dim=1).long()
    prompt_embeds = [u[:v] for u, v in zip(prompt_embeds, seq_lens)]
    prompt_embeds = torch.stack(
        [torch.cat([u, u.new_zeros(226 - u.size(0), u.size(1))]) for u in prompt_embeds], dim=0
    )
    prompt_embeds = prompt_embeds.to(dtype=torch.bfloat16, device=0)
    
    # 3. Encode negative prompt
    print("Encoding negative prompt...")
    neg_inputs = tokenizer(
        [""],
        padding="max_length",
        max_length=226,
        truncation=True,
        add_special_tokens=True,
        return_attention_mask=True,
        return_tensors="pt"
    )
    neg_input_ids = neg_inputs.input_ids.to(0)
    neg_mask = neg_inputs.attention_mask.to(0)
    
    with torch.no_grad():
        negative_prompt_embeds = text_encoder(neg_input_ids, neg_mask).last_hidden_state
        
    neg_seq_lens = neg_mask.gt(0).sum(dim=1).long()
    negative_prompt_embeds = [u[:v] for u, v in zip(negative_prompt_embeds, neg_seq_lens)]
    negative_prompt_embeds = torch.stack(
        [torch.cat([u, u.new_zeros(226 - u.size(0), u.size(1))]) for u in negative_prompt_embeds], dim=0
    )
    negative_prompt_embeds = negative_prompt_embeds.to(dtype=torch.bfloat16, device=0)
    
    # 4. Free text encoder and tokenizer
    print("Freeing text encoder and clearing GPU memory...")
    del text_encoder
    del tokenizer
    gc.collect()
    torch.cuda.empty_cache()
    
    # 5. Load GGUF transformer and VAE
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
    
    # 6. Initialize pipeline without text encoder
    print("Initializing WanPipeline (without text encoder)...")
    wan_pipeline = WanPipeline.from_pretrained(
        "Wan-AI/Wan2.1-T2V-1.3B-Diffusers",
        transformer=transformer,
        vae=vae,
        text_encoder=None,
        tokenizer=None,
        torch_dtype=torch.bfloat16
    )
    
    print("Enabling model CPU offload...")
    wan_pipeline.enable_model_cpu_offload()
    
    # 7. Generate video using pre-computed embeds
    print("Generating video using pre-computed embeds...")
    video_frames = wan_pipeline(
        prompt_embeds=prompt_embeds,
        negative_prompt_embeds=negative_prompt_embeds,
        aspect_ratio="16:9",
        num_frames=81,
        generator=torch.manual_seed(42)
    ).frames[0]
    
    output_path = "test_output.mp4"
    print(f"Exporting video to {output_path}...")
    export_to_video(video_frames, output_path, fps=16)
    print("Success! Video generated and exported successfully.")

if __name__ == "__main__":
    test_preembeds()
