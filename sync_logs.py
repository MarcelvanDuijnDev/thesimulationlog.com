import json
import os

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    manifest_path = os.path.join(root_dir, 'logs', 'manifest.json')
    
    if not os.path.exists(manifest_path):
        print(f"Error: manifest.json not found at {manifest_path}")
        return
        
    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
    except Exception as e:
        print(f"Error parsing manifest.json: {e}")
        return
        
    all_logs = []
    
    # Gather files from years_available
    files_to_load = []
    for item in manifest.get('years_available', []):
        files_to_load.append(item.get('file'))
        
    # Gather files from eras
    for item in manifest.get('eras', []):
        files_to_load.append(item.get('file'))
        
    print("Beginning simulation logs synchronization...")
    print("---------------------------------------------")
    
    for relative_path in files_to_load:
        if not relative_path:
            continue
            
        full_path = os.path.join(root_dir, 'logs', relative_path)
        if not os.path.exists(full_path):
            print(f"Warning: Log file not found: {full_path}")
            continue
            
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                logs = json.load(f)
                
            if isinstance(logs, list):
                all_logs.extend(logs)
                print(f"Loaded {len(logs):>3} records from logs/{relative_path}")
            else:
                print(f"Warning: {relative_path} does not contain a JSON array (list)")
        except Exception as e:
            print(f"Error reading {relative_path}: {e}")
            
    output_path = os.path.join(root_dir, 'logs.json')
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(all_logs, f, indent=2, ensure_ascii=False)
        print("---------------------------------------------")
        print(f"Sync complete. Successfully wrote {len(all_logs)} logs to: {output_path}")
    except Exception as e:
        print(f"Error writing to logs.json: {e}")

if __name__ == '__main__':
    main()
