<script>
  // @ts-nocheck

  import { fly } from 'svelte/transition'
  import { tooltip } from '@helpers/tooltip'
  import Modal from 'svelte-simple-modal'
  import { relaunch } from '@tauri-apps/api/process'  
  import Terminal from '@pages/Terminal/Terminal.svelte'
  import PageSelector from '@pages/PageSelector.svelte'
  import HeaderButtons from '@lib/Layout/HeaderButtons.svelte'

  import { tabs_state, updateState as tabs_state__update } from './state/tabs_state'
  import { loadBalance, loadOrders, subscribeOrders, subscribeBalance, getDefaultTerminalState } from './pages/Terminal/terminal.fn'
  
  /** @type {TabsState_Tab}*/
  let activeComponent
  const components = {
    'Select a page': PageSelector,
    'Terminal': Terminal,
  }

  class Tabs {
    /** @type Partial<import('tippy.js').Props> */
    static tooltipConfig = {
      content: (reference) => reference.querySelector('.Header__tab_remove'),
      interactive: true,
      placement: 'bottom',
      delay: [50, 150],
    }

    static newTab() {
      tabs_state__update((state) => {
        state.activeTab = state.tabs.length
        // state.tabs.push({
        //   title: 'Page selector #' + (state.tabs.length + 1),
        //   name: 'Select a page',
        //   isDestroyed: false,
        //   componentName: 'PageSelector',
        //   componentState: {},
        // })
        state.tabs.push({
          title: 'Terminal',
          name: 'Terminal',
          isDestroyed: false,
          componentName: 'Terminal',
          componentState: getDefaultTerminalState(),
        })
        return state
      })
    }

    static switchTab(EventOrNumber) {
      tabs_state__update((state) => {
        let newActiveTab = state.activeTab

        const via_keyboard = typeof EventOrNumber === 'number'

        if (via_keyboard) {
          newActiveTab = EventOrNumber - 1
        } else {
          newActiveTab = Number(EventOrNumber.target.closest('[data-idx]').getAttribute('data-idx'))
        }

        // Because isDestroyed made things compicated... it might be #2 on keyboard, but on the list, it whatever, because of destroyed oneste
        if (via_keyboard) {
          const avive_tabs = state.tabs.filter((tab) => !tab.isDestroyed)

          const selected_tab = avive_tabs[newActiveTab]
          if (selected_tab) {
            state.tabs.forEach((tab, i) => {
              if (tab === selected_tab) {
                newActiveTab = i
              }
            })
          } else {
            if (newActiveTab + 1 > avive_tabs.length) {
              return state
            }
          }
        } else {
          if (newActiveTab + 1 > state.tabs.length) {
            newActiveTab = state.tabs.length - 1 < 0 ? null : state.tabs.length - 1
          }
        }

        state.activeTab = newActiveTab
        
        return state
      }, true)
    }

    static removeTab(e) {
      tabs_state__update((state) => {
        const idx = Number(e.target.closest('[data-idx]').getAttribute('data-idx'))

        state.tabs.find((_, i) => i === idx).isDestroyed = true

        if (idx === state.activeTab) {
          let first_alive_tab = 0
          state.tabs.forEach((tab, i) => {
            if (!tab.isDestroyed && !first_alive_tab) {
              first_alive_tab = i
            }
          })
          state.activeTab = first_alive_tab
        }

        return state
      })
    }

    static initKeyBindings() {
      document.addEventListener("keydown", function(event) {
        if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey) {
          switch (event.key) {
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
              Tabs.switchTab(Number(event.key))
              break;
            case "t":
              Tabs.newTab()
              break;
            case "r":
              relaunch()
              break;
          }
        }
      })
    }
  }

  Tabs.initKeyBindings()

  tabs_state.subscribe((new_state) => {
    activeComponent = new_state.tabs[new_state.activeTab]
  })

  loadOrders()
  loadBalance()

  subscribeOrders()
  subscribeBalance()
</script>

<Modal
  closeButton={false}
  styleWindow={{ backgroundColor: '#30314d' }}
  transitionBg={fly}
>
  <header class="Header">
    <div class="Header__logo">
      <img src="logo.webp" class="Header__logo_img" alt="">
    </div>

    <div class="Header__tabs">
      {#each $tabs_state.tabs as tab, idx}
        {#if !tab.isDestroyed}
        <div class="Header__tab" class:Header__tab--active={idx === $tabs_state.activeTab} class:Header__tab--last={idx === $tabs_state.tabs.length - 1}
          data-idx={idx} on:click={Tabs.switchTab} on:keypress={Tabs.switchTab}
          use:tooltip={Tabs.tooltipConfig}
        >
          <span>{tab.title}</span>
          <div class="Header__tab_remove" data-idx={idx} on:click={Tabs.removeTab} on:keypress={Tabs.removeTab}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="style=bulk"><g id="close"><path d="M1.25 7.25C1.25 3.93629 3.93629 1.25 7.25 1.25H16.75C20.0637 1.25 22.75 3.93629 22.75 7.25V16.75C22.75 20.0637 20.0637 22.75 16.75 22.75H7.25C3.93629 22.75 1.25 20.0637 1.25 16.75V7.25Z" fill="#df3333"/><path fill-rule="evenodd" clip-rule="evenodd" d="M7.18298 7.18298C7.42696 6.93901 7.82253 6.93901 8.06651 7.18298L16.817 15.9335C17.061 16.1775 17.061 16.573 16.817 16.817C16.573 17.061 16.1775 17.061 15.9335 16.817L7.18298 8.06651C6.93901 7.82253 6.93901 7.42696 7.18298 7.18298Z" fill="#f6f6f6"/><path fill-rule="evenodd" clip-rule="evenodd" d="M16.817 7.18299C17.061 7.42697 17.061 7.82254 16.817 8.06652L8.0665 16.817C7.82252 17.061 7.42695 17.061 7.18298 16.817C6.939 16.573 6.93901 16.1775 7.18299 15.9335L15.9335 7.18298C16.1775 6.939 16.573 6.93901 16.817 7.18299Z" fill="#f6f6f6"/></g></g></svg>
          </div>
        </div>
        {/if}
      {/each}

      <div class="Header__tab Header__tab_new" on:click={Tabs.newTab} on:keypress={Tabs.newTab}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="style=bulk"><g id="add-box"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.25 8C1.25 4.27208 4.27208 1.25 8 1.25H16C19.7279 1.25 22.75 4.27208 22.75 8V16C22.75 19.7279 19.7279 22.75 16 22.75H8C4.27208 22.75 1.25 19.7279 1.25 16V8Z" fill="#af6cff75"/><path fill-rule="evenodd" clip-rule="evenodd" d="M12 7.00744C12.4142 7.00744 12.75 7.34323 12.75 7.75744L12.75 16.2427C12.75 16.6569 12.4142 16.9927 12 16.9927C11.5857 16.9927 11.25 16.6569 11.25 16.2427L11.25 7.75743C11.25 7.34322 11.5858 7.00744 12 7.00744Z" fill="#f6f6f6"/><path fill-rule="evenodd" clip-rule="evenodd" d="M17 12C17 12.4142 16.6642 12.75 16.25 12.75L7.76476 12.75C7.35055 12.75 7.01476 12.4142 7.01476 12C7.01477 11.5857 7.35055 11.25 7.76477 11.25L16.25 11.25C16.6642 11.25 17 11.5858 17 12Z" fill="#f6f6f6"/></g></g></svg>
      </div>
    </div>
    <div class="Header__actions">
      <HeaderButtons />
    </div>
  </header>

  <main>
    {#each $tabs_state.tabs as tab}
      {#if !tab.isDestroyed}
        <svelte:component this={components[tab.name]} {tab} state={tab.componentState} isActivePage={tab === activeComponent} />
      {/if}
    {/each}
  </main>
</Modal>

<style lang="scss">
  .Header {
    display: flex;
    padding: 0 10px;
    outline: 1px solid #242424;

    &__logo {
      display: flex;
      align-items: center;
      padding: 4px 5px;
      margin-right: 10px;

      &_img {
        width: 39px;
        border-radius: 25px;
      }
    }

    &__tabs {
      flex: 1;
      display: flex;
      align-items: center;
    }

    &__tab {
      $tab: &;
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0em 1.2em;
      user-select: none;

      border: none;
      border-right: 1px solid #121212;
      background-color: #0f0f0f98;
      color: inherit;
      font-family: inherit;
      font-size: 0.85em;
      font-weight: 500;
      cursor: pointer;
      margin-bottom: 1px;
      transition: background-color 0.25s;

      &_new {
        margin-left: 7px;
        background-color: transparent;
        border: none;
        width: 22px;
        height: 22px;
        padding: 0;

        svg {
          width: 22px;
          height: 22px;
        }

        &:hover {
          background-color: transparent !important; // lol
        }
      }

      &_remove {
        display: flex;
        cursor: pointer;

        svg {
          width: 22px;
          height: 22px;
        }
      }

      &--active {
        cursor: auto;
        margin-bottom: 0;
        border-bottom: 1px solid red;
      }
      
      &--last {
        border-right: none;
      }

      &:not(.Header__tab--active):hover {
        background-color: #242424;
      }
    }

    &__actions {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
</style>