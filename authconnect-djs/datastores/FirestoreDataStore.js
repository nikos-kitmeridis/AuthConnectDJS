export default class FirestoreDataStore {
    #firestore;
    #collectionName;

    constructor(firestore, collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }
    
    async onDataGet(service, guildId) {
        
    }

    async onDataUpdate(service, guildId, newData) {
        
    }
}