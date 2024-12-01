export enum PortNames {
  tab_listener = "tab_listener",
}

export enum TabListenerActionNames {
  tab_changed = "tab_changed",
}

export type TabChangedAction = {
  action: TabListenerActionNames.tab_changed;
  payload: {
    url: string;
  };
};

export type TabListenerActions = TabChangedAction;
