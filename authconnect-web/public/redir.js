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
    document.getElementById("about").onclick = () => {
        const textElem = document.getElementById("about-explainer");
        textElem.style.display = textElem.style.display === "block" ? "none" : "block";
    }

    const firebase = initializeApp(FIREBASE_CONFIG);
    const functions = getFunctions(firebase);

    const errorElem = document.getElementById("error");
    const successElem = document.getElementById("success");
    const loadingElem = document.getElementById("loading");

    function displayError(text) {
        loadingElem.innerText = "";
        errorElem.innerText = text;
    }
    function displaySuccess(text) {
        loadingElem.innerText = "";
        successElem.innerText = text;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const state = urlParams.get("state");
    const code = urlParams.get("code");
    
    if(!state) {
        displayError("Error: invalid state.");
        return;
    }
    if(!code) {
        displayError("Error: no auth code received.");
        return;
    }

    const createAuthResult = httpsCallable(functions, "createAuthResult");
    let res;
    try {
        res = await createAuthResult({state: state, code: code});
    } catch(e) {
        displayError("Error: " + e);
        return;
    }
    if(res.data && res.data.success) {
        displaySuccess("Success! You can now return to Discord.");
    }
}

window.onload = onLoad;
