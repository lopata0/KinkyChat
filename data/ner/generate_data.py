import requests

system_prompt = ""
with open("system_prompt_data.txt") as f:
    system_prompt = "\n".join(f.readlines())

headers = {
    'Content-Type': 'application/json',
}

import requests
import random
import json

texts = []
with open("out/texts.json") as f:
    texts = json.load(f)

import threading
import requests
from queue import Queue, Empty

# Thread-safe storage for results
results_lock = threading.Lock()

# Queue for thread communication
work_queue = Queue()
done_event = threading.Event()

results = []

def worker():
    while not done_event.is_set():
        try:
            # Get work from queue with timeout
            prompt = work_queue.get(timeout=0.1)

            headers = {
                'Content-Type': 'application/json',
            }

            json_data = {
                'model': 'qwen3-1.7b',
                'messages': [
                    {
                        'role': 'system',
                        'content': system_prompt,
                    },
                    {
                        'role': 'user',
                        'content': prompt,
                    },
                ],
                'temperature': 0.6,
                #'min_p': 0.1,
                'top_p': 0.95,
                'k': 20,
                'max_tokens': -1,
                'stream': False,
            }
            print(prompt)

            try:
                response = requests.post('http://localhost:1234/v1/chat/completions', headers=headers, json=json_data)
                
                output = response.json()["choices"][0]["message"]["content"]

                with results_lock:
                    global results2
                    output = output.split("</think>")[1]
                    output = output.split("```json")
                    output = output[1 if len(output) > 1 else 0]
                    output = output.split("```")[0]
                    d = json.loads(output)
                    print(d)
                    d["text"] = prompt
                    results.append(d)
            except Exception as e:
                print(f"Error {str(e)}: {prompt}")
                
            finally:
                work_queue.task_done()
                
        except Empty:
            continue

def main():
    for text in texts:
        work_queue.put(text)
    
    # Create and start worker threads
    threads = []
    for _ in range(2):  # 5 worker threads
        t = threading.Thread(target=worker)
        t.start()
        threads.append(t)
    
    # Wait for all work to complete
    work_queue.join()
    done_event.set()  # Tell workers to exit
    
    # Wait for threads to finish
    for t in threads:
        t.join()
    
    print(f"Completed {len(results)} requests")
    return results

main()

with open("out/data.json", "w") as f:
    json.dump(results, f)