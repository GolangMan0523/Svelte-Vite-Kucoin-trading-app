<script>
  import { settings_state, updateState } from '@state/settings_state.js'

  function saveState() {
    updateState(_state => _state)
  }
</script>

<div class="Modal">
  <div class="Modal__header">Settings</div>

  <div class="Form">
    <div class="Form__row">
      <div class="Form__col">
        <div class="Form__entity">
          <div class="Form__label">Kucoin API Keys</div>
          <input class="Input Input--dark" type="password" bind:value={$settings_state.kucoin.api_keys} on:input={saveState}>
          <div class="Form__note">Format: xxxx|xxxx-xxxx-xxxx-xxxx-xxxx|xxxx. Need to press the restart button after this.</div>
        </div>
      </div>
    </div>
  </div>
</div>