<script>
  import Select from 'svelte-select'
  import { createEventDispatcher, onMount } from 'svelte'
    import { symbolDetails } from '@src/config/kucoin';

  /** @type {TerminalState} */
  export let state

  const dispatch = createEventDispatcher()

  let focused = false
  let listOpen = false
  let select_items = Object.keys(symbolDetails)

  let not_reactive_token = state.token
  onMount(() => {
    if (!state.token) {
      listOpen = true
      setTimeout(() => {
        focused = true
      }, 100)
    }
  })

  function select_changed(e) {
    const token = e.detail.value

    dispatch('pairChanged', { token })
  }
</script>

<div class="pair-selection">
  <Select class="this_fucking_select" {focused} {listOpen} items={select_items} value={not_reactive_token} clearable={false} on:change={select_changed} placeholder={"Token name"}></Select>
</div>

<style lang="scss">
  @import "../../../sass/variables.scss";

  .pair-selection {
    z-index: 3;
    position: absolute;
    top: 5px;
    left: 5px;
    display: flex;
    width: 100px;
    height: 34px;
  }

  // fucking select lol)))
  :root {
    --background: rgba(243, 243, 243, 0.04);
    --border-hover: none;
    --border: none;
    --border-focused: none;
    --selected-item-color: rgba(243, 243, 243, 0.4);
    --width: 100px;
    --height: 25px;
    --padding: 0px;
    --input-padding: 0 10px;
    --item-padding: 0 13px;
    --font-size: 14px;
    --list-background: #2e2b2b;
    --item-hover-bg: #423c3c;
  }

  :global(.this_fucking_select .selected-item) {
    padding: 0px !important;
    text-align: center !important;
    // width: 100% !important;
  }
  :global(.this_fucking_select .value-container) {
    text-align: center !important;
    justify-content: center !important;
  }
</style>