import fs from "fs";

export default class LocalFileDataStore {
    data: any = {};
    filePath: any = "";

    constructor(filePath: any) {
        this.filePath = filePath;
    }
    
    // NOTE: initalizeFile() is NOT automatically called by constructor because it is async.
    // You must call it yourself.
    async initializeFile() {
        let fileData;
        try {
            fileData = await fs.promises.readFile(this.filePath, {encoding: "utf-8"});
        } catch(e) {
            // If file does not exist, create it
            try {
                await fs.promises.writeFile(this.filePath, "{}");
            } catch(e) {
                console.error("Error creating token store file: " + e);
            }
            return;
        }
        try {
            this.data = JSON.parse(fileData);
        } catch(e) {
            console.error("Unparsable token store file: " + e);
        }
    }

    async onDataGet(service: any, guildId: any) {
        if(!(guildId in this.data) || !(service in this.data[guildId]))
            return null;
        const serviceData = this.data[guildId][service];
        return {
            refreshToken: serviceData.refreshToken,
            accessToken: serviceData.accessToken,
            expiryDate: new Date(serviceData.expiryDate)
        }
    }

    async onDataUpdate(service: any, guildId: any, newData: any) {
        if(!(guildId in this.data)) this.data[guildId] = {};
        this.data[guildId][service] = newData;

        try {
            await fs.promises.writeFile(this.filePath, JSON.stringify(this.data));
        } catch(e) {
            console.error("Error writing token store file: " + e);
        }
    }
}