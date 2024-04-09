<script>
  import { getContext } from 'svelte'
  import { relaunch } from '@tauri-apps/api/process'
  import { resetState } from "../../state/tabs_state"

  import GlobalSettings from './GlobalSettings.svelte'

  const { open } = getContext('simple-modal')

  function full_reset() {
    resetState()
    relaunch()
  }

  function restart() {
    relaunch()
  }

  function showSettings() {
    open(GlobalSettings)
  }
</script>

<span class="Button Button--normal Button--dark" on:click={showSettings} on:keypress={showSettings}>settings</span>
<span class="Button Button--normal Button--dark" on:click={restart} on:keypress={restart}>restart</span>
<span class="Button Button--normal Button--dark" on:click={full_reset} on:keypress={full_reset}>reset</span>

<style>
  .Button:not(:first-child) {
    margin-left: 10px;
  }
</style>