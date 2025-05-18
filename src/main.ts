import { SentimentClassification } from '@mod/Models/Sentiment';
import { ModUi } from './UI/ModUi';
import { Message } from './Chat/ChatCompletion';
import { ChatCompletionWebllm } from './Chat/ChatCompletionWebllm';
import { ChatManager } from './Chat/ChatManager';
import { ChatDialogue } from './UI/ChatDialogue';
import { ChatCompletionApi } from './Chat/ChatCompletionApi';

export class KinkyChat {
    static sentimentClassification?: SentimentClassification;
    static chatManager?: ChatManager;
    static loaded = false;

    static async init(): Promise<void> {
        console.log("Kinky Chat init!");
        ModUi.init();

        if (!(navigator as any).gpu) {
            console.log("WebGPU not detected");
            addTextKey("KDModButton" + ModUi.modName + "UseDefaultModelWeb", "Use automatic default model in browser (recommended disabling, no WebGPU detected)");
        }

        //KinkyChat.instance.sentimentClassification = new SentimentClassification();
        //await KinkyChat.instance.sentimentClassification.init();

        if (!KinkyChat.loaded && ModUi.config.autoLoad) KinkyChat.loadMod();
    }

    static async loadMod() {
        ModUi.refreshConfig();

        if (ModUi.config.useDefaultModel) {
            addTextKey("KinkyChatLoadStatus", "KinkyChat: Loading default model inside browser...");
            const chatCompletion = new ChatCompletionWebllm();
            await chatCompletion.init();
            KinkyChat.chatManager = new ChatManager(chatCompletion);
        }
        else {
            if (!ModUi.config.apiUrl || !ModUi.config.apiModelName) {
                addTextKey("KinkyChatLoadStatus", "KinkyChat: ERROR, api url or api model name undefined");
                return false;
            }
            addTextKey("KinkyChatLoadStatus", "KinkyChat: Testing API...");
            const chatCompletion = new ChatCompletionApi(ModUi.config.apiUrl, ModUi.config.apiModelName);
            if (!await KinkyChat.isApiWorking(chatCompletion)) return;
            KinkyChat.chatManager = new ChatManager(chatCompletion);
        }

        ChatDialogue.init(KinkyChat.chatManager!);

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