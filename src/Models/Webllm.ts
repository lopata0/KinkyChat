import { CreateMLCEngine, InitProgressReport, modelLibURLPrefix, modelVersion } from '@mlc-ai/web-llm';

export class Webllm {
    public engine?: any;
    public async init(): Promise<void> {
        const initProgressCallback = (initProgress: InitProgressReport) => {
            console.log(initProgress);
            addTextKey("KinkyChatLoadStatus", "KinkyChat: " + initProgress.text);
        }

        const appConfig = {
            model_list: [
                {
                    model: "https://huggingface.co/mlc-ai/Hermes-3-Llama-3.2-3B-q4f32_1-MLC",
                    model_id: "Hermes-3-Llama-3.2-3B",
                    model_lib: modelLibURLPrefix +
                        modelVersion + "/Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
                    vram_required_MB: 2951.51,
                    low_resource_required: true,
                    overrides: {
                        context_window_size: 4096,
                    },
                }
            ],
        };

        console.log("Engine Config:", appConfig);

        const selectedModel = "Hermes-3-Llama-3.2-3B";

        this.engine = await CreateMLCEngine(
            selectedModel,
            { appConfig: appConfig, initProgressCallback: initProgressCallback } // engineConfig
        );
        console.log("MLC Engine created successfully:", this.engine);
    }
}