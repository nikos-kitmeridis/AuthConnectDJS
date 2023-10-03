import { FIREBASE_CONFIG, generateRandomString, POLL_EXPIRY, POLL_INTERVAL, SERVICES, WEB_REDIRECT_URL } from "./consts";
import {initializeApp} from "firebase/app";
import fetch from "node-fetch";
import {getFunctions, httpsCallable} from "firebase/functions";
import FirestoreDataStore from "./datastores/FirestoreDataStore";
import LocalFileDataStore from "./datastores/LocalFileDataStore";
import {useSui} from "./useSui";
import {generateNonce, generateRandomness} from '@mysten/zklogin';
import {Ed25519Keypair} from '@mysten/sui.js/keypairs/ed25519';
import { UserKeyData } from "./UserInfo";
import {SuiClient} from "@mysten/sui.js/client";
import StorageEmulator from "./StorageEmulator";

export default class AuthConnect {
    
    onDataGet: any;
    onDataUpdate: any;
    onLinked: any;
    firebaseApp: any;
    functions: any;
    pollFunction: any;
    serviceConstants: any;
    activePolling: any[] = [
        /*
        {
            guildId: string,
            service: string,
            state: string,
            expires: Date
        }
        */
    ];
    suiClient: SuiClient;
    storageEmulator = StorageEmulator.Instance;


    constructor(serviceConstants: any) {
        this.setPollingInterval();
        this.firebaseApp = initializeApp(FIREBASE_CONFIG);
        this.functions = getFunctions(this.firebaseApp);
        this.pollFunction = httpsCallable(this.functions, "pollForAuthResult");
        this.serviceConstants = serviceConstants;
        const {suiClient} = useSui();
        this.suiClient = suiClient;
    }

    setPollingInterval() {
        // Poll every 5 seconds for new tokens from the server
        // If a token is found, update the data store
        // If the poll request is expired, pop it

        setInterval(async () => {
            for(let i = this.activePolling.length - 1; i >= 0; i--) {
                const poll: any = this.activePolling[i];
                if(poll.expires < new Date()) {
                    this.activePolling.splice(this.activePolling.indexOf(poll), 1);
                    continue;
                }
                // TODO: maybe change function to support batched polling? It's impractical to send a request for every poll object
                this.pollFunction({state: poll.state}).then((res: any) => {
                    if(!res.data.code) return;
                    
                    this.activePolling.splice(this.activePolling.indexOf(poll), 1);
                    this.exchangeCode(poll.service, poll.guildId, res.data.code);
                }, (e: any) => {
                    console.error("Error polling for auth result");
                    console.error(e);
                })

            }
        }, POLL_INTERVAL);
    }

    async exchangeCode(service: any, guildId: any, code: any) {
        const serviceData = SERVICES[service];
        if(!serviceData) throw new Error("Invalid service: " + service);
        const serviceConstantsData = this.serviceConstants[service];
        if(!serviceConstantsData) throw new Error("No service constants found for service " + service + ". Did you forget to pass them to the constructor?");

        const result = await fetch(serviceData.tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: WEB_REDIRECT_URL,
                client_id: serviceConstantsData.clientId,
                client_secret: serviceConstantsData.clientSecret
            })
        });
        const json: any = await result.json();
        console.log(json);
        if("error" in json){
            console.error("Error returned by authorization exchange endpoint! ");
            console.error(json);
            return;
        }
        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + json.expires_in);
        this.onDataUpdate(service, guildId, {
            refreshToken: json.refresh_token,
            accessToken: json.access_token,
            expiryDate
        });

        if(this.onLinked) this.onLinked(service, guildId);
    }

    async refreshToken(service: any, guildId: any, refreshToken: any) {
        const serviceData = SERVICES[service];
        if(!serviceData) throw new Error("Invalid service: " + service);
        const serviceConstantsData = this.serviceConstants[service];
        if(!serviceConstantsData) throw new Error("No service constants found for service " + service + ". Did you forget to pass them to the constructor?");

        const result = await fetch(serviceData.tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: refreshToken,
                client_id: serviceConstantsData.clientId,
                client_secret: serviceConstantsData.clientSecret
            })
        });
        const json: any = await result.json();
        if("error" in json){
            console.error("Error returned by refresh token endpoint!");
            console.error(json);
            return;
        }
        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + json.expires_in);
        await this.onDataUpdate(service, guildId, {
            refreshToken,
            accessToken: json.access_token,
            expiryDate
        });
    }

    setDataHandlers(onDataGet: any, onDataUpdate: any) {
        this.onDataGet = onDataGet;
        this.onDataUpdate = onDataUpdate;
    }

    useDefaultDataHandlers(filePath: any) {
        const localFileDataStore = new LocalFileDataStore(filePath);
        localFileDataStore.initializeFile();
        this.setDataHandlers(localFileDataStore.onDataGet.bind(localFileDataStore), localFileDataStore.onDataUpdate.bind(localFileDataStore));
    }

    useFirestoreDataHandlers(firestore: any, collectionName: any) {
        const firestoreDataStore = new FirestoreDataStore(firestore, collectionName);
        this.setDataHandlers(firestoreDataStore.onDataGet.bind(firestoreDataStore), firestoreDataStore.onDataUpdate.bind(firestoreDataStore));
    }

    async isGuildLoggedIn(service: any, guildId: any) {
        if(!this.onDataGet) throw new Error("No data handlers set. You likely forgot to call either useDefaultDataHandlers, useFirestoreDataHandlers, or setDataHandlers.");
        const data = await this.onDataGet(service, guildId);
        if(!data || !data.refreshToken) return false;
        return true;
    }

    async prepareLogin() {
        const {epoch, epochDurationMs, epochStartTimestampMs} = await this.suiClient.getLatestSuiSystemState();


        const maxEpoch = parseInt(epoch) + 2; // this means the ephemeral key will be active for 2 epochs from now.
        const ephemeralKeyPair = new Ed25519Keypair();
        const ephemeralPrivateKeyB64 = ephemeralKeyPair.export().privateKey;


        const ephemeralPublicKey = ephemeralKeyPair.getPublicKey()
        const ephemeralPublicKeyB64 = ephemeralPublicKey.toBase64();

        const jwt_randomness = generateRandomness();
        const nonce = generateNonce(ephemeralPublicKey, maxEpoch, jwt_randomness);

        console.log("current epoch = " + epoch);
        console.log("maxEpoch = " + maxEpoch);
        console.log("jwt_randomness = " + jwt_randomness);
        console.log("ephemeral public key = " + ephemeralPublicKey);
        console.log("nonce = " + nonce);

        const userKeyData: UserKeyData = {
            randomness: jwt_randomness.toString(),
            nonce: nonce,
            ephemeralPublicKey: ephemeralPublicKeyB64,
            ephemeralPrivateKey: ephemeralPrivateKeyB64,
            maxEpoch: maxEpoch
        }

        this.storageEmulator.store['userKeyData'] = JSON.stringify(userKeyData);

        return userKeyData
    }

    getLocalStoragePropertyDescriptor(): any {
        const iframe = document.createElement('iframe');
        document.head.append(iframe);
        const pd = Object.getOwnPropertyDescriptor(iframe.contentWindow, 'localStorage');
        iframe.remove();
        return pd;
    }

    async generateAuthURL(service: any, guildId: any, scope: any) {
        const serviceData = SERVICES[service];
        if(!serviceData) throw new Error("Invalid service argument.");
        const serviceConstantsData = this.serviceConstants[service];
        if(!serviceConstantsData) throw new Error("No service constants found for service " + service + ". Did you forget to pass them to the constructor?");

        const state = generateRandomString();
        this.activePolling.push({
            service,
            guildId,
            state,
            expires: new Date(Date.now() + POLL_EXPIRY)
        })

        const userKeyData = await this.prepareLogin();
        
        const url = serviceData.authUrl
            .replace("{{CLIENT_ID}}", encodeURIComponent(serviceConstantsData.clientId))
            .replace("{{REDIR}}", encodeURIComponent(WEB_REDIRECT_URL))
            .replace("{{SCOPE}}", encodeURIComponent(scope))
            .replace("{{STATE}}", encodeURIComponent(state))
            .replace("{{NONCE}}", encodeURIComponent(userKeyData.nonce));
        console.log(url);
        return url;
    }

    async getAccessToken(service: any, guildId: any) {
        if(!this.onDataGet) throw new Error("No data handlers set. You likely forgot to call either useDefaultDataHandlers, useFirestoreDataHandlers, or setDataHandlers.");
        let data = await this.onDataGet(service, guildId);
        if(!data) return null;
        if(!data.accessToken || !data.expiryDate || data.expiryDate.getTime() - Date.now() <= 0) {
            if(!data.refreshToken) {
                console.error("Could not refresh token, as there is no saved refresh token.");
                return null;
            }
            await this.refreshToken(service, guildId, data.refreshToken);
            // data is now stale, re-fetch
            data = await this.onDataGet(service, guildId);
        }
        return data.accessToken;
    }

    async getAccessTokenExpiryDate(service: any, guildId: any) {
        if(!this.onDataGet) throw new Error("No data handlers set. You likely forgot to call either useDefaultDataHandlers, useFirestoreDataHandlers, or setDataHandlers.");
        let data = await this.onDataGet(service, guildId);
        if(!data) return null;
        if(!data.accessToken || !data.expiryDate) return null;
        return data.expiryDate;
    }

    async getRefreshToken(service: any, guildId: any) {
        if(!this.onDataGet) throw new Error("No data handlers set. You likely forgot to call either useDefaultDataHandlers, useFirestoreDataHandlers, or setDataHandlers.");
        let data = await this.onDataGet(service, guildId);
        if(!data) return null;
        if(!data.refreshToken) return null;
        return data.refreshToken;
    }


    setLinkedCallback(onLinked: any) {
        this.onLinked = onLinked;
    }
}
