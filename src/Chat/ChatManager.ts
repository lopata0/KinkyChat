import { Chat } from "@mod/Chat/Chat"
import { ChatCompletionWebllm } from "./ChatCompletionWebllm";
import { Message } from "@mod/Chat/ChatCompletion";
import { ChatCompletionApi } from "./ChatCompletionApi";
import { convertScaleToText } from "@mod/Chat/Chat";

export class ChatManager {
    private chatCompletion: ChatCompletionWebllm | ChatCompletionApi;
    static chats: { [enemyId: number]: Chat } = [];
    public currentChat?: Chat;

    constructor(chatCompletion: ChatCompletionWebllm | ChatCompletionApi) {
        this.chatCompletion = chatCompletion;
    }

    public async createMemoriesFromCurrentChat(): Promise<string> {
        if (!this.currentChat || !this.currentChat.messages) throw new Error("currentChat is undefined");
        if (this.currentChat.messages.length < 3) return "";
        let historyFormatted = "";

        this.currentChat.messages.forEach((message) => {
            let role = message["role"];
            if (role == "system") return;
            const rolesMap: { [key: string]: string } = { "assistant": "you", "user": "her" };
            historyFormatted += rolesMap[role] + ": " + message["content"] + "\n";
        })
        const messages: Message[] = [
            {
                'role': "system",
                'content': "You are helpful AI assistant."
            },
            {
                'role': "user",
                'content': "Create short summarization your conversation with player:\n\"" + historyFormatted + (this.currentChat.memories != "" ? "\"\nContext: This conversation happened inside game Kinky Dungeon. Your opinion of player is " + convertScaleToText(this.currentChat.opinion) + ". Also combine it with this previous summary:\n\"" + this.currentChat.memories + "\"" : "\nStart with \"I met a girl...\"")
            },
        ]
        const response = await this.chatCompletion.complete({ messages: messages });
        if (response instanceof Error) throw response;
        return response;
    }

    public async restartCurrentChat(restraints: any[]) {
        if (!this.currentChat) return;
        this.currentChat.memories = await this.createMemoriesFromCurrentChat();
        this.currentChat.restraints = restraints;
        console.log(this.currentChat.memories);
        this.currentChat.initMessages();
    }

    public async sendMessage({ message, streamCallback = undefined }: { message: string, streamCallback?: (response: string) => void }): Promise<string> {
        if (!this.currentChat || !this.currentChat.messages) throw new Error("currentChat is undefined");
        this.currentChat.addHistory("user", message);
        const response = await this.chatCompletion.complete({ messages: this.currentChat.messages, temperature: 1, min_p: 0.1, streamCallback: streamCallback });
        if (response instanceof Error) throw response;
        this.currentChat.addHistory("assistant", response);
        return response;
    }

    public async extractFunctionsFromText(text: string) {
        /*Text: ""
Functions: 
- add restraint_name - adding restraint to another speaker
- remove restraint_name - removing restraint to another speaker

From given text extract all functions.
For example if text is "Sure! *gives you LatexBoots*" you just output "add LatexBoots"*/
        const messages: Message[] = [
            {"role": "system", "content": `You are function extractor from text. From text user sends you extract functions.
There are 2 functions:
add restraint_name - when user is adding restraint on you
remove restraint_name - when user is removing restraint from you

You must identify real wearable kinky restraints from text.

You just output these functions, for example if user says "*pulls out latex mittens and puts it on you*" you just output "add LatexMittens".
If theres really none just output "none".`},
            {"role": "user", "content": text}
        ];
        return await this.chatCompletion.complete({ messages: messages, temperature: 0, min_p: 0.1 });
        
    }
}