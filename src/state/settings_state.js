import Store from '@helpers/Store'
import { writable, get } from 'svelte/store'

/** @type {SettingsState} */
const initialState = {
  kucoin: {
    api_keys: '',
  }
}

export const settings_state = writable(structuredClone(initialState))

Store.getItem('settings_state').then(async (localState) => {
  try {
    localState = JSON.parse(localState)

    if (
      (typeof localState === 'object' && !Array.isArray(localState) && localState !== null) // checking if it's an object
    ) { /* good to go */ } else {
      resetState()
    }

    settings_state.update(() => localState)
  } catch {
    resetState()
  }
})

/**
 * This callback is displayed as a global member.
 * @callback updateStateCallback
 * @param {SettingsState} state
 * @return {SettingsState}
 */
/** @param {updateStateCallback} callback */
export const updateState = (callback) => {
  const updatedState = callback(get(settings_state)) || structuredClone(initialState)
  settings_state.update(() => updatedState)
  Store.setItem('settings_state', JSON.stringify(updatedState))
}

export const resetState = () => {
  Store.setItem('settings_state', JSON.stringify(initialState))
  settings_state.update(() => structuredClone(initialState))
}