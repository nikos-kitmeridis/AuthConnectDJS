import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js'
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-functions.js'

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAqT874VwH5zS2rx4G5ke935PNj_GszTww",
    authDomain: "authconnect-djs.firebaseapp.com",
    projectId: "authconnect-djs",
    storageBucket: "authconnect-djs.appspot.com",
    messagingSenderId: "343281822649",
    appId: "1:343281822649:web:bb368d8c8a215cd20de468"
};

async function onLoad() {
    const firebase = initializeApp(FIREBASE_CONFIG);
    const functions = getFunctions(firebase);

    const errorElem = document.getElementById("error");
    const successElem = document.getElementById("success");
    
    const urlParams = new URLSearchParams(window.location.search);
    const state = urlParams.get("state");
    const code = urlParams.get("code");
    
    if(!state) {
        errorElem.innerText = "Error: invalid state.";
        return;
    }
    if(!code) {
        errorElem.innerText = "Error: no auth code received.";
        return;
    }

    const createAuthResult = httpsCallable(functions, "createAuthResult");
    let res;
    try {
        res = await createAuthResult({state: state, code: code});
    } catch(e) {
        errorElem.innerText = "Error: " + e;
        return;
    }
    if(res.data && res.data.success) {
        successElem.innerText = "Success! You can now close this window.";
    }
}

window.onload = onLoad;
