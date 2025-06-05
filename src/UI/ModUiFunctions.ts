import { ChatManager } from "@mod/Chat/ChatManager";
import { ModUi } from "./ModUi";
import { Chat } from "@mod/Chat/Chat";
import { KinkyChat } from "@mod/main";

const KinkyDungeonRunOriginal = KinkyDungeonRun;
const KDSendInputOriginal = KDSendInput;
const KDProcessInputOriginal = KDProcessInput;
const KinkyDungeonGameKeyDownOriginal = KinkyDungeonGameKeyDown;
const KinkyDungeonGameKeyUpOriginal = KinkyDungeonGameKeyUp;
const KinkyDungeonGenerateSaveDataOriginal = KinkyDungeonGenerateSaveData;
const KinkyDungeonLoadGameOriginal = KinkyDungeonLoadGame;

declare const LZString: any;

export class ModUiFunctions {
    static KinkyDungeonRun() {
        KinkyDungeonRunOriginal();
        if (!KinkyChat.loaded && (KinkyDungeonState == "Menu" || KinkyDungeonState == "ModConfig")) {
            DrawTextKD(TextGet("KinkyChatLoadStatus"), 520, 20, KDBaseWhite, "#003399", 24, "left");
        }
        if (ModUi.displayLoad) {
            addTextKey("KinkyChatLoadStatus", "KinkyChat loaded!")
            DrawTextKD(TextGet("KinkyChatLoadStatus"), 520, 20, KDBaseWhite, "#003399", 24, "left");
        }
        if (!ModUi.inputRequired || KinkyDungeonState != "Game") return;
        ModUi.chatInput = KDTextField("ChatInput",
            680, 600, 600, 64, "text", "", "3000", 24
        );
        if (ModUi.chatInput.Created) {
            ElementValue("ChatInput", "");

            ModUi.chatInput.Element.oninput = (_event: any) => {
                ModUi.typedText = ElementValue("ChatInput");
            };
        }
    };

    static KDSendInput = function (type: string, data: any) {
        if (ModUi.chatEnabled && type != "dialogue") return;
        return KDSendInputOriginal(type, data);
    }

    static KDProcessInput = function (type: string, data: any) {
        if (ModUi.chatEnabled && type != "dialogue") return;
        return KDProcessInputOriginal(type, data);
    }

    static KinkyDungeonGameKeyDown() {
        if (ModUi.chatEnabled) return;
        return KinkyDungeonGameKeyDownOriginal();
    }

    static KinkyDungeonGameKeyUp(lastPress: number) {
        if (ModUi.chatEnabled) return;
        return KinkyDungeonGameKeyUpOriginal(lastPress);
    }

    static KinkyDungeonGenerateSaveData() {
        type ExtendedSave = KinkyDungeonSave & {
            KinkyChat?: any; // or a more specific type instead of 'any'
        };

        let save: ExtendedSave = KinkyDungeonGenerateSaveDataOriginal();

        save.KinkyChat = {};
        console.log(ChatManager.chats);
        const dict = Object.fromEntries(Object.entries(ChatManager.chats));
        console.log(dict);
        save.KinkyChat.chats = dict;
        return save;
    }
    static KinkyDungeonLoadGame(String: string, loadfromfile = undefined) {
        let savetmp;
        ChatManager.chats = {};
        if (String)
            savetmp = JSON.parse(LZString.decompressFromBase64(String));
        else
            savetmp = JSON.parse(LZString.decompressFromBase64(localStorage.getItem('KinkyDungeonSave')));
        if (!loadfromfile) {
            
            if (savetmp.KinkyChat != undefined) {
                if (savetmp.KinkyChat == null) return KinkyDungeonLoadGameOriginal(String);
                console.log(savetmp.KinkyChat.chats);
                const chats = Object.fromEntries(Object.entries(savetmp.KinkyChat.chats));
                ChatManager.chats = {};
                for (let key in chats) {
                    ChatManager.chats[Number.parseInt(key)] = Chat.reinit(chats[key]);
                }
                console.log("converted:");
                console.log(ChatManager.chats);
            }
        }
        return KinkyDungeonLoadGameOriginal(String);
    }
}