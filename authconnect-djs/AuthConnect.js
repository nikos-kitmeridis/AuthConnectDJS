import { generateRandomString, SERVICES, WEB_REDIRECT_URL } from "./consts";
import FirestoreDataStore from "./datastores/FirestoreDataStore";
import LocalFileDataStore from "./datastores/LocalFileDataStore";

export default class AuthConnect {
    #client;
    #onDataGet;
    #onDataUpdate;
    #states = [];

    constructor(client) {
        this.client = client;
    }

    setDataHandlers(onDataGet, onDataUpdate) {
        this.onDataGet = onDataGet;
        this.onDataUpdate = onDataUpdate;
    }

    useDefaultDataHandlers(filePath) {
        const localFileDataStore = new LocalFileDataStore(filePath);
        localFileDataStore.initializeFile();
        this.setDataHandlers(localFileDataStore.onDataGet, localFileDataStore.onDataUpdate); 
    }

    useFirestoreDataHandlers(firestore, collectionName) {
        const firestoreDataStore = new FirestoreDataStore();
        this.setDataHandlers(firestoreDataStore.onDataGet, firestoreDataStore.onDataUpdate);
    }

    async isGuildLoggedIn(service, guildId) {
        return await this.onDataGet(service, guildId) != null;
    }

    generateAuthUrl(service, guildId, clientId, scope) {
        const serviceData = SERVICES[service];
        if(!serviceData) throw new Error("Invalid service argument.");

        const state = generateRandomString();
        this.#states.push(state);
        
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
