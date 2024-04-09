<script>
  import { formatTime } from '@src/helpers/helpers'
  import { global_state } from '@state/global_state'
  import getKC from '@src/library/kucoin-api/kucoin'
  import Notificatoins from '@src/helpers/Notifications';

  /** @type {TerminalState} */
  export let state

  async function cancel(e) { 
    const id = e.target.closest('[data-id]').getAttribute('data-id')
    
    if (state.isKucoin) {
      const operation_result = await (await getKC()).cancelOrder({id})
      Notificatoins.show({ text: operation_result?.data?.cancelledOrderIds?.length ? `✅ Order is cancelled` : `❌ Cancel failed`})
    }
  }
</script>

<div class="active-orders">
  <div class="active-orders__inner">
    <div class="active-orders__head">
      <div class="col__time">Time</div>
      <div class="col__token">Token</div>
      <div class="col__side">Side</div>
      <div class="col__price">Price</div>
      <div class="col__amount">Amount</div>
      <div class="col__filled">Filled</div>
      <div class="col__actions"></div>
    </div>

    {#each $global_state.kucoin.activeOrders as order}
    <div class="active-order" class:is-sell={order.isSell} data-id={order.id}>
      <div class="col__time">{formatTime(order.createdAt)}</div>
      <div class="col__token">{order.token}</div>
      <div class="col__side">{order.isSell ? 'Sell' : 'Buy'}</div>
      <div class="col__price">{order.price}</div>
      <div class="col__amount">{order.size}</div>
      <div class="col__filled">{order.dealSize}</div>
      <div class="col__actions">
        <span class="cancel-button" on:click={cancel} on:keydown={cancel}>Cancel</span>
      </div>
    </div>
    {/each}
  </div>
</div>

<style lang="scss">
  @import "../../../sass/variables.scss";

  .active-orders {
    background-color: #121212;
    font-weight: 500;
    font-size: 14px;
    color: $grey;

    &__inner {
      overflow-y: auto;
    }
  }

  .active-order, .active-orders__head {
    display: flex;
    align-items: center;
    padding: 10px;
  }

  .col {
    &__time {
      width: 10%;
      min-width: 80px;
    }

    &__token {
      width: 10%;
      min-width: 80px;
    }

    &__side {
      width: 10%;
      min-width: 60px;
    }

    &__price {
      width: 20%;
      min-width: 100px;
    }
    
    &__amount {
      width: 20%;
      min-width: 100px;
    }

    &__filled {
      width: 20%;
    }

    &__actions {
      width: 10%;
      text-align: center;
    }
  }

  .active-order {
    .col__side {
      color: $green;
    }

    &.is-sell {
      .col__side {
        color: $red;
      }
    }
  }

  .cancel-button {
    cursor: pointer;
    padding: 10px;

    &:hover {
      color: $white;
    }
  }

  .active-orders__head {
    font-weight: 700;
    border-bottom: 1px solid $main_borders_color;
  }
</style>