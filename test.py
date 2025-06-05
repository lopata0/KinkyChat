import requests
import re

from data.data import generate_random_system_prompt

system_prompt = generate_random_system_prompt()

headers = {
    'Content-Type': 'application/json',
}

prompt = system_prompt + "\nHere is conversation between me and Lopata in turn-taking format with 6 messages and nothing else:\nLopata:"

json_data = {
    'model': 'mistral',
    'prompt': prompt,
    'temperature': 1.25,
    'min_p': 0.2,
    'max_tokens': 3000,
    'stop': '</s>',
    'stream': False,
}


response = requests.post('http://localhost:1234/v1/completions', headers=headers, json=json_data)

res = "Lopata:" + response.json()["choices"][0]["text"]

users = re.findall(r'(^.*):\s[\s\S]*?(?=\n.*:|\Z)', res, re.MULTILINE)
messages = re.findall(r'^.*:\s([\s\S]*?)(?=\n.*:|\Z)', res, re.MULTILINE)

if len(users) != len(messages):
    print("error: user and message count dont match")
    
if len(users) % 2 == 1:
    users.pop(-1)
    messages.pop(-1)
    
previous_user = None
for user in users:
    if previous_user != None and previous_user == user:
        print("error: same user twice")
        break
    previous_user = user

distinct_users = []
for user in users:
    if user not in distinct_users:
        distinct_users.append(user)
        if len(distinct_users) > 2:
            print("error: more than 2 users")
            break

convo = [
    {'role': "system", 'content': system_prompt}
]
turn = "user"
for message in messages:
    convo.append({'role': turn, 'content': message})
    turn = "assistant" if turn == "user" else "user"

print(convo)