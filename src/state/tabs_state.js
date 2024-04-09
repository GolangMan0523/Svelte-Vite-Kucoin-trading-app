import Store from '@helpers/Store'
import { writable, get } from 'svelte/store'

/** @type {TabsState} */
const initialState = {
  isLoading: false,
  activeTab: null,
  tabs: [],
}

export const tabs_state = writable(structuredClone({...initialState, isLoading: true}))

Store.getItem('tabs_state').then(async (jsonstr) => {
  try {
    /** @type {TabsState} */
    const saved_state = JSON.parse(jsonstr)

    if (
      (typeof saved_state === 'object' && !Array.isArray(saved_state) && saved_state !== null) && // checking if it's an object
      (saved_state.activeTab === null || typeof saved_state.activeTab === 'number') && // checking activeTab
      (Array.isArray(saved_state.tabs)) // checking tabs
    ) { /* good to go */ } else {
      resetState()
    }

    // we want to remove these closed tabs.
    saved_state.activeTab = 0
    saved_state.tabs = saved_state.tabs.filter((tab) => !tab.isDestroyed)
    tabs_state.update(() => saved_state)
  } catch {
    resetState()
  }
})

/**
 * This callback is displayed as a global member.
 * @callback updateStateCallback
 * @param {TabsState} state
 * @return {TabsState}
 */
/** @param {updateStateCallback} callback */
export const updateState = (callback, saveless = false) => {
  const updatedState = callback(get(tabs_state)) || structuredClone(initialState)
  tabs_state.update(() => updatedState)

  if (!saveless) {
    Store.setItem('tabs_state', JSON.stringify(updatedState))
  }
}

export const resetState = () => {
  Store.setItem('tabs_state', JSON.stringify(initialState))
  tabs_state.update(() => structuredClone(initialState))
}