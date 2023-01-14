import AuthConnect from "../authconnect-djs/AuthConnect";

test("generateAuthUrl", async () => {
    const auth = new AuthConnect(null);
    const url = auth.generateAuthUrl("google", "guild123", "myClientId", "youtube");
    expect(url.replace(/state=.+$/, "")).toEqual("https://accounts.google.com/o/oauth2/v2/auth?client_id=myClientId&response_type=code&redirect_uri=https%3A%2F%2Fauthconnect-djs.web.app%2Fredir.html&scope=youtube&access_type=offline&");
});
