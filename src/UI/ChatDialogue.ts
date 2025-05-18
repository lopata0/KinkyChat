import { Chat } from "@mod/Chat/Chat";
import { ChatManager } from "@mod/Chat/ChatManager";
import { ModUi } from "@mod/UI/ModUi";

export class ChatDialogue {

    static chatManager?: ChatManager;

    static init(chatManager: ChatManager) {
        this.chatManager = chatManager;

        const dialogue = KDDialogue["GenericAlly"];

        if (!dialogue.options) throw Error("generic dialogue options not found");

        dialogue.options.Chat = {
            playertext: "Default",
            response: "Default",
            clickFunction: (_gagged, _player) => {
                (async () => {
                    await this.chatOption(_gagged, _player);
                })();

                return false;
            },
            options: {
                "Say": {
                    playertext: "Default",
                    response: "Default",
                    clickFunction: (_gagged, _player) => {
                (async () => {
                    await this.sayOption(_gagged, _player);
                })();

                return false;
            },
                },
                "Leave": {
                    playertext: "Leave", response: "Default",
                    clickFunction: (_gagged, _player) => {
                        KinkyDungeonKeybindingCurrentKey = "";
                        KinkyDungeonKeybindingCurrentKeyRelease = "";
                        ModUi.inputRequired = false;
                        ModUi.chatEnabled = false;
                        addTextKey("rGenericAllyChat", "...")
                        return false;
                    },
                    exitDialogue: true,
                }
            }
        };

        KDDialogue["GenericAlly"] = dialogue;
    }

    static formatResponse(response: string): string {
        const unnecessaryNewLinesRegex = new RegExp(`(\\n+)\\n`, 'g');
        response = response.replace(unnecessaryNewLinesRegex, `\n`);

        let r = "";
        let spacesCount = 0;
        const newLinePerSpaces = 8;

        for (let i = 0; i < response.length; i++) {
            let l = response[i];
            if (l == ' ') spacesCount++;
            if (l == '\n' || l == '|') spacesCount = 0;
            if (spacesCount == newLinePerSpaces) {
                r += '|';
                spacesCount = 0;
                continue;
            }

            r += response[i];
        }
        return r;
    }

    static generateGaggedTalk(input: string) {
        const gaggedTalk = ["mmph", "mmmmmph", "hrmm", "hrmmmm", "mmmmph", "gmmmmrph", "gmmrph", "shmmmmm", "ggkkkhh", "ggmmpphh", "mmggghh"];
        let endOfSentence = input.slice(-1);
        let randomGagTalk = gaggedTalk[Math.floor(Math.random() * gaggedTalk.length)];
        let gaggedText = randomGagTalk;
        while (gaggedText.length < input.length) {
            gaggedText += "... "
            randomGagTalk = gaggedTalk[Math.floor(Math.random() * gaggedTalk.length)];
            gaggedText += randomGagTalk;
        }
        if (endOfSentence != "!" && endOfSentence != "?") endOfSentence = "...";
        gaggedText += endOfSentence
        if (!ModUi.chatInput) throw new Error("chatInput is undefined");
        ModUi.chatInput.Element.disabled = true;
        ElementValue("ChatInput", gaggedText);

        return gaggedText;
    }

    static async sayOption(_gagged: boolean, _player: Object) {
        if (!ModUi.chatInput) throw new Error("chatInput is undefined");
        if (!this.chatManager) throw new Error("chatManager is undefined");
        let message = ModUi.typedText;
        console.log(ModUi.chatInput);
        if (_gagged) {
            message = this.generateGaggedTalk(message);
            await new Promise(r => setTimeout(r, 2000));
        }
        ModUi.inputRequired = false;
        ModUi.chatInput.Element.disabled = false;
        const reply = await this.chatManager.sendMessage({
            message: message, streamCallback: (response: string) => {
                addTextKey("rGenericAllyChat_Say", this.formatResponse(response));
            }
        });

        addTextKey("rGenericAllyChat", this.formatResponse(reply));

        KDGameData.CurrentDialogMsg = "GenericAllyChat";
        KDGameData.CurrentDialogStage = "Chat";

        ModUi.inputRequired = true;
        ModUi.chatEnabled = true;

        console.log(this.chatManager.currentChat);
    }

    static async chatOption(_gagged: boolean, _player: Object) {
        if (!KDDialogueEnemy() || !this.chatManager) return;
        let enemy = KDDialogueEnemy();
        console.log(enemy);
        addTextKey("rGenericAllyChat_Say", "Thinking...");
        KDGameData.CurrentDialogMsg = "GenericAllyChat_Say";
        KDGameData.CurrentDialogStage = "Chat_Say";

        const enemyId = enemy.id;
        if(!enemyId) return;
        const chat = ChatManager.chats[enemyId];
        let memories = "";
        if (chat) {
            this.chatManager.currentChat = chat;
            let memories = await this.chatManager.createMemoriesFromCurrentChat();
            console.log(memories);
        }
        this.chatManager.currentChat = new Chat(enemy, memories);
        ChatManager.chats[enemyId] = this.chatManager.currentChat;

        KDGameData.CurrentDialogMsg = "GenericAllyChat";
        KDGameData.CurrentDialogStage = "Chat";

        addTextKey("rGenericAllyChat", "...");

        ModUi.inputRequired = true;
        ModUi.chatEnabled = true;
    }
}