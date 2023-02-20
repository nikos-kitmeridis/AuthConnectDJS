import firebase from "firebase-admin";

export default class FirestoreDataStore {
    #data = {};
    #firestore;
    #collectionName;

    constructor(firestore, collectionName) {
        this.#firestore = firestore;
        this.#collectionName = collectionName;
    }
    
    async onDataGet(service, guildId) {
        if(guildId in this.#data) {
            if(!this.#data[guildId]) return null;
            if(!(service in this.#data[guildId])) return null;
            const serviceData = this.#data[guildId][service];
            return {
                refreshToken: serviceData.refreshToken,
                accessToken: serviceData.accessToken,
                expiryDate: new Date(serviceData.expiryDate)
            };
        }

        // Cache miss; fetch from Firestore

        let data;
        try {
            data = await this.#firestore.collection(this.#collectionName).doc(guildId).get();
        } catch(e) {
            console.error("Firestore error in onDataGet");
            console.error(e);
            return null;
        }
        if(!data.exists) {
            this.#data[guildId] = null;
            return null;
        }

        this.#data[guildId] = data.data();
        if(!(service in this.#data[guildId])) return null;
        const serviceData = this.#data[guildId][service];
        return {
            refreshToken: serviceData.refreshToken,
            accessToken: serviceData.accessToken,
            expiryDate: new Date(serviceData.expiryDate)
        };
    }

    async onDataUpdate(service, guildId, newData) {
        if(!this.#data[guildId]) this.#data[guildId] = {};
        this.#data[guildId][service] = newData;

        try {
            await this.#firestore.collection(this.#collectionName).doc(guildId).set({
                [service]: newData
            }, {merge: true});
        } catch(e) {
            console.error("Firestore error in onDataUpdate");
            console.error(e);
        }
    }
}