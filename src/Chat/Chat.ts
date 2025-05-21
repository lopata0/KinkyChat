import { Message } from "@mod/Chat/ChatCompletion";

function gaussianRandom(mean=0, stdev=1) {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}

function getRandomOpinion(factionOpinion: number) {
    return Math.max(Math.min(Math.abs(gaussianRandom(factionOpinion, 10)), 100), 0);
}

export function convertScaleToText(scale: number): string {
    if (scale < 10) return "Exceptionally low";
    else if (scale < 20) return "Extremely low";
    else if (scale < 30) return "Very low";
    else if (scale < 40) return "Low";
    else if (scale < 50) return "Moderately low";
    else if (scale < 60) return "Moderately high";
    else if (scale < 70) return "High";
    else if (scale < 80) return "Very high";
    else if (scale < 90) return "Extremely high";
    else if (scale <= 100) return "Exceptionally high";
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
    public memories = "";
    public npcName?: string;
    public messages?: Message[];
    public opinion = 50;
    public enemyId = -1;

    constructor(enemy: any, reinit = false) {
        if(reinit) return;
        this.enemyId = enemy.id;
        console.log(this.enemyId);
        this.initMessages();
    }

    static reinit(data: any) {
        const chat = new Chat(null, true);
        chat.memories = data.memories;
        chat.npcName = data.npcName;
        chat.messages = data.messages;
        chat.opinion = data.opinion;
        chat.enemyId = data.enemyId;
        return chat;
    }

    public initMessages() {
        let enemy: any | null = null;
        for (let entity of KDMapData.Entities) {
            if (entity.id == this.enemyId) {
                enemy = entity;
                break;
            }
        }
        if (enemy == null) throw new Error("enemy is null");

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


        const factionRelation = (KinkyDungeonFactionRelations as any)["Player"][enemy.faction];
        this.opinion = getRandomOpinion(factionRelation ? (factionRelation / 2 + 0.5) * 100 : 50);
        
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
                'content': `You are NPC in a game Kinky Dungeon with these data:\n${enemyDataFormated}\nRoleplay this character authentically.\nLocation data:\n${mapDataFormated}\nPlayer data:\n${playerDataFormated}.\nKeep responses really short, in-character and situationally appropriate.`

            }]
        if (this.memories != "") this.messages[0]["content"] += "\nYour memories:\n" + this.memories;
        this.messages[0]["content"] += `\nYour opinion of player: ${convertScaleToText(this.opinion)}\nAlways keep answers strictly short.`

    }

    public addHistory(role: "system" | "user" | "assistant", content: string) {
        if (this.messages == undefined) return;
        this.messages.push({
            'role': role,
            'content': content
        })
    }
};