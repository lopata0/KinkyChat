import { SentimentClassification } from '@mod/Models/Sentiment';
import { ModUi } from './UI/ModUi';
import { Message } from './Chat/ChatCompletion';
import { ChatCompletionWebllm } from './Chat/ChatCompletionWebllm';
import { ChatManager } from './Chat/ChatManager';
import { ChatDialogue } from './UI/ChatDialogue';
import { ChatCompletionApi } from './Chat/ChatCompletionApi';

export class KinkyChat {
    static chatManager?: ChatManager;
    static loaded = false;

    static async init(): Promise<void> {
        console.log("Kinky Chat init!");
        ModUi.init();

        if (!(navigator as any).gpu) {
            console.log("WebGPU not detected");
            addTextKey("KDModButton" + ModUi.modName + "UseDefaultModelWeb", "Use automatic default model in browser (recommended disabling, no WebGPU detected)");
        }
    }

    static async loadMod() {
        ModUi.refreshConfig();

        let chatCompletion;
        if (ModUi.config.useDefaultModel) {
            addTextKey("KinkyChatLoadStatus", "KinkyChat: Loading default model inside browser...");
            chatCompletion = new ChatCompletionWebllm();
            await chatCompletion.init();
        }
        else {
            if (!ModUi.config.apiUrl || !ModUi.config.apiModelName) {
                addTextKey("KinkyChatLoadStatus", "KinkyChat: ERROR, api url or api model name undefined");
                return false;
            }
            addTextKey("KinkyChatLoadStatus", "KinkyChat: Testing API...");
            chatCompletion = new ChatCompletionApi(ModUi.config.apiUrl, ModUi.config.apiModelName);
            if (!await KinkyChat.isApiWorking(chatCompletion)) return;
        }

        KinkyChat.chatManager = new ChatManager(chatCompletion);

        const sentimentClassification = new SentimentClassification();
        await sentimentClassification.init();

        ChatDialogue.init(KinkyChat.chatManager!, sentimentClassification);

        KinkyChat.loaded = true;
        ModUi.displayLoaded();
    }

    static async isApiWorking(chatCompletion: ChatCompletionApi): Promise<boolean> {
        const testMessages: Message[] = [
            {
                "role": "system",
                "content": "You are helpful AI assistant who just says result to math problems."
            },
            {
                "role": "user",
                "content": "2+2=?"
            }
        ]
        const response = await chatCompletion.complete({ messages: testMessages });
        if (response instanceof Error) {
            addTextKey("KinkyChatLoadStatus", "KinkyChat: ERROR, " + response.message);
            return false;
        }
        return true;
    }

}

KinkyChat.init();