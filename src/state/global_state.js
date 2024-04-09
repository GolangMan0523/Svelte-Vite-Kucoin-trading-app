import Store from '@helpers/Store'
import { writable, get } from 'svelte/store'

/** @type {GlobalState} */
const initialState = {
  kucoin: {
    activeOrders: [],
    balance: {
      spot: {},
      funding: {},
    }
  }
}

export const global_state = writable(structuredClone(initialState))

Store.getItem('global_state').then(async (localState) => {
  try {
    localState = JSON.parse(localState)

    if (
      (typeof localState === 'object' && !Array.isArray(localState) && localState !== null) // checking if it's an object
    ) { /* good to go */ } else {
      resetGlobalState()
    }

    global_state.update(() => localState)
  } catch {
    resetGlobalState()
  }
})

/**
 * This callback is displayed as a global member.
 * @callback updateStateCallback
 * @param {GlobalState} state
 * @return {GlobalState}
 */
/** @param {updateStateCallback} callback */
export const updateGlobalState = (callback) => {
  const updatedState = callback(get(global_state)) || structuredClone(initialState)
  global_state.update(() => updatedState)
  Store.setItem('global_state', JSON.stringify(updatedState))
}

export const resetGlobalState = () => {
  Store.setItem('global_state', JSON.stringify(initialState))
  global_state.update(() => structuredClone(initialState))
}