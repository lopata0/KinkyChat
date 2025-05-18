import { Chat } from "@mod/Chat/Chat"
import { ChatCompletionWebllm } from "./ChatCompletionWebllm";
import { Message } from "@mod/Chat/ChatCompletion";
import { ChatCompletionApi } from "./ChatCompletionApi";

export class ChatManager {
    private chatCompletion: ChatCompletionWebllm | ChatCompletionApi;
    static chats: { [enemyId: number]: Chat } = [];
    public currentChat?: Chat;

    constructor(chatCompletion: ChatCompletionWebllm | ChatCompletionApi) {
        this.chatCompletion = chatCompletion;
    }

    public async createMemoriesFromCurrentChat(): Promise<string> {
        if(!this.currentChat) throw new Error("currentChat is undefined");
        if(this.currentChat.messages.length < 3) return "";
        let historyFormatted = "";
        
        this.currentChat.messages.forEach((message) => {
            let role = message["role"];
            if (role == "system") return;
            const rolesMap: { [key: string]: string } = { "assistant": "me", "user": "her" };
            historyFormatted += rolesMap[role] + ": " + message["content"] + "\n";
        })
        const messages: Message[] = [
            {
                'role': "system",
                'content': "You are helpful AI assistant."
            },
            {
                'role': "user",
                'content': "Create short summarization of this conversation in first person:\n\"" + historyFormatted + (this.currentChat.memories != "" ? "\"\nAlso combine it with this previous summary:\n\"" + this.currentChat.memories + "\"" : "\nStart with \"I met a girl...\"")
            },
        ]
        const response = await this.chatCompletion.complete({messages: messages});
        if (response instanceof Error) throw response;
        return response;
    }

    public async sendMessage({ message, streamCallback = undefined }: {message: string, streamCallback?: (response: string) => void}): Promise<string> {
        if(!this.currentChat) throw new Error("currentChat is undefined");
        this.currentChat.addHistory("user", message);
        const response = await this.chatCompletion.complete({ messages: this.currentChat.messages, temperature: 1, min_p: 0.1, streamCallback: streamCallback });
        if (response instanceof Error) throw response;
        this.currentChat.addHistory("assistant", response);
        return response;
    }
}