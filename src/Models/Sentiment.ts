import { pipeline } from '@huggingface/transformers';

export class SentimentClassification {
    public model?: any;
    public async init(): Promise<void> {
        this.model = await pipeline('sentiment-analysis', 'onnx-community/multilingual-sentiment-analysis-ONNX', {
            progress_callback: (progress) => {
                if (!progress.status) return;
                //let percent = Math.round(Number.parseInt(progress.status));
                addTextKey("KinkyChatLoadStatus", "chat: loading sentiment-analysis model " + progress.status);
                console.log(progress.status);
            }
        });
        const result = await this.model("hi how are you?");
        console.log(result);
    }
}