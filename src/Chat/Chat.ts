import { Message } from "@mod/Chat/ChatCompletion";

function convertScaleToText(scale: number): string {
    if (scale < 10) return "very low";
    else if (scale < 30) return "low";
    else if (scale < 50) return "medium low";
    else if (scale < 70) return "medium high";
    else if (scale < 90) return "high";
    else if (scale <= 100) return "very high";
    return "";
}

function formatData(data: any) {
    console.log("called format");
    let dataFormated = "";
    for (const [key, value] of Object.entries(data)) {
        if (!key || !value) continue;
        console.log("pass5");
        if (key == "restraints") {
            dataFormated += `Wearing these restraints: ${(value as Array<string>).join(", ")}\n`;
        }
        dataFormated += `${key} is ${value}\n`;
    }
    console.log(dataFormated);
    return dataFormated;
}

interface PlayerData {
    name: string,
    sex: string,
    inCell: boolean,
    submissiveness: string,
    securityLevel: string,
    prisonerState: string,
    gagged: boolean,
    restraints: Array<string>,
}

interface EnemyData {
    name: string,
    entityName: string,
    aggresiveness: string,
    sex: string,
    personality: string,
    style: string,
    nameList: string,
    playLine: string,
    faction: string,
    restraints: Array<string>,
}

interface MapData {
    name: string,
    checkpoint: string,
    title: string,
    leadingFaction: string
}

export class Chat {
    public memories: string;
    public npcName: string;
    public messages: Message[];
    constructor(enemy: any, memories: string = "") {
        this.memories = memories;
        const persistentNPC = KDPersistentNPCs[enemy.id];
        this.npcName = persistentNPC?.Name ?? KDGetName(enemy.id);
        console.log(enemy);
        const player = KinkyDungeonPlayer;
        const playerData: PlayerData = {
            name: player.Name,
            sex: "female",
            inCell: KinkyDungeonPlayerInCell(player),
            submissiveness: convertScaleToText(KinkyDungeonGoddessRep["Ghost"] + 50),
            securityLevel: convertScaleToText(KinkyDungeonGoddessRep["Prisoner"] + 50),
            prisonerState: KDGameData.PrisonerState,
            gagged: KDIsGaggedFast(),
            restraints: []
        };

        if (playerData.prisonerState == "") playerData.prisonerState = "not a prisoner";
        const playerRestraints = KDGetRestraintsForCharacter(player);
        playerRestraints.forEach((restraint) => {
            playerData.restraints.push(restraint.name);
        });


        let enemyPersonality: string = enemy.personality;
        if (enemyPersonality == "Dom") enemyPersonality = "Dominant";
        if (enemyPersonality == "Sub") enemyPersonality = "Submissive";

        let enemyData: EnemyData = {
            name: this.npcName,
            entityName: enemy.Enemy.name,
            aggresiveness: enemy.aggro,
            sex: "female",
            personality: enemyPersonality,
            style: enemy.style,
            nameList: enemy.nameList,
            playLine: enemy.playLine,
            faction: enemy.faction,
            restraints: enemy.restraints
        };

        const map = KDMapData;
        const checkpointToName: { [key: string]: string; } = { "grv": "graveyard", "cat": "catacombs", "jng": "jungle", "tmp": "temple", "bel": "bellows" };
        let mapData: MapData = {
            name: "dungeon",
            checkpoint: checkpointToName[KDMapData.Checkpoint] ?? KDMapData.Checkpoint,
            title: KDMapData.Title,
            leadingFaction: KDMapData.MapFaction
        };

        const playerDataFormated = formatData(playerData);
        const enemyDataFormated = formatData(enemyData);
        const mapDataFormated = formatData(mapData);
        this.messages = [
            {
                'role': 'system',
                'content': `You are NPC in a game Kinky Dungeon with these data:\n${enemyDataFormated}\nRoleplay this character authentically.\nLocation data:\n${mapDataFormated}\nPlayer data:\n${playerDataFormated}.\nKeep responses really short, in-character and situationally appropriate.${(memories != "" ? "\nYour memories:\n" + memories : "") + "\nAlways keep answers strictly short."}`
            }]
    }

    public addHistory(role: "system" | "user" | "assistant", content: string) {
        this.messages.push({
            'role': role,
            'content': content
        })
    }
};