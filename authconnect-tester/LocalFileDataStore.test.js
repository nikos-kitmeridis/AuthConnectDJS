import LocalFileDataStore from "../authconnect-djs/datastores/LocalFileDataStore";
import fs from "fs";

beforeEach(() => {
    if(fs.existsSync("./auth-data.json"))
        fs.unlinkSync("./auth-data.json");
});

test("constructor", async () => {
    const dataStore = new LocalFileDataStore("./auth-data.json");
    await dataStore.initializeFile();
    const fileData = fs.readFileSync("./auth-data.json", {encoding: "utf-8"});
    expect(JSON.parse(fileData)).toEqual({});
});

test("save data", async () => {
    const dataStore = new LocalFileDataStore("./auth-data.json");
    await dataStore.initializeFile();

    await dataStore.onDataUpdate("google", "12345", {
        refreshToken: "abc",
        accessToken: "xyz",
        expiryDate: new Date("2000-01-01T00:00:00.000Z")
    });

    const fileData = fs.readFileSync("./auth-data.json", {encoding: "utf-8"});
    expect(JSON.parse(fileData)).toEqual({
        "12345": {
            "google": {
                "refreshToken": "abc",
                "accessToken": "xyz",
                "expiryDate": "2000-01-01T00:00:00.000Z"
            }
        }
    });
});

test("get data", async () => {
    const dataStore = new LocalFileDataStore("./auth-data.json");
    await dataStore.initializeFile();

    const date = new Date("2000-01-01T00:00:00.000Z");

    await dataStore.onDataUpdate("google", "12345", {
        refreshToken: "abc",
        accessToken: "xyz",
        expiryDate: date
    });

    expect((await dataStore.onDataGet("google", "12345")).accessToken).toEqual("xyz");
    expect((await dataStore.onDataGet("google", "12345")).expiryDate).toEqual(date);


    const dataStore2 = new LocalFileDataStore("./auth-data.json");
    await dataStore2.initializeFile();

    expect((await dataStore2.onDataGet("google", "12345")).accessToken).toEqual("xyz");
    expect((await dataStore2.onDataGet("google", "12345")).expiryDate).toEqual(date);
});
