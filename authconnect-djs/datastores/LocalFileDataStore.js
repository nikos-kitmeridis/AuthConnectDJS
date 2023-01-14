import fs from "fs";

export default class LocalFileDataStore {
    async onDataGet(service, guildId) {
        // TODO: Retrieve guild token info from local file (default behavior)
        return {
            google: {
                refreshToken: "123",
                accessToken: "xyz",
                expiryDate: new Date()
            },
            spotify: {
                refreshToken: "123",
                accessToken: "xyz",
                expiryDate: new Date()
            }
        }
    }

    async onDataUpdate(service, guildId, newData) {
        // TODO: Save new guild token info to local file (default behavior)
    }
}