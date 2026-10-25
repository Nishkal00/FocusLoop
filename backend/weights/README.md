# LoRA weights

The fine-tuned adapter `wan_lora.safetensors` (~334 MB) is too large for a normal
git repo, so it is hosted separately:

**Download:** [wan_lora.safetensors (v1.0 release)](https://github.com/Nishkal00/FocusLoop/releases/download/v1.0/wan_lora.safetensors)

Put the file in this folder as `backend/weights/wan_lora.safetensors`.
If it is missing, the backend just runs the base Wan 2.1 model.

| | |
|---|---|
| Base model | Wan 2.1 T2V-1.3B |
| Method | LoRA (`networks.lora_wan`), 300 modules in attention blocks |
| Rank / alpha | 64 / 64 |
| Trainable parameters | ~87.5 M |
| Training data | 455 captioned daily-living clips, 512x288, 17 frames |
| Training | 10 epochs (4,550 steps), lr 2e-4, batch 1, AdamW8bit, BF16 + FP8 base |
| Hardware | 1x RTX 4500 Ada (24 GB) |
| Inference scale | 0.9 |
