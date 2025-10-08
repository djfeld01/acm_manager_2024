// Accessibility constants and configuration

export const ARIA_LABELS = {
  // Navigation
  MAIN_NAVIGATION: "Main navigation",
  SECONDARY_NAVIGATION: "Secondary navigation",
  BREADCRUMB_NAVIGATION: "Breadcrumb navigation",
  USER_MENU: "User account menu",
  MOBILE_MENU: "Mobile menu",
  SIDEBAR_TOGGLE: "Toggle sidebar",

  // Dashboard
  DASHBOARD_METRICS: "Dashboard metrics",
  QUICK_ACTIONS: "Quick actions",
  RECENT_ACTIVITY: "Recent activity",
  METRIC_CARD: "Metric card",
  ALERT_CARD: "Alert notification",

  // Forms
  FORM_FIELD: "Form field",
  REQUIRED_FIELD: "Required field",
  FIELD_ERROR: "Field error message",
  FIELD_DESCRIPTION: "Field description",
  PASSWORD_TOGGLE: "Toggle password visibility",

  // Data visualization
  CHART_CONTAINER: "Data visualization chart",
  CHART_LEGEND: "Chart legend",
  CHART_DATA_POINT: "Data point",

  // Tables
  DATA_TABLE: "Data table",
  TABLE_SORT: "Sort table column",
  TABLE_FILTER: "Filter table data",
  TABLE_PAGINATION: "Table pagination",

  // Loading states
  LOADING_CONTENT: "Loading content",
  SKELETON_LOADER: "Content loading",

  // Actions
  CLOSE_DIALOG: "Close dialog",
  OPEN_MENU: "Open menu",
  EXPAND_SECTION: "Expand section",
  COLLAPSE_SECTION: "Collapse section",
} as const;

export const KEYBOARD_KEYS = {
  ENTER: "Enter",
  SPACE: " ",
  ESCAPE: "Escape",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  TAB: "Tab",
  HOME: "Home",
  END: "End",
  PAGE_UP: "PageUp",
  PAGE_DOWN: "PageDown",
} as const;

export const FOCUS_SELECTORS = {
  FOCUSABLE_ELEMENTS: [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(", "),

  INTERACTIVE_ELEMENTS: [
    "button",
    "a",
    "input",
    "select",
    "textarea",
    '[role="button"]',
    '[role="link"]',
    '[role="menuitem"]',
    '[role="tab"]',
    '[tabindex="0"]',
  ].join(", "),
} as const;

export const SCREEN_READER_CLASSES = {
  SR_ONLY: "sr-only",
  NOT_SR_ONLY: "not-sr-only",
} as const;

// Minimum touch target size for mobile accessibility (44px x 44px)
export const MIN_TOUCH_TARGET_SIZE = 44;

// WCAG contrast ratios
export const CONTRAST_RATIOS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
} as const;

// Common ARIA roles
export const ARIA_ROLES = {
  BUTTON: "button",
  LINK: "link",
  MENU: "menu",
  MENUITEM: "menuitem",
  MENUBAR: "menubar",
  TAB: "tab",
  TABLIST: "tablist",
  TABPANEL: "tabpanel",
  DIALOG: "dialog",
  ALERT: "alert",
  ALERTDIALOG: "alertdialog",
  STATUS: "status",
  REGION: "region",
  BANNER: "banner",
  MAIN: "main",
  NAVIGATION: "navigation",
  COMPLEMENTARY: "complementary",
  CONTENTINFO: "contentinfo",
  SEARCH: "search",
  FORM: "form",
  TABLE: "table",
  GRID: "grid",
  LISTBOX: "listbox",
  OPTION: "option",
  COMBOBOX: "combobox",
  PROGRESSBAR: "progressbar",
  SLIDER: "slider",
  SPINBUTTON: "spinbutton",
  SWITCH: "switch",
  CHECKBOX: "checkbox",
  RADIO: "radio",
  RADIOGROUP: "radiogroup",
} as const;
