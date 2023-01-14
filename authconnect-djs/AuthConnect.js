import { generateRandomString, POLL_EXPIRY, SERVICES, WEB_REDIRECT_URL } from "./consts.js";
import FirestoreDataStore from "./datastores/FirestoreDataStore.js";
import LocalFileDataStore from "./datastores/LocalFileDataStore.js";

export default class AuthConnect {
    #onDataGet;
    #onDataUpdate;
    #activePolling = [
        /*
        {
            guildId: string,
            service: string,
            state: string,
            expires: Date
        }
        */
    ];

    constructor() {
        this.#setDiscordHandlers();
        this.#setPollingInterval();
    }

    #setPollingInterval() {
        // Poll every 5 seconds for new tokens from the server
        // If a token is found, update the data store
        // If the poll request is expired, pop it
    }

    setDataHandlers(onDataGet, onDataUpdate) {
        this.#onDataGet = onDataGet;
        this.#onDataUpdate = onDataUpdate;
    }

    useDefaultDataHandlers(filePath) {
        const localFileDataStore = new LocalFileDataStore(filePath);
        localFileDataStore.initializeFile();
        this.setDataHandlers(localFileDataStore.onDataGet.bind(localFileDataStore), localFileDataStore.onDataUpdate.bind(localFileDataStore));
    }

    useFirestoreDataHandlers(firestore, collectionName) {
        const firestoreDataStore = new FirestoreDataStore();
        this.setDataHandlers(firestoreDataStore.onDataGet.bind(firestoreDataStore), firestoreDataStore.onDataUpdate.bind(firestoreDataStore));
    }

    async isGuildLoggedIn(service, guildId) {
        return await this.#onDataGet(service, guildId) != null;
    }

    generateAuthURL(service, guildId, clientId, scope) {
        const serviceData = SERVICES[service];
        if(!serviceData) throw new Error("Invalid service argument.");

        const state = generateRandomString();
        this.#activePolling.push({
            service,
            guildId,
            state,
            expires: new Date(Date.now() + POLL_EXPIRY)
        })
        
        const url = serviceData.authUrl
            .replace("{{CLIENT_ID}}", encodeURIComponent(clientId))
            .replace("{{REDIR}}", encodeURIComponent(WEB_REDIRECT_URL))
            .replace("{{SCOPE}}", encodeURIComponent(scope))
            .replace("{{STATE}}", encodeURIComponent(state));

        return url;
    }

    getAccessToken(service, guildId) {
        // TODO
    }
}
