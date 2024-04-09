<script>
  import { abbreviateNumber, formatTime } from "@helpers/helpers"
  import { getPrecisePrice, getPreciseQuanity } from "@helpers/trading"
  import { updateState } from '@src/state/tabs_state'
  import { fix_form } from "../terminal.fn"

  /** @type {TerminalState} */
  export let state

  function selectPrice(e) {
    fix_form({state, sell_side: true, on_input: {
      value: e.target.closest('[data-price]').getAttribute('data-price'),
      type: 'price',
    }})
    fix_form({state, sell_side: false, on_input: {
      value: e.target.closest('[data-price]').getAttribute('data-price'),
      type: 'price',
    }})
    updateState(_state => _state, true)
  }
</script>

<div class="last-trades">
  {#each state.last_trades.trades as trade}
  <div class="last-trades__entry" data-price={trade.price} class:is-sell={trade.isSell} on:click={selectPrice} on:keydown={selectPrice}>
    <span class="last-trades__price">{getPrecisePrice({token: state.token, price: trade.price})}</span>
    <span class="last-trades__size">{trade.size > 1000 ? abbreviateNumber(trade.size) : getPreciseQuanity({token: state.token, size: trade.size})}</span>
    <span class="last-trades__value">{abbreviateNumber(trade.size * trade.price)}<span class="dollar">$</span></span>
    <span class="last-trades__time">{formatTime(trade.timestamp)}</span>
  </div>
  {/each}
</div>

<style lang="scss">
  @import "../../../sass/variables.scss";

  .last-trades {
    width: 50%;
    min-width: 50%;
    max-width: 50%;
    overflow-y: auto;
    background-color: #121212;
    font-weight: 500;
    font-size: 14px;

    &__entry {
      display: flex;
      padding: 0 10px;
      cursor: pointer;

      &.is-sell {
        .last-trades__price {
          color: $red;
        }
      }

      &:first-child {
        padding-top: 10px;
      }
      
      &:last-child {
        padding-bottom: 10px;
      }

      &:hover {
        background-color: lighten($color: #121212, $amount: 4);
      }
    }

    &__price {
      width: 30%;
      color: $green;
    }
    
    &__size {
      width: 30%;
    }
    
    &__value {
      width: 20%;

      .dollar {
        padding-left: 2px;
      }
    }

    &__time {
      width: 20%;
      text-align: right;
    }
  }
</style>