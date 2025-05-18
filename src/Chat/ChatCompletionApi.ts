import { ChatCompletion, Message, CompletionOptions } from "@mod/Chat/ChatCompletion";
import { Chat } from "@mod/Chat/Chat";

export class ChatCompletionApi extends ChatCompletion {
    private url: string;
    private modelName: string;

    constructor(url: string, modelName: string) {
        super();
        this.url = url;
        this.modelName = modelName;
    }

    public async complete({ messages, min_p = 0, temperature = 0, streamCallback = undefined }: CompletionOptions): Promise<string | Error> {
        if (!streamCallback) {
            let reply = null;
            await fetch(this.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'model': this.modelName,
                    'messages': messages,
                    'temperature': temperature,
                    'min_p': min_p,
                    'stream': false
                })
            }).then(response => {
                if (!response.ok) return new Error(response.status.toString());
                return response.json();
            }).then(data => {
                console.log(data);
                if (data["error"]) return new Error(data["error"]);
                let content = null;
                if (data.choices) content = data.choices[0].message["content"];
                else if (data.message) content = data.message["content"];
                else throw new Error("content is null");
                reply = content;
            }).catch(error => {
                console.error('Error:', error);
                return new Error(error.message);
            });
            if (reply) return reply;
            return new Error("completion fetch failed");
        }

        let reply = null;

        await fetch(this.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'model': this.modelName,
                'messages': messages,
                'temperature': temperature,
                'min_p': min_p,
                'stream': true
            })
        }).then(async (response) => {
            if (!response.ok) return new Error(response.status.toString());

            if (!response.body) return new Error("response body was null");
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let result = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    let data = line;
                    if (line.startsWith('data: ')) data = data.substring(6);
                    if (data === '[DONE]') {
                        console.log('Stream finished');
                    } else {
                        try {
                            const parsed = JSON.parse(data);
                            console.log(data);
                            if (parsed.message || (parsed.choices && parsed.choices[0].delta.content)) {
                                if (parsed.choices) result += parsed.choices[0].delta.content;
                                else if (parsed.message) result += parsed.message.content;
                                streamCallback(result);
                            }
                        } catch (e) {
                            return new Error('error parsing JSON ' + e);
                        }
                    }
                }
            }
            reply = result;
        });
        if (reply) return reply
        throw new Error("streaming completion fetch failed");
    }
}