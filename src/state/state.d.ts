interface SettingsState {
  kucoin: {
    api_keys: string;
  }
}

interface TabsState {
  isLoading: boolean;
  activeTab: number | null;
  tabs: TabsState_Tab[];
}

interface TabsState_Tab {
  title: string;
  name: string;
  // I have this crappy isDestroyed system because if I delete the tab and component,
  // Svelt will not call onDestroy hook correctly, so I just mark them as destroyed, then remove them on app start ~
  isDestroyed: boolean; 
  componentName: string;
  componentState?: TerminalState;
}

interface GlobalState {
  kucoin: {
    activeOrders: Orders,
    balance: Balances
  }
}