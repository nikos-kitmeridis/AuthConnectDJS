export default class StorageEmulator {

    private static _instance: StorageEmulator;
    store: Record<string, any>

    public static get Instance()
    {
        // Do you need arguments? Make it a regular static method instead.
        return this._instance || (this._instance = new this());
    }

    private constructor() {
        this.store = { 'userKeyData': {}}
    }
}