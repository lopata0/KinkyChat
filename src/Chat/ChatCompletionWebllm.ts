import { ChatCompletion, Message, CompletionOptions } from "@mod/Chat/ChatCompletion";
import { Chat } from "@mod/Chat/Chat";
import { Webllm } from '@mod/Models/Webllm';

export class ChatCompletionWebllm extends ChatCompletion {
    private webllm?: Webllm;

    public async init() {
        this.webllm = new Webllm();
        await this.webllm.init();
    }

    public async complete({messages, min_p = 0, temperature = 0, streamCallback = undefined} : CompletionOptions): Promise<string> {
        if (!this.webllm) throw new Error("webllm is undefined");
        if (!streamCallback) {
            const reply = await this.webllm.engine.chat.completions.create({
                messages: messages,
                min_p: min_p,
                temperature: temperature,
            });
            return reply.choices[0].message["content"];
        }

        const chunks = await this.webllm.engine.chat.completions.create({
            messages: messages,
            min_p: min_p,
            temperature: temperature,
            stream: true,
            stream_options: { include_usage: true },
        });

        let reply = "";
        for await (const chunk of chunks) {
            reply += chunk.choices[0]?.delta.content || "";
            streamCallback(reply);
            if (chunk.usage) {
                console.log(chunk.usage);
            }
        }

        return await this.webllm.engine.getMessage();
    }
}