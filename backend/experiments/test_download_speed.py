import os
import sys
import time
import requests

def test_download():
    url = "https://huggingface.co/Wan-AI/Wan2.1-T2V-1.3B-Diffusers/resolve/main/text_encoder/model-00001-of-00005.safetensors"
    print(f"Testing download speed from: {url}")
    
    start_time = time.time()
    downloaded = 0
    
    try:
        # We will download the first 50 MB to test speed
        headers = {"Range": "bytes=0-52428800"} # 50 MB
        r = requests.get(url, headers=headers, stream=True, timeout=15)
        
        if r.status_code not in [200, 206]:
            print(f"Failed with status code: {r.status_code}", file=sys.stderr)
            print(r.text, file=sys.stderr)
            return
            
        chunk_size = 1024 * 1024 # 1 MB
        for chunk in r.iter_content(chunk_size=chunk_size):
            if chunk:
                downloaded += len(chunk)
                elapsed = time.time() - start_time
                speed = (downloaded / 1024 / 1024) / elapsed if elapsed > 0 else 0
                print(f"Downloaded: {downloaded / 1024 / 1024:.2f} MB | Time: {elapsed:.2f}s | Speed: {speed:.2f} MB/s")
                
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

if __name__ == "__main__":
    test_download()
