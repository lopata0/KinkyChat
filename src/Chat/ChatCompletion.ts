export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionOptions {
    messages: Message[],
    min_p?: number,
    temperature?: number,
    streamCallback?: (reply: string) => void
}

export class ChatCompletion {
    protected async complete?({messages, min_p, temperature, streamCallback} : CompletionOptions): Promise<string | Error>;
}