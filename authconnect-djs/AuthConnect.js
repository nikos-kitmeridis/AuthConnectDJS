import FirestoreDataStore from "./datastores/FirestoreDataStore";
import LocalFileDataStore from "./datastores/LocalFileDataStore";

export default class AuthConnect {
    #client;
    #onDataGet;
    #onDataUpdate;

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

    isGuildLoggedIn(service, guildId) {
        // TODO
    }

    generateAuthUrl(service, guildId) {
        // TODO
    }

    getAccessToken(service, guildId) {
        // TODO
    }
}
