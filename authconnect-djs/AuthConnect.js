export default class AuthConnect {
    constructor(client) {
        this.client = client;
        this.onDataGet = (service, guildId) => {
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
        };
        this.onDataUpdate = (service, guildId, newData) => {
            // TODO: Save new guild token info to local file (default behavior)
            
        };
    }

    setDataHandlers(onDataGet, onDataUpdate) {
        this.onDataGet = onDataGet;
        this.onDataUpdate = onDataUpdate;
    }

    isGuildLoggedIn(service, guildId) {

    }

    generateAuthUrl(service, guildId) {

    }
}
