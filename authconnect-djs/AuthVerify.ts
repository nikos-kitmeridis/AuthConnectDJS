import jwt_decode from "jwt-decode";
import {LoginResponse, PersistentData, UserKeyData} from "./UserInfo";

import {genAddressSeed, generateRandomness, getZkSignature, jwtToAddress, ZkSignatureInputs} from '@mysten/zklogin';
import axios from "axios";
import {toBigIntBE} from "bigint-buffer";
import {fromB64} from "@mysten/bcs";
import {useSui} from "./useSui";
import {SerializedSignature} from "@mysten/sui.js/src/cryptography";
import {Ed25519Keypair} from "@mysten/sui.js/keypairs/ed25519";
import {TransactionBlock} from '@mysten/sui.js/transactions';
import {SuiClient} from "@mysten/sui.js/client";
import StorageEmulator from "./StorageEmulator";

export default class AuthVerify {

    suiClient: SuiClient;
    userAddress: any;
    userSalt: any;
    txDigest: any;
    txInProgress: boolean;
    jwtEncoded: any;
    publicKey: any;
    userBalance: any;
    error: any;
    storageEmulator = StorageEmulator.Instance;

    constructor() {
        const {suiClient} = useSui();
        this.suiClient = suiClient;
        this.txInProgress = false;
    }


    async getSalt(subject: string, encodedJwt: string) {
        const dataRequest: PersistentData = {
            subject: subject,
            jwt: encodedJwt!
        }
        console.log("Subject = ", subject);
        const response = await axios.post('/api/userinfo/get/salt', dataRequest);
        console.log("getSalt response = ", response);
        if (response?.data.status == 200) {
            const userData: PersistentData = response.data.data as PersistentData;
            console.log("Salt fetched! Salt = ", userData.salt);
            return userData.salt;
        } else {
            console.log("Error Getting SALT");
            return null;
        }
    }

    storeUserKeyData(encodedJwt: string, subject: string, salt: string,) {
        const userKeyData: UserKeyData = JSON.parse(this.storageEmulator.store['userKeyData']!);
        const dataToStore: PersistentData = {
            ephemeralPublicKey: userKeyData.ephemeralPublicKey,
            jwt: encodedJwt,
            salt: salt,
            subject: subject
        };
        axios.post('/api/userinfo/store', dataToStore)
            .then((response) => {
                console.log("response = ", response);
            }).catch((error) => {
            console.log("error = ", error);
        });
    }

    printUsefulInfo(decodedJwt: LoginResponse, userKeyData: UserKeyData) {
        console.log("iat  = " + decodedJwt.iat);
        console.log("iss  = " + decodedJwt.iss);
        console.log("sub = " + decodedJwt.sub);
        console.log("aud = " + decodedJwt.aud);
        console.log("exp = " + decodedJwt.exp);
        console.log("nonce = " + decodedJwt.nonce);
        console.log("ephemeralPublicKey b64 =", userKeyData.ephemeralPublicKey);
    }


    async executeTransactionWithZKP(partialZkSignature :ZkSignatureInputs, ephemeralKeyPair: Ed25519Keypair, userKeyData: UserKeyData, decodedJwt: LoginResponse) {

        console.log("partialZkSignature = ", partialZkSignature);
        const txb = new TransactionBlock();

        //Just a simple Demo call to create a little NFT weapon :p
        txb.moveCall({
            target: `0xf8294cd69d69d867c5a187a60e7095711ba237fad6718ea371bf4fbafbc5bb4b::teotest::create_weapon`,  //demo package published on testnet
            arguments: [
                txb.pure("Zero Knowledge Proof Axe 9000"),  // weapon name
                txb.pure(66),  // weapon damage
            ],
        });
        txb.setSender(this.userAddress!);

        const signatureWithBytes = await txb.sign({client: this.suiClient, signer: ephemeralKeyPair});

        console.log("Got SignatureWithBytes = ", signatureWithBytes);
        console.log("maxEpoch = ", userKeyData.maxEpoch);
        console.log("userSignature = ", signatureWithBytes.signature);

        const addressSeed = genAddressSeed(BigInt(this.userSalt!), "sub", decodedJwt.sub, decodedJwt.aud);

        const zkSignature: SerializedSignature = getZkSignature({
            inputs: {
                ...partialZkSignature,
                addressSeed: addressSeed.toString(),
            },
            maxEpoch: userKeyData.maxEpoch,
            userSignature: signatureWithBytes.signature,
        });

        this.suiClient.executeTransactionBlock({
            transactionBlock: signatureWithBytes.bytes,
            signature: zkSignature,
            options: {
                showEffects: true
            }
        }).then((response) => {
            if (response.effects?.status.status) {
                console.log("Transaction executed! Digest = ", response.digest);
                this.txDigest = response.digest;
                this.txInProgress = false;
            } else {
                console.log("Transaction failed! reason = ", response.effects?.status)
                this.txInProgress = false;
            }
        }).catch((error) => {
            console.log("Error During Tx Execution. Details: ", error);
            this.txInProgress = false;
        });
    }

    async getZkProofAndExecuteTx() {
        this.txInProgress = true;
        const decodedJwt: LoginResponse = jwt_decode(this.jwtEncoded!) as LoginResponse;
        const {userKeyData, ephemeralKeyPair} =this.getEphemeralKeyPair();

        this.printUsefulInfo(decodedJwt, userKeyData);

        const ephemeralPublicKeyArray: Uint8Array = fromB64(userKeyData.ephemeralPublicKey);

        const zkpPayload =
            {
                jwt: this.jwtEncoded!,
                extendedEphemeralPublicKey: toBigIntBE(
                    Buffer.from(ephemeralPublicKeyArray),
                ).toString(),
                jwtRandomness: userKeyData.randomness,
                maxEpoch: userKeyData.maxEpoch,
                salt: this.userSalt,
                keyClaimName: "sub"
            };

        console.log("about to post zkpPayload = ", zkpPayload);
        this.publicKey = zkpPayload.extendedEphemeralPublicKey;

        //Invoking our custom backend to delagate Proof Request to Mysten backend.
        // Delegation was done to avoid CORS errors.
        //TODO: Store proof to avoid fetching it every time.
        const proofResponse = await axios.post('/api/zkp/get', zkpPayload);

        if(!proofResponse?.data?.zkp){
            this.createRuntimeError("Error getting Zero Knowledge Proof. Please check that Prover Service is running.");
            return;
        }
        console.log("zkp response = ", proofResponse.data.zkp);

        const partialZkSignature: ZkSignatureInputs = proofResponse.data.zkp as ZkSignatureInputs;

        await this.executeTransactionWithZKP(partialZkSignature, ephemeralKeyPair, userKeyData, decodedJwt);
    }


    getEphemeralKeyPair() {
        const userKeyData: UserKeyData = JSON.parse(this.storageEmulator.store['userKeyData']!);
        let ephemeralKeyPairArray = Uint8Array.from(Array.from(fromB64(userKeyData.ephemeralPrivateKey!)));
        const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(ephemeralKeyPairArray);
        return {userKeyData, ephemeralKeyPair};
    }

    async checkIfAddressHasBalance(address: string): Promise<boolean> {
        console.log("Checking whether address " + address + " has balance...");
        const coins = await this.suiClient.getCoins({
            owner: address,
        });
        //loop over coins
        let totalBalance = 0;
        for (const coin of coins.data) {
            totalBalance += parseInt(coin.balance);
        }
        totalBalance = totalBalance / 1000000000;  //Converting MIST to SUI
        this.userBalance = totalBalance;
        console.log("total balance = ", totalBalance);
        return totalBalance > 0;
    }

    async giveSomeTestCoins(address: string) {
        console.log("Giving some test coins to address " + address);
        this.txInProgress = true;
        let adminPrivateKeyArray = Uint8Array.from(Array.from(fromB64(process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY!)));
        const adminKeypair = Ed25519Keypair.fromSecretKey(adminPrivateKeyArray.slice(1));
        const tx = new TransactionBlock();
        const giftCoin = tx.splitCoins(tx.gas, [tx.pure(30000000)]);

        tx.transferObjects([giftCoin], tx.pure(address));

        const res = await this.suiClient.signAndExecuteTransactionBlock({
            transactionBlock: tx,
            signer: adminKeypair,
            requestType: "WaitForLocalExecution",
            options: {
                showEffects: true,
            },
        });
        const status = res?.effects?.status?.status;
        if (status === "success") 
            console.log("Gift Coin transfer executed! status = ", status);
            this.checkIfAddressHasBalance(address);
            this.txInProgress = false;
        
        if (status == "failure") {
            this.createRuntimeError("Gift Coin transfer Failed. Error = "+ res?.effects);
        }
    }

    async loadRequiredData(encodedJwt: string) {
        //Decoding JWT to get useful Info
        const decodedJwt: LoginResponse = jwt_decode(encodedJwt!) as LoginResponse;

        //Getting Salt
        const userSalt = await this.getSalt(decodedJwt.sub, encodedJwt);
        if(!userSalt){
            this.createRuntimeError("Error getting userSalt");
            return;
        }
        //Storing UserKeyData
        this.storeUserKeyData(encodedJwt!, decodedJwt.sub, userSalt!);

        //Generating User Address
        const address = jwtToAddress(encodedJwt!, BigInt(userSalt!));

        this.userAddress = address;
        this.userSalt = userSalt!;

        this.checkIfAddressHasBalance(address);

        console.log("All required data loaded. ZK Address =", address);
    }

    createRuntimeError(message: string) {
        this.error = message;
        console.log(message);
        this.txInProgress = false;
    }
}