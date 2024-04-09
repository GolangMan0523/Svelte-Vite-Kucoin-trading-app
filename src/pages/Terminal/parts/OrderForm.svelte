<script>
  import { trade } from "@helpers/trading"
  import Notificatoins from "@src/helpers/Notifications"
  import { global_state } from '@state/global_state'
  import { fix_form } from "../terminal.fn";
  import { updateState } from "@src/state/tabs_state";

  /** @type {TerminalState} */
  export let state

  function toggle_type(e) {
    if (e.target.classList.contains('is-active')) return;
    state.form.limit_type = !state.form.limit_type
  }

  async function process_form(e) {
    const isSell = e.target.hasAttribute('data-is-sell')

    const payload = {token: state.token, isSell, isLimit: state.form.limit_type, isKucoin: true}

    if (state.form.limit_type) {
      payload.size = isSell ? state.form.limit_sell_qty : state.form.limit_buy_qty
      payload.price = isSell ? state.form.limit_sell_price : state.form.limit_buy_price
    } else {
      if (isSell) {
        payload.size = state.form.market_sell_qty
      } else {
        payload.funds = state.form.market_buy_qty.toFixed(1)
      }
    }

    const trade_result = await trade(payload)

    Notificatoins.show({ text: trade_result.ok ? `✅ Order accepted` : `❌ Order rejected: ${trade_result.reason}` })
  }

  function on_input(e) {
    const sell_side = e.target.closest('[data-sell-side]')
    const _ = e.target.getAttribute('data-field-name').split('_')

    if (e.target.value.length) {
      if (!isNaN(e.target.valueAsNumber)) {
        fix_form({state, sell_side, on_input: {
          value: e.target.valueAsNumber || null,
          type: _[_.length - 1],
        }})
        updateState(_state => _state)
      }
    } else {
      fix_form({state, sell_side, on_input: {
        value: null,
        type: _[_.length - 1],
      }})
      updateState(_state => _state)
    }
  }

  function on_size_button(e) {
    const percent = Number(e.target.innerText.trim())
    const sell_side = e.target.closest('[data-sell-side]')

    fix_form({state, sell_side, on_percent: percent})
    updateState(_state => _state)
  }
</script>

<div class="order-form">
  <div class="order-form__switches">
    <div class="order-form__switch" class:is-active={state.form.limit_type} on:click={toggle_type} on:keydown={toggle_type}>Limit</div>
    <div class="order-form__switch" class:is-active={!state.form.limit_type} on:click={toggle_type} on:keydown={toggle_type}>Market</div>
  </div>

  <div class="Form">
    <div class="Form__row available-row">
      <div class="Form__col">
        <div class="Form__entity">
          <div class="available-row__row">
            <span class="available-row__word">Available</span>
            <span class="available-row__value">{$global_state.kucoin.balance.spot.USDT?.available || 0} USDT</span>
          </div>
        </div>
      </div>

      <div class="Form__col" style="margin-left: 5px;" data-sell-side>
        <div class="Form__entity">
          <div class="available-row__row">
            <span class="available-row__word">Available</span>
            <span class="available-row__value">
              {$global_state.kucoin.balance.spot[state.token]?.available || 0} {state.token}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="Form__row">
      <div class="Form__col">
        <div class="Form__entity">
          {#if state.form.limit_type}
            <input class="Input Input--black" type="number" placeholder="Price" data-field-name="limit_buy_price" value={state.form.limit_buy_price} on:input={on_input}>
          {:else}
            <input class="Input Input--black" type="number" disabled placeholder="Ø">
          {/if}
        </div>
      </div>
      
      <div class="Form__col" style="margin-left: 5px;" data-sell-side>
        <div class="Form__entity">
          {#if state.form.limit_type}
            <input class="Input Input--black" type="number" placeholder="Price" data-field-name="limit_sell_price" value={state.form.limit_sell_price} on:input={on_input}>
          {:else}
            <input class="Input Input--black" type="number" disabled placeholder="Ø">
          {/if}
        </div>
      </div>
    </div>

    <div class="Form__row">
      <div class="Form__col">
        <div class="Form__entity">
          {#if state.form.limit_type}
            <input class="Input Input--black" type="number" placeholder={`Quantity of ${state.token}`} data-field-name="limit_buy_qty" value={state.form.limit_buy_qty} on:input={on_input}>
          {:else}
            <input class="Input Input--black" type="number" placeholder="Amount of USDT" data-field-name="market_buy_qty" value={state.form.market_buy_qty} on:input={on_input}>
          {/if}
        </div>
      </div>

      <div class="Form__col" style="margin-left: 5px;" data-sell-side>
        <div class="Form__entity">
          {#if state.form.limit_type}
            <input class="Input Input--black" type="number" placeholder={`Quantity of ${state.token}`} data-field-name="limit_sell_qty" value={state.form.limit_sell_qty} on:input={on_input}>
          {:else}
            <input class="Input Input--black" type="number" placeholder={`Quantity of ${state.token}`} data-field-name="market_sell_qty" value={state.form.market_sell_qty} on:input={on_input}>
          {/if}
        </div>
      </div>
    </div>

    <div class="Form__row">
      <div class="Form__col">
        <div class="Form__entity size-buttons">
          <div class="Button Button--bold Button--dark" on:click={on_size_button} on:keydown={on_size_button}>10</div>
          <div class="Button Button--bold Button--dark" on:click={on_size_button} on:keydown={on_size_button}>25</div>
          <div class="Button Button--bold Button--dark" on:click={on_size_button} on:keydown={on_size_button}>50</div>
          <div class="Button Button--bold Button--dark" on:click={on_size_button} on:keydown={on_size_button}>100</div>
        </div>
      </div>

      <div class="Form__col" style="margin-left: 5px;" data-sell-side>
        <div class="Form__entity size-buttons">
          <div class="Button Button--bold Button--dark" on:click={on_size_button} on:keydown={on_size_button}>10</div>
          <div class="Button Button--bold Button--dark" on:click={on_size_button} on:keydown={on_size_button}>25</div>
          <div class="Button Button--bold Button--dark" on:click={on_size_button} on:keydown={on_size_button}>50</div>
          <div class="Button Button--bold Button--dark" on:click={on_size_button} on:keydown={on_size_button}>100</div>
        </div>
      </div>
    </div>

    {#if state.form.limit_type}
    <div class="Form__row">
      <div class="Form__col">
        <div class="Form__entity">
          <input class="Input Input--black" type="number" placeholder="Amount of USDT" data-field-name="limit_buy_value" value={state.form.limit_buy_value} on:input={on_input}>
        </div>
      </div>

      <div class="Form__col" style="margin-left: 5px;" data-sell-side>
        <div class="Form__entity">
          <input class="Input Input--black" type="number" placeholder="Amount of USDT" data-field-name="limit_sell_value" value={state.form.limit_sell_value} on:input={on_input}>
        </div>
      </div>
    </div>
    {/if}

    <div class="Form__row">
      <div class="Form__col">
        <div class="Form__entity">
          <div class="Button Button--bold Button--green" on:click={process_form} on:keydown={process_form}>Buy</div>
        </div>
      </div>

      <div class="Form__col" style="margin-left: 5px;" data-sell-side>
        <div class="Form__entity">
          <div class="Button Button--bold Button--red" data-is-sell on:click={process_form} on:keydown={process_form}>Sell</div>
        </div>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  @import "../../../sass/variables.scss";

  .order-form {
    &__switches {
      display: flex;
    }

    &__switch {
      font-weight: 700;
      padding: 10px;
      font-size: 14px;
      line-height: 16px;
      color: $grey;

      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;

      &:last-child {
        padding-left: 5px;
      }

      &.is-active {
        color: $white;
        cursor: default;
      }
    }

    .Form {
      margin: 10px;
      margin-top: 0;

      &__row {
        &:not(:last-child) {
          margin-bottom: 5px;
        }
      }
    }

    .size-buttons {
      display: flex;
      flex-direction: row;

      .Button {
        flex: 20%;
        margin-right: 5px;

        &:last-child {
          margin-right: 0;
        }
      }
    }
  }

  .available-row {
    &__row {
      display: flex;
      font-weight: 700;
      font-size: 14px;
    }

    &__word {
      color: $grey;
    }

    &__value {
      color: $white;
      margin-left: auto;
    }
  }
</style>