import os
import sys
from huggingface_hub import snapshot_download

def main():
    repo_id = "Wan-AI/Wan2.1-T2V-1.3B-Diffusers"
    print(f"Starting download of {repo_id} (excluding transformer and VAE weights)...")
    
    try:
        local_dir = snapshot_download(
            repo_id=repo_id,
            ignore_patterns=["transformer/*", "vae/*"],
            resume_download=True,
            max_workers=4
        )
        print(f"Successfully downloaded/verified repository at: {local_dir}")
    except Exception as e:
        print(f"Error during download: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
