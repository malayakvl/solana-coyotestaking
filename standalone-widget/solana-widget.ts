// Solana Wallet Widget - Standalone Version
// This widget can be embedded in any website (WordPress, HTML, etc.)
// It automatically finds elements with class "wallet-adapter-button" and replaces them

interface WidgetOptions {
  network?: 'mainnet-beta' | 'devnet' | 'testnet';
  theme?: 'light' | 'dark';
  onConnect?: (publicKey: string) => void;
  onDisconnect?: () => void;
}

interface WalletAdapter {
  name: string;
  icon: string;
  installed: boolean;
}

// Define global interfaces
interface SolanaWalletWidgetInterface {
  init: (options?: WidgetOptions) => void;
  replaceButtons: () => void;
}

// Extend window interface
declare global {
  interface Window {
    SolanaWalletWidget: SolanaWalletWidgetInterface;
    // Wallet provider objects
    phantom?: unknown;
    solflare?: unknown;
    coinbaseSolana?: unknown;
    backpack?: unknown;
    trustWallet?: unknown;
    // React and ReactDOM from CDN
    React?: unknown;
    ReactDOM?: unknown;
    // Use unknown type instead of any for better type safety
    solana?: unknown;
    Solana?: unknown;
    SolanaWeb3?: unknown;
  }
}

class SolanaWidget {
  private options: WidgetOptions;
  private isInitialized: boolean = false;
  private wallets: WalletAdapter[] = [];
  private selectedWallet: WalletAdapter | null = null;
  private connectedPublicKey: string | null = null;

  constructor() {
    this.options = {
      network: 'mainnet-beta',
      theme: 'light'
    };
  }

  /**
   * Initialize the widget
   * @param options Widget configuration options
   */
  public init(options?: WidgetOptions): void {
    if (options) {
      this.options = { ...this.options, ...options };
    }
    
    if (typeof window === 'undefined') {
      console.warn('SolanaWidget: Window object not available. Widget can only run in browser environment.');
      return;
    }

    // Check for required libraries (more flexible check)
    const hasReact = typeof window.React !== 'undefined' && typeof window.ReactDOM !== 'undefined';
    
    if (!hasReact) {
      console.warn('SolanaWidget: React and ReactDOM not found. Please include React CDN scripts.');
      // Still initialize for basic functionality
    }
    
    this.loadStyles();
    this.initializeWallets();
    this.isInitialized = true;
    
    console.log('SolanaWidget initialized successfully');
  }

  /**
   * Initialize wallet adapters with automatic detection of real wallet providers
   */
  private initializeWallets(): void {
    try {
      // Detect real wallet providers by checking window objects
      // This mimics the behavior of @solana/wallet-adapter-wallets
      const detectedWallets: WalletAdapter[] = [];
      const otherWallets: WalletAdapter[] = [];
      
      // Real wallet detection logic based on how Solana wallet adapters work
      const walletProviders = [
        { 
          name: 'Phantom', 
          icon: this.getPhantomIcon(), 
          installed: typeof window.phantom !== 'undefined' || (typeof window.navigator !== 'undefined' && (window.navigator as unknown as { wallets?: Record<string, unknown> }).wallets?.['Phantom'] !== undefined)
        },
        { 
          name: 'Solflare', 
          icon: this.getSolflareIcon(), 
          installed: typeof window.solflare !== 'undefined' 
        },
        { 
          name: 'Coinbase Wallet', 
          icon: this.getCoinbaseIcon(), 
          installed: typeof window.coinbaseSolana !== 'undefined' 
        },
        { 
          name: 'Backpack', 
          icon: this.getBackpackIcon(), 
          installed: typeof window.backpack !== 'undefined' 
        },
        { 
          name: 'Trust Wallet', 
          icon: this.getTrustIcon(), 
          installed: typeof window.trustWallet !== 'undefined' 
        }
      ];
      
      // Separate detected wallets from others
      walletProviders.forEach(wallet => {
        if (wallet.installed) {
          detectedWallets.push(wallet);
        } else {
          otherWallets.push(wallet);
        }
      });
      
      // Combine detected wallets first, then others
      this.wallets = [...detectedWallets, ...otherWallets];
      console.log('Wallets initialized with real detection:', this.wallets);
    } catch (error) {
      console.error('Failed to initialize wallets:', error);
      // Fallback to mock wallets
      this.wallets = [
        { name: 'Phantom', icon: this.getPhantomIcon(), installed: true },
        { name: 'Solflare', icon: this.getSolflareIcon(), installed: true },
        { name: 'Coinbase Wallet', icon: this.getCoinbaseIcon(), installed: false },
        { name: 'Backpack', icon: this.getBackpackIcon(), installed: false },
        { name: 'Trust Wallet', icon: this.getTrustIcon(), installed: false }
      ];
    }
  }

  /**
   * Get Phantom wallet icon SVG
   */
  private getPhantomIcon(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTA4IiBoZWlnaHQ9IjEwOCIgdmlld0JveD0iMCAwIDEwOCAxMDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiByeD0iMjYiIGZpbGw9IiNBQjlGRjIiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00Ni41MjY3IDY5LjkyMjlDNDIuMDA1NCA3Ni44NTA5IDM0LjQyOTIgODUuNjE4MiAyNC4zNDggODUuNjE4MkMxOS41ODI0IDg1LjYxODIgMTUgODMuNjU2MyAxNSA3NS4xMzQyQzE1IDUzLjQzMDUgNDQuNjMyNiAxOS44MzI3IDcyLjEyNjggMTkuODMyN0M4Ny43NjggMTkuODMyNyA5NCAzMC42ODQ2IDk0IDQzLjAwNzlDOTQgNTguODI1OCA4My43MzU1IDc2LjkxMjIgNzMuNTMyMSA3Ni45MTIyQzcwLjI5MzkgNzYuOTEyMiA2OC43MDUzIDc1LjEzNDIgNjguNzA1MyA3Mi4zMTRDNjguNzA1MyA3MS41NzgzIDY4LjgyNzUgNzAuNzgxMiA2OS4wNzE5IDY5LjkyMjlDNjUuNTg5MyA3NS44Njk5IDU4Ljg2ODUgODEuMzg3OCA1Mi41NzU0IDgxLjM4NzhDNDcuOTkzIDgxLjM4NzggNDUuNjcxMyA3OC41MDYzIDQ1LjY3MTMgNzQuNDU5OEM0NS42NzEzIDcyLjk4ODQgNDUuOTc2OCA3MS40NTU2IDQ2LjUyNjcgNjkuOTIyOVpNODMuNjc2MSA0Mi41Nzk0QzgzLjY3NjEgNDYuMTcwNCA4MS41NTc1IDQ3Ljk2NTggNzkuMTg3NSA0Ny45NjU4Qzc2Ljc4MTYgNDcuOTY1OCA3NC42OTg5IDQ2LjE3MDQgNzQuNjk4OSA0Mi41Nzk0Qzc0LjY5ODkgMzguOTg4NSA3Ni43ODE2IDM3LjE5MzEgNzkuMTg3NSAzNy4xOTMxQzgxLjU1NzUgMzcuMTkzMSA4My42NzYxIDM4Ljk4ODUgODMuNjc2MSA0Mi41Nzk0Wk03MC4yMTAzIDQyLjU3OTVDNzAuMjEwMyA0Ni4xNzA0IDY4LjA5MTYgNDcuOTY1OCA2NS43MjE2IDQ3Ljk2NThDNjMuMzE1NyA0Ny45NjU4IDYxLjIzMyA0Ni4xNzA0IDYxLjIzMyA0Mi41Nzk1QzYxLjIzMyAzOC45ODg1IDYzLjMxNTcgMzcuMTkzMSA2NS43MjE2IDM3LjE5MzFDNjguMDkxNiAzNy4xOTMxIDcwLjIxMDMgMzguOTg4NSA3MC4yMTAzIDQyLjU3OTVaIiBmaWxsPSIjRkZGREY4Ii8+Cjwvc3ZnPgo=';
  }

  /**
   * Get Solflare wallet icon SVG
   */
  private getSolflareIcon(): string {
    return 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJTIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiMwMjA1MGE7c3Ryb2tlOiNmZmVmNDY7c3Ryb2tlLW1pdGVybGltaXQ6MTA7c3Ryb2tlLXdpZHRoOi41cHg7fS5jbHMtMntmaWxsOiNmZmVmNDY7fTwvc3R5bGU+PC9kZWZzPjxyZWN0IGNsYXNzPSJjbHMtMiIgeD0iMCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiByeD0iMTIiIHJ5PSIxMiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTI0LjIzLDI2LjQybDIuNDYtMi4zOCw0LjU5LDEuNWMzLjAxLDEsNC41MSwyLjg0LDQuNTEsNS40MywwLDEuOTYtLjc1LDMuMjYtMi4yNSw0LjkzbC0uNDYuNS4xNy0xLjE3Yy42Ny00LjI2LS41OC02LjA5LTQuNzItNy40M2wtNC4zLTEuMzhoMFpNMTguMDUsMTEuODVsMTIuNTIsNC4xNy0yLjcxLDIuNTktNi41MS0yLjE3Yy0yLjI1LS43NS0zLjAxLTEuOTYtMy4zLTQuNTF2LS4wOGgwWk0xNy4zLDMzLjA2bDIuODQtMi43MSw1LjM0LDEuNzVjMi44LjkyLDMuNzYsMi4xMywzLjQ2LDUuMThsLTExLjY1LTQuMjJoMFpNMTMuNzEsMjAuOTVjMC0uNzkuNDItMS41NCwxLjEzLTIuMTcuNzUsMS4wOSwyLjA1LDIuMDUsNC4wOSwyLjcxbDQuNDIsMS40Ni0yLjQ2LDIuMzgtNC4zNC0xLjQyYy0yLS42Ny0yLjg0LTEuNjctMi44NC0yLjk2TTI2LjgyLDQyLjg3YzkuMTgtNi4wOSwxNC4xMS0xMC4yMywxNC4xMS0xNS4zMiwwLTMuMzgtMi01LjI2LTYuNDMtNi43MmwtMy4zNC0xLjEzLDkuMTQtOC43Ny0xLjg0LTEuOTYtMi43MSwyLjM4LTEyLjgxLTQuMjJjLTMuOTcsMS4yOS04Ljk3LDUuMDktOC45Nyw4Ljg5LDAsLjQyLjA0LjgzLjE3LDEuMjktMy4zLDEuODgtNC42MywzLjYzLTQuNjMsNS44LDAsMi4wNSwxLjA5LDQuMDksNC41NSw1LjIybDIuNzUuOTItOS41Miw5LjE0LDEuODQsMS45NiwyLjk2LTIuNzEsMTQuNzMsNS4yMmgwWiIvPjwvc3ZnPg==';
  }

  /**
   * Get Coinbase wallet icon SVG
   */
  private getCoinbaseIcon(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8Y2lyY2xlIGN4PSI1MTIiIGN5PSI1MTIiIHI9IjUxMiIgZmlsbD0iIzAwNTJGRiIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE1MiA1MTJDMTUyIDcxMC44MjMgMzEzLjE3NyA4NzIgNTEyIDg3MkM3MTAuODIzIDg3MiA4NzIgNzEwLjgyMyA4NzIgNTEyQzg3MiAzMTMuMTc3IDcxMC44MjMgMTUyIDUxMiAxNTJDMzEzLjE3NyAxNTIgMTUyIDMxMy4xNzcgMTUyIDUxMlpNNDIwIDM5NkM0MDYuNzQ1IDM5NiAzOTYgNDA2Ljc0NSAzOTYgNDIwVjYwNEMzOTYgNjE3LjI1NSA0MDYuNzQ1IDYyOCA0MjAgNjI4SDYwNEM2MTcuMjU1IDYyOCA2MjggNjE3LjI1NSA2MjggNjA0VjQyMEM2MjggNDA2Ljc0NSA2MTcuMjU1IDM5NiA2MDQgMzk2SDQyMFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=';
  }

  /**
   * Get Backpack wallet icon SVG
   */
  private getBackpackIcon(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiBmaWxsPSIjMDAwMDAwIi8+CjxwYXRoIGQ9Ik0xNjAgMTYwSDMyMFYzMjBIMTYwVjE2MFpNMzUyIDE2MEgxOTJWMzUySDM1MlYxNjBaTTM4NCAxNjBIMzIwVjMyMEg0NDhWMjI0QzQ0OCAxODguNTMzIDQxOS40NjcgMTYwIDM4NCAxNjBaTTQ4MCAxNjBIMzUyVjQxNkg0ODBWMjI0QzQ4MCAxODguNTMzIDQ1MS40NjcgMTYwIDQxNiAxNjBaIiBmaWxsPSIjRkZGRkZGIi8+Cjwvc3ZnPg==';
  }

  /**
   * Get Trust wallet icon SVG
   */
  private getTrustIcon(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiBmaWxsPSIjMDBFRkFGIi8+CjxwYXRoIGQ9Ik0yNTYgMEMxMTQuNjI1IDAgMCAxMTQuNjI1IDAgMjU2QzAgMzk3LjM3NSAxMTQuNjI1IDUxMiAyNTYgNTEyQzM5Ny4zNzUgNTEyIDUxMiAzOTcuMzc1IDUxMiAyNTZDMjU2IDExNC42MjUgMTQxLjM3NSAwIDI1NiAwWk0yMDggMzA0QzIwOCAzMDQgMTkyIDI4OCAxOTIgMjg4QzE5MiAyODggMTkyIDI4OCAxOTIgMjg4QzE5MiAyODggMTkyIDI4OCAxOTIgMjg4QzE5MiAyODggMTkyIDI4OCAxOTIgMjg4QzE5MiAyODggMTkyIDI4OCAxOTIgMjg4QzE5MiAyODggMTkyIDI4';
  }

  /**
   * Automatically find and replace buttons with class "wallet-adapter-button"
   */
  public replaceButtons(): void {
    if (!this.isInitialized) {
      console.warn('SolanaWidget: Widget not initialized. Call init() first.');
      // Try to initialize anyway for better user experience
      this.init();
    }

    // Find all elements with class "wallet-adapter-button"
    const buttons = document.querySelectorAll('.wallet-adapter-button');
    console.log('Found ' + buttons.length + ' wallet buttons to replace');
    
    buttons.forEach((button, index) => {
      // Create a new container for our widget
      const widgetContainer = document.createElement('div');
      widgetContainer.id = 'solana-wallet-widget-' + index;
      widgetContainer.className = 'solana-wallet-widget-container';
      
      // Replace the button with our widget container
      button.parentNode?.replaceChild(widgetContainer, button);
      
      // Render the widget in the container
      this.renderWidget(widgetContainer.id);
    });
  }

  /**
   * Load widget styles
   */
  private loadStyles(): void {
    // Check if styles are already loaded
    const existingStyle = document.getElementById('solana-widget-styles');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = 'solana-widget-styles';
    style.textContent = `
      .solana-widget-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 100%;
      }
      
      .solana-widget-btn {
        background: linear-gradient(135deg, #9945FF 0%, #14F195 100%);
        border: none;
        border-radius: 8px;
        color: white;
        cursor: pointer;
        font-weight: 600;
        padding: 12px 24px;
        text-align: center;
        transition: all 0.2s ease;
        width: 100%;
      }
      
      .solana-widget-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(153, 69, 255, 0.3);
      }
      
      .solana-widget-btn:active {
        transform: translateY(0);
      }
      
      .solana-widget-btn-connected {
        background: #14F195;
        color: #000;
      }
      
      .solana-widget-popup {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
      
      .solana-widget-popup-content {
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        padding: 24px;
        width: 90%;
        max-width: 400px;
      }
      
      .solana-widget-popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      
      .solana-widget-popup-title {
        font-size: 20px;
        font-weight: 600;
        margin: 0;
      }
      
      .solana-widget-close-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 24px;
        line-height: 1;
      }
      
      .solana-widget-input {
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 16px;
        padding: 12px;
        width: 100%;
        margin-bottom: 16px;
        box-sizing: border-box;
      }
      
      .solana-widget-input:focus {
        border-color: #9945FF;
        outline: none;
      }
      
      .solana-widget-balance {
        background: #f5f5f5;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 16px;
      }
      
      .solana-widget-actions {
        display: flex;
        gap: 12px;
      }
      
      .solana-widget-action-btn {
        flex: 1;
        padding: 12px;
        border-radius: 8px;
        border: none;
        font-weight: 600;
        cursor: pointer;
      }
      
      .solana-widget-confirm-btn {
        background: #9945FF;
        color: white;
      }
      
      .solana-widget-cancel-btn {
        background: #eee;
        color: #333;
      }
      
      .solana-widget-message {
        margin-top: 16px;
        padding: 12px;
        border-radius: 8px;
        text-align: center;
      }
      
      .solana-widget-message-success {
        background: #e6f4ea;
        color: #0a6e22;
      }
      
      .solana-widget-message-error {
        background: #fce8e6;
        color: #c5221f;
      }
      
      .solana-widget-metrics {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 20px;
      }
      
      .solana-widget-metric {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      
      .solana-widget-metric:last-child {
        margin-bottom: 0;
      }
      
      .solana-widget-metric-label {
        font-weight: 500;
      }
      
      .solana-widget-metric-value {
        font-weight: 600;
      }
      
      /* Wallet selection modal styles - matching Next.js wallet adapter */
      .solana-wallet-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      }
      
      .solana-wallet-modal-content {
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        padding: 24px;
        width: 90%;
        max-width: 400px;
        max-height: 80vh;
        overflow-y: auto;
      }
      
      .solana-wallet-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      
      .solana-wallet-modal-title {
        font-size: 20px;
        font-weight: 600;
        margin: 0;
      }
      
      .solana-wallet-modal-button-close {
        background: none;
        border: none;
        cursor: pointer;
        width: 14px;
        height: 14px;
      }
      
      .solana-wallet-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .solana-wallet-item {
        display: flex;
        align-items: center;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: background-color 0.2s;
        width: 100%;
        text-align: left;
        border: none;
        background: transparent;
      }
      
      .solana-wallet-item:hover {
        background-color: #f5f5f5;
      }
      
      .solana-wallet-item-start-icon {
        width: 24px;
        height: 24px;
        margin-right: 12px;
        border-radius: 50%;
      }
      
      .solana-wallet-item-name {
        flex: 1;
        font-weight: 500;
        text-align: left;
      }
      
      .solana-wallet-item-detected {
        font-size: 12px;
        color: #666;
        margin-left: 8px;
      }
      
      .solana-wallet-collapse {
        height: 0;
        overflow: hidden;
        transition: height 250ms ease-out;
      }
      
      .solana-wallet-collapse.expanded {
        height: auto;
      }
      
      .solana-wallet-list-more {
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 12px;
        font-weight: 500;
      }
      
      .solana-wallet-list-more svg {
        margin-left: 8px;
        transition: transform 250ms ease-out;
      }
      
      .solana-wallet-list-more.expanded svg {
        transform: rotate(180deg);
      }
      
      .solana-wallet-connected-info {
        background: #f0f8ff;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 16px;
        text-align: center;
      }
      
      .solana-wallet-connected-name {
        font-weight: 600;
        margin-bottom: 4px;
      }
      
      .solana-wallet-connected-address {
        font-family: monospace;
        font-size: 14px;
        color: #666;
        word-break: break-all;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Render the widget component
   */
  private renderWidget(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('SolanaWidget: Container with id \'' + containerId + '\' not found');
      return;
    }

    // Clear container
    container.innerHTML = '';
    
    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'solana-widget-container';
    
    // Create connect button
    const connectButton = document.createElement('button');
    connectButton.className = 'solana-widget-btn';
    connectButton.textContent = this.selectedWallet ? 'Connected: ' + this.selectedWallet.name : 'Connect Wallet';
    connectButton.onclick = () => this.handleConnectClick();
    
    widgetContainer.appendChild(connectButton);
    container.appendChild(widgetContainer);
    
    // Create stake button
    const stakeButton = document.createElement('button');
    stakeButton.className = 'solana-widget-btn';
    stakeButton.style.marginTop = '12px';
    stakeButton.textContent = 'Stake SOL';
    stakeButton.onclick = () => this.handleStakeClick();
    
    widgetContainer.appendChild(stakeButton);
  }

  /**
   * Handle connect button click
   */
  private handleConnectClick(): void {
    if (this.selectedWallet) {
      // If already connected, show disconnect option
      if (confirm('Disconnect from ' + this.selectedWallet.name + '?')) {
        this.selectedWallet = null;
        this.connectedPublicKey = null;
        this.updateButtonLabels();
      }
    } else {
      // Show wallet selection modal with automatic detection
      this.showWalletSelectionModal();
    }
  }

  /**
   * Show wallet selection modal with automatic detection
   */
  private showWalletSelectionModal(): void {
    const modal = document.createElement('div');
    modal.className = 'solana-wallet-modal';
    
    // Separate detected wallets from others
    const detectedWallets = this.wallets.filter(wallet => wallet.installed);
    const otherWallets = this.wallets.filter(wallet => !wallet.installed);
    
    // Create wallet items HTML
    let walletItemsHTML = '';
    detectedWallets.forEach((wallet, index) => {
      walletItemsHTML += `
        <li>
          <button class="solana-wallet-item" data-wallet-index="${index}">
            <i class="solana-wallet-item-start-icon">
              <img src="${wallet.icon}" alt="${wallet.name} icon" style="width:24px;height:24px;border-radius:50%;">
            </i>
            <span class="solana-wallet-item-name">${wallet.name}</span>
            ${wallet.installed ? '<span class="solana-wallet-item-detected">Detected</span>' : ''}
          </button>
        </li>
      `;
    });
    
    // Create collapse section for other wallets
    let otherWalletsHTML = '';
    otherWallets.forEach((wallet, index) => {
      const actualIndex = detectedWallets.length + index;
      otherWalletsHTML += `
        <li>
          <button class="solana-wallet-item" data-wallet-index="${actualIndex}">
            <i class="solana-wallet-item-start-icon">
              <img src="${wallet.icon}" alt="${wallet.name} icon" style="width:24px;height:24px;border-radius:50%;">
            </i>
            <span class="solana-wallet-item-name">${wallet.name}</span>
          </button>
        </li>
      `;
    });
    
    modal.innerHTML = `
      <div class="solana-wallet-modal-content">
        <div class="solana-wallet-modal-header">
          <h1 class="solana-wallet-modal-title">Connect a wallet on Solana to continue</h1>
          <button class="solana-wallet-modal-button-close">&times;</button>
        </div>
        <ul class="solana-wallet-list">
          ${walletItemsHTML}
          ${otherWallets.length > 0 ? `<div class="solana-wallet-collapse" id="solana-wallet-collapse">
            ${otherWalletsHTML}
          </div>` : ''}
        </ul>
        ${otherWallets.length > 0 ? `
          <button class="solana-wallet-list-more" id="solana-wallet-more-button">
            <span>More options</span>
            <svg width="13" height="7" viewBox="0 0 13 7" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.71418 1.626L5.83323 6.26188C5.91574 6.33657 6.0181 6.39652 6.13327 6.43762C6.24844 6.47872 6.37371 6.5 6.50048 6.5C6.62725 6.5 6.75252 6.47872 6.8677 6.43762C6.98287 6.39652 7.08523 6.33657 7.16774 6.26188L12.2868 1.626C12.7753 1.1835 12.3703 0.5 11.6195 0.5H1.37997C0.629216 0.5 0.224175 1.1835 0.71418 1.626Z"></path>
            </svg>
          </button>
        ` : ''}
      </div>
    `;
    
    // Add event listeners
    const closeBtn = modal.querySelector('.solana-wallet-modal-button-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
    }
    
    // Add click listeners for wallet items
    const walletItems = modal.querySelectorAll('.solana-wallet-item');
    walletItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const index = parseInt((e.currentTarget as HTMLElement).getAttribute('data-wallet-index') || '0');
        const wallet = this.wallets[index];
        
        this.selectWallet(wallet);
        document.body.removeChild(modal);
      });
    });
    
    // Add more options toggle
    const moreButton = modal.querySelector('#solana-wallet-more-button');
    const collapse = modal.querySelector('#solana-wallet-collapse');
    if (moreButton && collapse) {
      moreButton.addEventListener('click', () => {
        collapse.classList.toggle('expanded');
        moreButton.classList.toggle('expanded');
      });
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    document.body.appendChild(modal);
  }

  /**
   * Select a wallet
   */
  private selectWallet(wallet: WalletAdapter): void {
    this.selectedWallet = wallet;
    // In a real implementation, we would get the actual public key from the wallet
    // For now, we'll use a mock public key
    this.connectedPublicKey = 'DzBFCSAGswVQ1f4V9oiX3sXfJSPnd89W5L47hEc8SZvV';
    console.log('Wallet selected:', wallet.name);
    
    // Update button labels
    this.updateButtonLabels();
    
    // Call onConnect callback if provided
    if (this.options.onConnect) {
      this.options.onConnect(this.connectedPublicKey);
    }
  }

  /**
   * Update button labels to reflect connection status
   */
  private updateButtonLabels(): void {
    const buttons = document.querySelectorAll('.solana-widget-btn');
    buttons.forEach(button => {
      if (button.textContent?.includes('Connect Wallet') || button.textContent?.includes('Connected:')) {
        button.textContent = this.selectedWallet ? 'Connected: ' + this.selectedWallet.name : 'Connect Wallet';
      }
    });
  }

  /**
   * Handle stake button click
   */
  private handleStakeClick(): void {
    if (!this.selectedWallet) {
      alert('Please connect a wallet first');
      return;
    }
    
    this.showStakePopup();
  }

  /**
   * Show stake popup with wallet connection info and balance
   */
  private showStakePopup(): void {
    const popup = document.createElement('div');
    popup.className = 'solana-widget-popup';
    
    // Create initial popup content
    popup.innerHTML = ''
      + '<div class="solana-widget-popup-content">'
      + '  <div class="solana-widget-popup-header">'
      + '    <h2 class="solana-widget-popup-title">Stake SOL</h2>'
      + '    <button class="solana-widget-close-btn">&times;</button>'
      + '  </div>'
      + '  '
      + '  <div class="solana-wallet-connected-info">'
      + '    <div class="solana-wallet-connected-name">Connected to ' + (this.selectedWallet?.name || 'Unknown Wallet') + '</div>'
      + '    <div class="solana-wallet-connected-address">' + (this.connectedPublicKey || 'Unknown Address') + '</div>'
      + '  </div>'
      + '  '
      + '  <div class="solana-widget-metrics">'
      + '    <div class="solana-widget-metric">'
      + '      <span class="solana-widget-metric-label">Uptime:</span>'
      + '      <span class="solana-widget-metric-value">99.8%</span>'
      + '    </div>'
      + '    <div class="solana-widget-metric">'
      + '      <span class="solana-widget-metric-label">Skip Rate:</span>'
      + '      <span class="solana-widget-metric-value">0.2%</span>'
      + '    </div>'
      + '    <div class="solana-widget-metric">'
      + '      <span class="solana-widget-metric-label">MEV Score:</span>'
      + '      <span class="solana-widget-metric-value">8.5</span>'
      + '    </div>'
      + '  </div>'
      + '  '
      + '  <div class="solana-widget-balance">'
      + '    <div>Available Balance: Checking...</div>'
      + '    <div id="solana-widget-balance-amount"></div>'
      + '  </div>'
      + '  '
      + '  <input type="number" class="solana-widget-input" placeholder="Amount in SOL" min="0.01" step="0.01">'
      + '  '
      + '  <div class="solana-widget-actions">'
      + '    <button class="solana-widget-action-btn solana-widget-confirm-btn">Confirm</button>'
      + '    <button class="solana-widget-action-btn solana-widget-cancel-btn">Cancel</button>'
      + '  </div>'
      + '</div>';
    
    // Add event listeners
    const closeBtn = popup.querySelector('.solana-widget-close-btn');
    const cancelBtn = popup.querySelector('.solana-widget-cancel-btn');
    const confirmBtn = popup.querySelector('.solana-widget-confirm-btn');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(popup);
      });
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        document.body.removeChild(popup);
      });
    }
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const input = popup.querySelector('.solana-widget-input') as HTMLInputElement;
        const amount = parseFloat(input.value);
        
        if (isNaN(amount) || amount < 0.01) {
          this.showMessage(popup, 'Please enter a valid amount (minimum 0.01 SOL)', 'error');
          return;
        }
        
        this.showMessage(popup, 'Staking ' + amount + ' SOL...', 'success');
        // In a real implementation, this would initiate the staking transaction
      });
    }
    
    document.body.appendChild(popup);
    
    // Fetch balance after popup is shown
    this.fetchWalletBalance();
  }

  /**
   * Fetch wallet balance from RPC proxy using Solana Web3.js library
   */
  private async fetchWalletBalance(): Promise<void> {
    if (!this.connectedPublicKey) {
      console.error('No connected public key');
      return;
    }
    
    const balanceElement = document.getElementById('solana-widget-balance-amount');
    if (!balanceElement) {
      console.error('Balance element not found');
      return;
    }
    
    try {
      // Show loading state
      const balanceContainer = balanceElement.parentElement;
      if (balanceContainer) {
        balanceContainer.innerHTML = '<div>Available Balance: Checking...</div><div id="solana-widget-balance-amount"></div>';
      }
      
      // Check if Solana Web3.js is available
      // The IIFE version exposes solanaWeb3 globally
      if (typeof window.solanaWeb3 === 'undefined') {
        console.error('Solana Web3.js library not found');
        throw new Error('Solana Web3.js library not found. Please include the Solana Web3.js CDN script.');
      }
      
      // Create connection using the same endpoint as StakePopup
      const { Connection, PublicKey, LAMPORTS_PER_SOL } = window.solanaWeb3;
      const connection = new Connection('http://103.167.235.81/api/rpc-proxy');
      const publicKey = new PublicKey(this.connectedPublicKey);
      
      // Fetch balance using the same method as StakePopup
      const lamports = await connection.getBalance(publicKey);
      const solBalance = lamports / LAMPORTS_PER_SOL;
      
      if (balanceContainer) {
        balanceContainer.innerHTML = '<div>Available Balance: ' + solBalance.toFixed(3) + ' SOL</div>';
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      const balanceContainer = balanceElement.parentElement;
      if (balanceContainer) {
        balanceContainer.innerHTML = '<div>Available Balance: Error fetching balance</div>';
      }
    }
  }

  /**
   * Show message in popup
   */
  private showMessage(popupContainer: HTMLElement, message: string, type: 'success' | 'error'): void {
    // Remove existing message if any
    const existingMessage = popupContainer.querySelector('.solana-widget-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'solana-widget-message solana-widget-message-' + type;
    messageDiv.textContent = message;
    
    const content = popupContainer.querySelector('.solana-widget-popup-content');
    if (content) {
      content.appendChild(messageDiv);
      
      // Auto-remove message after 3 seconds
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.parentNode.removeChild(messageDiv);
        }
      }, 3000);
    }
  }
}

// Create the widget instance
const widgetInstance = new SolanaWidget();

// Attach to window directly for IIFE format
window.SolanaWalletWidget = {
  init: (options?: WidgetOptions) => widgetInstance.init(options),
  replaceButtons: () => widgetInstance.replaceButtons()
};

// Auto-initialize and replace buttons when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('SolanaWalletWidget: Auto-initializing...');
  // More flexible initialization that doesn't fail if Solana libraries aren't available
  try {
    window.SolanaWalletWidget.init();
    window.SolanaWalletWidget.replaceButtons();
  } catch (error) {
    console.error('SolanaWalletWidget auto-initialization failed:', error);
    // Still try to replace buttons even if initialization had issues
    try {
      window.SolanaWalletWidget.replaceButtons();
    } catch (replaceError) {
      console.error('SolanaWalletWidget button replacement failed:', replaceError);
    }
  }
});