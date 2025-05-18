# Kinky Chat
Kinky Dungeon mod for chatting with game NPCs

This mod tries to integrate LLM for chat purposes with game NPCs.
Mod uses local quantized llm (Hermes-3-Llama-3.2-3B-q4f16_1-MLC) which downloads and runs in browser automatically when mod is loaded.

## Building mod:
node and npm are required
```
npm install
npm run prepare
npm run build
```
(note: "npm install" and "npm run prepare" are just first time only)

After building there should be KinkyChat.zip inside dist directory. Please open issue if you get errors.

## Mod features:
- **Chat dialog option**: On generic NPC ally dialog menu you have "Chat..." option which allows to you chat with NPC. When chat is loaded, input box will appear where you can type and button to say things to NPC,
- **NPC chat context awareness**: LLM will be aware of basic information about you (your name, restraints you are currently wearing, submissiveness, security level, is in prison, ...), map and itself (its name, faction, personality, aggressiveness, restraints, ...),
- **Chat memorization**: After having conversation with NPC it will remember interactions in next conversations (LLM summarizes previous convo so you may have to wait a bit before chat loading),
- **Response streaming**: NPC response will be shown to you during generation in real time,
- **Chat saving**: All chats will be unique to each NPC and will be saved on game exit,
- No gameplay is affected, chat during the game is optional and just for entertainment purposes right now

## Requirements:
Browser that supports webgpu (check https://github.com/gpuweb/gpuweb/wiki/Implementation-Status, if game is still frozen after model is downloaded theres high chance your browser doesn't support webgpu, also check console in browser),
Minimum 4 GB of VRAM on dedicated GPU (mod was not tested on iGPU so I can't guarantee it will work on it),

For CPU there is API option inside mod.
Mod was built and tested on Google Chrome and RTX 3090.



### Note: At first time loading mod it will start downloading libraries like LLM model from huggingface.co, LLM library from github and progress will hopefully be displayed at top of the game screen. It takes around 2 GB of space.

### WARNING: This mod is highly experimental and not tested properly, mod may bug and LLM generations may break, hallucinate or give incorrect answers. If you see any bug, have a suggestion or feedback, feel free to report it or say here.
