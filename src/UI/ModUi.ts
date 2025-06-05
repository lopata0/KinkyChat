import { KinkyChat } from "@mod/main";
import { ModUiFunctions } from "@mod/UI/ModUiFunctions";

declare let KinkyDungeonRun: Function;
declare let KDSendInput: Function;
declare let KDProcessInput: Function;
declare let KinkyDungeonGameKeyDown: Function;
declare let KinkyDungeonGameKeyUp: Function;
declare let KinkyDungeonGenerateSaveData: Function;
declare let KinkyDungeonLoadGame: Function;

type ModConfigOption = {
    type: string;
    default?: any;
    refvar: string;
    name?: string;
    click?: Function;
};
type ModConfig = ModConfigOption[];
declare let KDModConfigs: Record<string, ModConfig>;

type ModSettings = Record<string, any>;
declare let KDModSettings: Record<string, ModSettings>;


interface Config {
    apiUrl?: string,
    apiModelName?: string,
    autoLoad?: string,
    useDefaultModel?: string
};


export class ModUi {
    static chatInput?: { Element: any, Created: boolean };
    static displayLoad = false;
    static inputRequired = false;
    static chatEnabled = false;
    static typedText = "";
    static modName = "KinkyChat";
    static texts = [
        { "dGenericAlly_Chat": "Chat..." },
        { "rGenericAllyChat": "..." },
        { "dGenericAllyChat_Say": "Say" },
        { "dGenericAllyChat_Leave": "Leave" },
        { "rGenericAllyChat_Say": "Thinking..." },
        { "KinkyChatLoadStatus": "KinkyChat: WARNING, mod must be loaded in mod configuration", },
        { "KDModButtonNone": "None" },
        { [`KDModButton${this.modName}Load`]: "Load mod" },
        { [`KDModButton${this.modName}`]: "KinkyChat" },
        { [`KDModButton${this.modName}DefaultModelDisabled`]: "Use these settings if default model is disabled:" },
        { [`KDModButton${this.modName}UseOllama`]: "Using ollama" },
        { [`KDModButton${this.modName}UseLmStudio`]: "Using LM Studio" },
        { [`KDModButton${this.modName}ApiUrl`]: "API URL (if default model is disabled):" },
        { [`KDModButton${this.modName}ApiUrlInput`]: "" },
        { [`KDModButton${this.modName}ModelNameInput`]: "" },
        { [`KDModButton${this.modName}ModelName`]: "Model name (if default model is disabled):" },
        { [`KDModButton${this.modName}UseDefaultModelWeb`]: "Use automatic default model in browser" },
        { [`KDModButton${this.modName}AutoLoad`]: "Load mod automatically next time" }
    ]

    static init(): void {
        this.initTexts();
        this.initFunctions();
        this.initSettings();
    }
    static initFunctions() {
        KinkyDungeonRun = ModUiFunctions.KinkyDungeonRun;
        KDSendInput = ModUiFunctions.KDSendInput;
        KDProcessInput = ModUiFunctions.KDProcessInput;
        KinkyDungeonGameKeyDown = ModUiFunctions.KinkyDungeonGameKeyDown;
        KinkyDungeonGameKeyUp = ModUiFunctions.KinkyDungeonGameKeyUp;
        KinkyDungeonGenerateSaveData = ModUiFunctions.KinkyDungeonGenerateSaveData;
        KinkyDungeonLoadGame = ModUiFunctions.KinkyDungeonLoadGame;
    }

    static displayLoaded() {
        this.displayLoad = true;
        setTimeout(() => { this.displayLoad = false }, 2000);
    }

    static initTexts(): void {
        for (const textObj of this.texts) {
            for (const [key, value] of Object.entries(textObj)) {
                addTextKey(key, value);
            }
        }
    }

    static initSettings() {
        if (!KDEventMapGeneric['afterModSettingsLoad']) return;
        KDEventMapGeneric['afterModSettingsLoad'][this.modName] = (e, data) => {
            
            
            KDModConfigs[this.modName] = [
                {
                    type: "boolean",
                    default: true,
                    refvar: this.modName + "UseDefaultModelWeb",
                },

                {
                    type: "text",
                    refvar: this.modName + "ApiUrl",
                },
                {
                    type: "string",
                    refvar: this.modName + "ApiUrlInput",
                },
                {
                    type: "text",
                    refvar: this.modName + "ModelName",
                },
                {
                    type: "string",
                    refvar: this.modName + "ModelNameInput",
                },
                {
                    type: "boolean",
                    default: false,
                    refvar: this.modName + "AutoLoad",
                },
                {
                    type: "button",
                    name: this.modName + "Load",
                    click: KinkyChat.loadMod,
                    refvar: this.modName + "Load"
                },

            ];
            let settings = localStorage.getItem('KDModSettings');
            let settingsobject = settings ? JSON.parse(settings)["KinkyChat"] ?? {} : {};

            
            KDModConfigs[this.modName].forEach((option: ModConfigOption) => {
                if (settingsobject[option.refvar] == undefined) {
                    settingsobject[option.refvar] = option.default
                }
            });
            KDModSettings[this.modName] = settingsobject;
            this.refreshConfig();
            if (!KinkyChat.loaded && ModUi.config.autoLoad) KinkyChat.loadMod();
        }

        KDEventMapGeneric['afterModConfig'][this.modName] = (e, data) => {
            this.refreshConfig();
        }
    }

    static config: Config = {};

    static refreshConfig() {
        this.config.apiUrl = KDModSettings[this.modName][this.modName + "ApiUrlInput"];
        this.config.apiModelName = KDModSettings[this.modName][this.modName + "ModelNameInput"];
        this.config.autoLoad = KDModSettings[this.modName][this.modName + "AutoLoad"];
        this.config.useDefaultModel = KDModSettings[this.modName][this.modName + "UseDefaultModelWeb"];
    }
}