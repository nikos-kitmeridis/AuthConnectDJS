import { FIREBASE_CONFIG, generateRandomString, POLL_EXPIRY, POLL_INTERVAL, SERVICES, WEB_REDIRECT_URL } from "./consts.js";
import {initializeApp} from "firebase/app";
import fetch from "node-fetch";
import {getFunctions, httpsCallable} from "firebase/functions";
import FirestoreDataStore from "./datastores/FirestoreDataStore.js";
import LocalFileDataStore from "./datastores/LocalFileDataStore.js";

export default class AuthConnect {
    #onDataGet;
    #onDataUpdate;
    #firebaseApp;
    #functions;
    #pollFunction;
    #activePolling = [
        /*
        {
            guildId: string,
            service: string,
            clientId: string,
            clientSecret: string,
            state: string,
            expires: Date
        }
        */
    ];

    constructor() {
        this.#setPollingInterval();
        this.#firebaseApp = initializeApp(FIREBASE_CONFIG);
        this.#functions = getFunctions(this.#firebaseApp);
        this.#pollFunction = httpsCallable(this.#functions, "pollForAuthResult");
    }

    #setPollingInterval() {
        // Poll every 5 seconds for new tokens from the server
        // If a token is found, update the data store
        // If the poll request is expired, pop it

        setInterval(async () => {
            for(let i = this.#activePolling.length - 1; i >= 0; i--) {
                const poll = this.#activePolling[i];
                if(poll.expires < new Date()) {
                    this.#activePolling.splice(this.#activePolling.indexOf(poll), 1);
                    continue;
                }
                // TODO: maybe change function to support batched polling? It's impractical to send a request for every poll object
                this.#pollFunction({state: poll.state}).then(res => {
                    if(!res.data.code) return;
                    
                    this.#activePolling.splice(this.#activePolling.indexOf(poll), 1);
                    this.#exchangeCode(poll.service, poll.guildId, poll.clientId, poll.clientSecret, res.data.code);
                }, (e) => {
                    console.error("Error polling for auth result");
                    console.error(e);
                })

            }
        }, POLL_INTERVAL);
    }

    async #exchangeCode(service, guildId, clientId, clientSecret, code) {
        const serviceData = SERVICES[service];
        if(!serviceData) {
            throw new Error("Invalid service: " + service);
        }
        const result = await fetch(serviceData.authCodeExchangeUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: WEB_REDIRECT_URL,
                client_id: clientId,
                client_secret: clientSecret
            })
        });
        const json = await result.json();
        if("error" in json){
            console.error("Error returned by authorization exchange endpoint! ");
            console.error(json);
            return;
        }
        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + json.expires_in);
        this.#onDataUpdate(service, guildId, {
            refreshToken: json.refresh_token,
            accessToken: json.access_token,
            expiryDate
        });
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

    generateAuthURL(service, guildId, clientId, clientSecret, scope) {
        const serviceData = SERVICES[service];
        if(!serviceData) throw new Error("Invalid service argument.");

        const state = generateRandomString();
        this.#activePolling.push({
            service,
            guildId,
            clientId,
            clientSecret,
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
