<script>
  import { getDefaultTerminalState } from './Terminal/terminal.fn'
  import { updateState as tabs_state__update } from '../state/tabs_state'

  export let isActivePage = false

  function setPage(e) {
    const name = e.target.closest('[data-name]').getAttribute('data-name')
    const componentName = e.target.closest('[data-component-name]').getAttribute('data-component-name')

    // this is fucking bad lol. i need to extract Tabs class from App and not dublicate logic here
    // but i just copied it like that long ago so whatever for now
    tabs_state__update((state) => {
      /** @type {TabsState_Tab} */
      const tab = {
        title: '',
        name,
        isDestroyed: false,
        componentName,
      }

      switch (componentName) {
        case 'Terminal':
          tab.title = 'Terminal'
          tab.componentState = getDefaultTerminalState()
          break;
      
        default:
          break;
      }

      state.tabs[state.activeTab] = tab

      return state
    })
  }
</script>

{#if isActivePage}
<div class="PagesList">
  <div class="PagesList__item terminal" data-name="Terminal" data-component-name="Terminal" on:click={setPage} on:keyup={setPage}>
    <div class="PagesList__item_icon">
      <svg viewBox="0 0 14 14" role="img" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path fill="#3f51b5" d="M4.33333336 2.33333338l4.66666662 2.33333331 3.99999996-3.66666663v10.33333323H1.00000006V7.33333333z"/><path fill="#00bcd4" d="M4.33333336 7l4.66666662.66666666 3.99999996-2.99999997v8.33333325H1.00000006v-3.3333333z"/></svg>
    </div>
    <div class="PagesList__item_name">Terminal</div>
  </div>
</div>
{/if}

<style lang="scss">
  .PagesList {
    padding: 30px 55px;

    &__item {
      cursor: pointer;
      padding: 10px;
      display: flex;
      align-items: center;

      &_icon {
        border-radius: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      &_name {
        font-family: "Roboto Medium";
        font-size: 18px;
        margin-left: 10px;
      }
    }
  }

  .terminal .PagesList__item_icon {
    background-color: white;
    width: 40px;
    height: 40px;

    svg {
      width: 30px;
      height: 30px;
    }
  }
</style>
