import requests
import json
from pathlib import Path
import re

import threading
import requests
from queue import Queue, Empty
import random

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
            system_prompt = work_queue.get(timeout=0.1)

            headers = {
                'Content-Type': 'application/json',
            }
            message_num = random.randint(1, 4) * 2
            
            prompt = system_prompt + f"\nHere is conversation between me and Lopata in turn-taking format with {message_num} messages and nothing else:\nLopata:"

            json_data = {
                'model': 'mistral',
                'prompt': prompt,
                'temperature': 1.25,
                'min_p': 0.2,
                'max_tokens': 1000,
                'stop': '</s>',
                'stream': False,
            }

            try:
                response = requests.post('http://localhost:1234/v1/completions', headers=headers, json=json_data)
                
                res = "Lopata:" + response.json()["choices"][0]["text"]

                users = re.findall(r'(^.*):\s[\s\S]*?(?=\n.*:|\Z)', res, re.MULTILINE)
                messages = re.findall(r'^.*:\s([\s\S]*?)(?=\n.*:|\Z)', res, re.MULTILINE)

                if len(users) != len(messages):
                    raise Exception("user and message count dont match")
                    
                if len(users) % 2 == 1:
                    users.pop(-1)
                    messages.pop(-1)
                    
                previous_user = None
                for user in users:
                    if previous_user != None and previous_user == user:
                        raise Exception("same user twice")
                    previous_user = user

                distinct_users = []
                for user in users:
                    if user not in distinct_users:
                        distinct_users.append(user)
                        if len(distinct_users) > 2:
                            raise Exception("more than 2 users")
                convo = [
                    {'role': "system", 'content': system_prompt}
                ]
                turn = "user"
                is_casual = random.randint(1, 5) != 1
                for message in messages:
                    if turn == "user" and is_casual:
                        message = message.lower().replace("'", "")
                    message = message.replace("\n", "")
                    convo.append({'role': turn, 'content': message})
                    turn = "assistant" if turn == "user" else "user"

                print(convo)

                with results_lock:
                    global texts
                    texts.append(convo)
            except Exception as e:
                    print(f"Error processing: {str(e)}")
                    print(response.json())
                
            finally:
                work_queue.task_done()
                
        except Empty:
            continue

from ..data import generate_random_system_prompt

def main():
    for _ in range(1000):
        work_queue.put(generate_random_system_prompt())
    
    threads = []
    for _ in range(1):
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

with open(Path(__file__).parent / "out/convos.json", "w") as f:
    json.dump(texts, f)