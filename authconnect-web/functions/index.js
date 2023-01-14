const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.database();

exports.pollForAuthResult = functions.https.onCall(async (data, context) => {
    const state = data.state;
    if(state.includes("/")) return {error: "Invalid state"};

    let snap;
    try {
        snap = await db.ref("authResults/" + state).get();
    } catch(e) {
        return {error: "Error getting auth result: " + e};
    }
    const val = snap.val();
    if(!val) {
        return {error: "No auth result found"};
    }
    return { code: snap.val().code };
});

exports.createAuthResult = functions.https.onCall(async (data, context) => {
    const state = data.state;
    if(state.includes("/")) return {error: "Invalid state"};
    const code = data.code;

    await db.ref("authResults/" + state).set({
        code: code
    });
    return {success: true};
});