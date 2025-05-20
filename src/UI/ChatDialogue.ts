import { Chat } from "@mod/Chat/Chat";
import { ChatManager } from "@mod/Chat/ChatManager";
import { SentimentClassification } from "@mod/Models/Sentiment";
import { ModUi } from "@mod/UI/ModUi";
import { clamp } from "@mod/math/math";

export class ChatDialogue {

    static chatManager?: ChatManager;
    static sentimentClassification?: SentimentClassification;

    static init(chatManager: ChatManager, sentimentClassification: SentimentClassification) {
        this.chatManager = chatManager;
        this.sentimentClassification = sentimentClassification;

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
        //const unnecessaryNewLinesRegex = new RegExp(`(\\n+)\\n`, 'g');
        //response = response.replace(unne"cessaryNewLinesRegex, `\n`);
        response = response.replace(/(?:\r\n|\r|\n)/g, ' ');
        

        let r = "";
        let spacesCount = 0;
        const newLinePerSpaces = 10;

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

    static convertSentimentToRep(currentOpinion: number, factionOpinion: number | undefined, label: string, score: number): number {
        let sentimentScore = 0;

        switch (label) {
            case "Very Negative":
                sentimentScore = 1;
                break;
            case "Negative":
                sentimentScore = 25;
                break;
            case "Neutral":
                sentimentScore = 50;
                break;
            case "Positive":
                sentimentScore = 75;
                break;
            case "Very Positive":
                sentimentScore = 99;
                break;
        }

        console.log("sentiment score", sentimentScore);

        if (factionOpinion != undefined) {
            factionOpinion = (factionOpinion - 50) / 100;
            sentimentScore = 0.7 * sentimentScore + 0.3 * factionOpinion;
            console.log("sentiment faction apply", sentimentScore);
        }


        const alpha = 0.1;
        currentOpinion = alpha * sentimentScore + (1 - alpha) * currentOpinion;

        return clamp(currentOpinion);
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
        if (!this.chatManager.currentChat) throw new Error("currentChat is undefined");

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

        const sentiment = await this.sentimentClassification?.model(reply);
        let enemy = KDDialogueEnemy();
        let factionRelation = undefined;
        if (enemy && enemy.faction) {
            factionRelation = ((KinkyDungeonFactionRelations as any)["Player"][enemy.faction] as number);
            factionRelation = (factionRelation / 2 + 0.5) * 100;
        }
        console.log("faction relation", factionRelation)
        console.log("opinion", this.chatManager.currentChat.opinion);
        console.log("sentiment", sentiment[0].label);
        const opinion = this.convertSentimentToRep(this.chatManager.currentChat.opinion, factionRelation, sentiment[0].label, sentiment[0].score);

        if (enemy && enemy.faction && factionRelation != null) {
            const delta = opinion - this.chatManager.currentChat.opinion;
            console.log("faction opinion delta", 0.2 * delta);
            console.log("faction relation new", factionRelation + 0.1 * delta);
            ((KinkyDungeonFactionRelations as any)["Player"][enemy.faction] as number) = ((factionRelation + 0.1 * delta) / 100 - 0.5) * 2;
            
        }
        console.log("opinion new", opinion);
        this.chatManager.currentChat.opinion = opinion;

        console.log("response formatted", this.formatResponse(reply));

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
        if (!enemyId) return;
        const chat = ChatManager.chats[enemyId];

        if (!chat) {
            this.chatManager.currentChat = new Chat(enemy);
        }
        else {
            this.chatManager.currentChat = chat;
            await this.chatManager.restartCurrentChat();
        }



        ChatManager.chats[enemyId] = this.chatManager.currentChat;

        KDGameData.CurrentDialogMsg = "GenericAllyChat";
        KDGameData.CurrentDialogStage = "Chat";

        addTextKey("rGenericAllyChat", "...");

        ModUi.inputRequired = true;
        ModUi.chatEnabled = true;
    }
}