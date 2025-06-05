import requests
import random
import json

#personalities = ["Dominant", "Submissive"]


import threading
import requests
from queue import Queue, Empty

# Thread-safe storage for results
results_lock = threading.Lock()

# Queue for thread communication
work_queue = Queue()
done_event = threading.Event()

texts = []

def worker():
    while not done_event.is_set():
        try:
            # Get work from queue with timeout
            [system_prompt, prompt] = work_queue.get(timeout=0.1)

            headers = {
                'Content-Type': 'application/json',
            }

            json_data = {
                'model': 'impish_llama_3b_gguf',
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
                'temperature': 1,
                'min_p': 0.1,
                'max_tokens': -1,
                'stream': False,
            }

            print(system_prompt)
            print(prompt)

            try:
                response = requests.post('http://localhost:1234/v1/chat/completions', headers=headers, json=json_data)

                with results_lock:
                    global texts
                    texts.append(response.json()["choices"][0]["message"]["content"])
            except Exception as e:
                    print(f"Error processing: {str(e)}")
                    print(response.json())
                
            finally:
                work_queue.task_done()
                
        except Empty:
            continue

from ..data import generate_random_system_prompt

prompts = ["remove my restraints", "hi please remove restriants", "add restraint to me", "give me some restraint", "can you give me restraint?", "can you please remove some of my restraints?"]

def main():
    for _ in range(100):    
        system_prompt = generate_random_system_prompt()
    
        prompt = random.choice(prompts)
        work_queue.put({system_prompt, prompt})
    
    threads = []
    for _ in range(10):
        t = threading.Thread(target=worker)
        t.start()
        threads.append(t)
    
    work_queue.join()
    done_event.set()
    
    for t in threads:
        t.join()
    
    print(f"Completed {len(texts)} requests")
    return texts

main()

with open("out/texts.json", "w") as f:
    json.dump(texts, f)