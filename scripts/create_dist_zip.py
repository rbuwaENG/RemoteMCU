import zipfile
import os
from pathlib import Path

def create_agent_zip(source_dir, output_zip):
    print(f"Creating {output_zip} from {source_dir}...")
    
    # Files/Dirs to exclude
    exclude = {'.env', '__pycache__', '.pytest_cache', '.git'}
    
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in exclude]
            
            for file in files:
                if file in exclude:
                    continue
                
                file_path = Path(root) / file
                # The path inside the zip should be relative to the source_dir
                archive_name = file_path.relative_to(source_dir)
                zipf.write(file_path, archive_name)
    
    print(f"Successfully created {output_zip}")

if __name__ == "__main__":
    base_path = Path(r"d:\Practice_projects\RemoteMCU")
    source = base_path / "host-agent"
    dist = base_path / "dist"
    
    dist.mkdir(exist_ok=True)
    create_agent_zip(source, dist / "remotemcu-agent.zip")
