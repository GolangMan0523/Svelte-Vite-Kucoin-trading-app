import { Store as _Store } from "tauri-plugin-store-api"

const store = new _Store(`.local_store.dat`)

export default class Store {
  static async getItem(name) {
    return await store.get(name)
  }

  static async setItem(name, value) {
    await store.set(name, value)
    await store.save()
  }
}