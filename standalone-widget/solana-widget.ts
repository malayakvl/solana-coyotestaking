// Solana Wallet Widget - Standalone Version
// This widget can be embedded in any website (WordPress, HTML, etc.)
// It automatically finds elements with class "wallet-adapter-button" and replaces them
// with real wallet adapter components

interface WidgetOptions {
  network?: 'mainnet-beta' | 'devnet' | 'testnet';
  theme?: 'light' | 'dark';
  onConnect?: (publicKey: string) => void;
  onDisconnect?: () => void;
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
  }
}

class SolanaWidget {
  private options: WidgetOptions;
  private isInitialized: boolean = false;

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
    
    this.loadStyles();
    this.isInitialized = true;
    
    console.log('SolanaWidget initialized successfully');
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
   * Load widget styles - using the same styles as the Next.js app
   */
  private loadStyles(): void {
    // Check if styles are already loaded
    const existingStyle = document.getElementById('solana-widget-styles');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = 'solana-widget-styles';
    style.textContent = `
      /* Import DM Sans font like in wallet adapter */
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
      
      /* Wallet adapter button styles */
      .wallet-adapter-button {
        background-color: transparent;
        border: none;
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        font-family: 'DM Sans', 'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 16px;
        font-weight: 600;
        height: 48px;
        line-height: 48px;
        padding: 0 24px;
        border-radius: 4px;
      }
      
      .wallet-adapter-button-trigger {
        text-align: center !important;
        color: #000 !important;
        background: #ff554f !important;
        background-color: rgb(255, 85, 79);
        border-radius: 4px !important;
        min-width: 145px !important;
        display: block !important;
        position: relative !important;
      }
      
      .wallet-adapter-button:not([disabled]):hover {
        background-color: #ff554f !important;
      }
      
      .wallet-adapter-button-end-icon,
      .wallet-adapter-button-start-icon,
      .wallet-adapter-button-end-icon img,
      .wallet-adapter-button-start-icon img {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
      }
      
      .wallet-adapter-button-end-icon {
        margin-left: 12px;
      }
      
      .wallet-adapter-button-start-icon {
        margin-right: 8px;
      }
      
      .wallet-adapter-button-trigger .wallet-adapter-button-start-icon {
        position: absolute !important;
        top: 12px !important;
      }
      
      /* Custom pi-wallet icon styles from globals.css */
      .pi-wallet {
        background: url("https://vladika.love/wp-content/themes/yootheme/js/wallet-icon.png") !important;
        background-size: contain;
        width: 40px;
        height: 40px;
        display: inline-block;
        position: absolute;
        left: 19px;
        top: 2px;
      }
      
      .w-caption {
        padding-left: 35px !important;
      }
      
      /* Wallet adapter modal styles */
      .wallet-adapter-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0;
        transition: opacity linear 150ms;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1040;
        overflow-y: auto;
      }
      
      .wallet-adapter-modal.wallet-adapter-modal-fade-in {
        opacity: 1;
      }
      
      .wallet-adapter-modal-button-close {
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        top: 18px;
        right: 18px;
        padding: 12px;
        cursor: pointer;
        background: #1a1f2e;
        border: none;
        border-radius: 50%;
        background-color: #ff554f !important;
        width: 40px;
        height: 40px;
      }
      
      .wallet-adapter-modal-button-close:focus-visible {
        outline-color: white;
      }
      
      .wallet-adapter-modal-button-close svg {
        fill: #000 !important;
        width: 14px;
        height: 14px;
      }
      
      .wallet-adapter-modal-button-close:hover svg {
        fill: #000 !important;
      }
      
      .wallet-adapter-modal-container {
        display: flex;
        margin: 3rem;
        min-height: calc(100vh - 6rem);
        align-items: center;
        justify-content: center;
      }
      
      @media (max-width: 480px) {
        .wallet-adapter-modal-container {
          margin: 1rem;
          min-height: calc(100vh - 2rem);
        }
      }
      
      .wallet-adapter-modal-wrapper {
        background: #7b100f !important;
        box-sizing: border-box;
        z-index: 1050;
        background: #10141f;
        border-radius: 10px;
        flex-direction: column;
        flex: 1;
        align-items: center;
        max-width: 400px;
        font-family: DM Sans, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;
        display: flex;
        position: relative;
        box-shadow: 0 8px 20px #0009;
      }
      
      .wallet-adapter-modal-wrapper .wallet-adapter-button {
        width: 100%;
      }
      
      .wallet-adapter-modal-title {
        font-weight: 500;
        font-size: 24px;
        line-height: 36px;
        margin: 0;
        padding: 64px 48px 48px;
        text-align: center;
        color: #fff;
      }
      
      @media (max-width: 374px) {
        .wallet-adapter-modal-title {
          font-size: 18px;
        }
      }
      
      .wallet-adapter-modal-list {
        margin: 0 0 12px 0;
        padding: 0;
        width: 100%;
        list-style: none;
      }
      
      .wallet-adapter-modal-list .wallet-adapter-button {
        font-weight: 400;
        border-radius: 0;
        font-size: 18px;
        color: #fff;
        cursor: pointer;
        background-color: #0000;
        border: none;
        border-radius: 4px;
        align-items: center;
        height: 48px;
        padding: 0 24px;
        font-family: DM Sans, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;
        font-size: 16px;
        font-weight: 600;
        line-height: 48px;
        display: flex;
        justify-content: space-between;
      }
      
      .wallet-adapter-modal-list .wallet-adapter-button-end-icon,
      .wallet-adapter-modal-list .wallet-adapter-button-start-icon,
      .wallet-adapter-modal-list .wallet-adapter-button-end-icon img,
      .wallet-adapter-modal-list .wallet-adapter-button-start-icon img {
        width: 28px;
        height: 28px;
        margin-right: 12px;
      }
      
      .wallet-adapter-modal-list .wallet-adapter-button span {
        margin-left: 0;
        font-size: 14px;
        opacity: 1;
      }
      
      .wallet-adapter-modal-list .wallet-adapter-button .wallet-adapter-button-name {
        flex: 1;
        text-align: left;
        font-size: 18px;
        font-weight: 400;
      }
      
      .wallet-adapter-modal-list-more {
        cursor: pointer;
        border: none;
        padding: 12px 24px 24px 12px;
        align-self: flex-end;
        display: flex;
        align-items: center;
        background-color: transparent;
        color: #fff;
      }
      
      .wallet-adapter-modal-list-more svg {
        transition: all 0.1s ease;
        fill: rgba(255, 255, 255, 1);
        margin-left: 0.5rem;
      }
      
      .wallet-adapter-modal-list-more-icon-rotate {
        transform: rotate(180deg);
      }
      
      /* Custom styles for the widget */
      .solana-widget-container {
        font-family: 'DM Sans', 'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        max-width: 100%;
      }
      
      .solana-widget-btn {
        border: none;
        border-radius: 5em;
        background: #ff8480 !important;
        text-transform: uppercase;
        font-size: 22px;
        font-weight: 700;
        color: #ffffff !important;
        padding: 20px 55px;
        cursor: pointer;
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
      
      /* Styles for connected wallet button */
      .wallet-adapter-button-connected {
        background: #1a1f2e !important;
        color: white !important;
        min-width: 200px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
      }
      
      .wallet-adapter-button-connected .wallet-adapter-button-start-icon {
        position: static !important;
        margin-right: 8px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      
      .wallet-adapter-button-connected .wallet-adapter-button-name {
        flex: 1 !important;
        text-align: left !important;
        margin: 0 !important;
      }
      
      .wallet-adapter-button-connected .wallet-adapter-button-end-icon {
        margin-left: auto !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      
      /* Context menu styles */
      .wallet-adapter-dropdown {
        position: absolute;
        z-index: 1050;
        background: #1a1f2e;
        border-radius: 8px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
        padding: 8px 0;
        min-width: 200px;
        display: none;
      }
      
      .wallet-adapter-dropdown-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      
      .wallet-adapter-dropdown-list-item {
        padding: 12px 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        color: white;
        font-family: 'DM Sans', 'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 14px;
        font-weight: 600;
        transition: background-color 0.1s ease;
      }
      
      .wallet-adapter-dropdown-list-item:hover {
        background-color: #2a2f3e;
      }
      
      .wallet-adapter-dropdown-list-item-icon {
        margin-right: 12px;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
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
    
    // Create connect button with wallet adapter styles and pi-wallet icon
    const connectButton = document.createElement('button');
    connectButton.className = 'wallet-adapter-button wallet-adapter-button-trigger';
    
    // Create the pi-wallet icon
    const icon = document.createElement('i');
    icon.className = 'pi-wallet';
    
    // Create the caption span
    const caption = document.createElement('span');
    caption.className = 'w-caption';
    caption.textContent = 'Wallet';
    
    // Append icon and caption to button
    connectButton.appendChild(icon);
    connectButton.appendChild(caption);
    
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
    // Show wallet selection modal with automatic detection
    this.showWalletSelectionModal();
  }

  /**
   * Show wallet selection modal with automatic detection
   */
  private showWalletSelectionModal(): void {
    const modal = document.createElement('div');
    modal.className = 'wallet-adapter-modal wallet-adapter-modal-fade-in';
    
    // Create wallet items with actual wallet detection
    let walletItemsHTML = '';
    
    // Check for installed wallets
    const wallets = this.getAvailableWallets();
    
    wallets.forEach((wallet, index) => {
      walletItemsHTML += `
        <li>
          <button class="wallet-adapter-button" data-wallet-name="${wallet.name}">
            <div style="display: flex; align-items: center;">
              <i class="wallet-adapter-button-start-icon">
                <img src="${wallet.icon}" alt="${wallet.name} icon" style="width:24px;height:24px;border-radius:50%;">
              </i>
              <span class="wallet-adapter-button-name">${wallet.name}</span>
            </div>
            ${wallet.installed ? '<span style="margin-left: auto;">Detected</span>' : ''}
          </button>
        </li>
      `;
    });
    
    modal.innerHTML = `
      <div class="wallet-adapter-modal-overlay"></div>
      <div class="wallet-adapter-modal-container">
        <div class="wallet-adapter-modal-wrapper">
          <button class="wallet-adapter-modal-button-close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 12.461L8.3 6.772l5.234-5.233L12.006 0 6.772 5.234 1.54 0 0 1.539l5.234 5.233L0 12.006l1.539 1.528L6.772 8.3l5.69 5.7L14 12.461z" fill="currentColor"/>
            </svg>
          </button>
          <h1 class="wallet-adapter-modal-title">Connect a wallet on Solana to continue</h1>
          <ul class="wallet-adapter-modal-list">
            ${walletItemsHTML}
          </ul>
        </div>
      </div>
    `;
    
    // Add event listeners
    const closeBtn = modal.querySelector('.wallet-adapter-modal-button-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
    }
    
    // Add click listeners for wallet items
    const walletItems = modal.querySelectorAll('.wallet-adapter-button');
    walletItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const walletName = (e.currentTarget as HTMLElement).getAttribute('data-wallet-name') || '';
        const wallet = wallets.find(w => w.name === walletName);
        
        if (wallet) {
          this.selectWallet(wallet);
        }
        document.body.removeChild(modal);
      });
    });
    
    // Close modal when clicking outside
    const overlay = modal.querySelector('.wallet-adapter-modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
    }
    
    document.body.appendChild(modal);
  }

  /**
   * Get available wallets with proper icon detection
   */
  private getAvailableWallets(): Array<{name: string, icon: string, installed: boolean}> {
    const wallets = [];
    
    // Check for Phantom
    if (typeof window.phantom !== 'undefined') {
      wallets.push({
        name: 'Phantom',
        icon: this.getWalletIcon('Phantom'),
        installed: true
      });
    } else {
      wallets.push({
        name: 'Phantom',
        icon: this.getWalletIcon('Phantom'),
        installed: false
      });
    }
    
    // Check for Solflare
    if (typeof window.solflare !== 'undefined') {
      wallets.push({
        name: 'Solflare',
        icon: this.getWalletIcon('Solflare'),
        installed: true
      });
    } else {
      wallets.push({
        name: 'Solflare',
        icon: this.getWalletIcon('Solflare'),
        installed: false
      });
    }
    
    // Check for Coinbase Wallet
    if (typeof window.coinbaseSolana !== 'undefined') {
      wallets.push({
        name: 'Coinbase Wallet',
        icon: this.getWalletIcon('Coinbase Wallet'),
        installed: true
      });
    } else {
      wallets.push({
        name: 'Coinbase Wallet',
        icon: this.getWalletIcon('Coinbase Wallet'),
        installed: false
      });
    }
    
    return wallets;
  }

  /**
   * Get wallet icon - try to get from actual wallet provider, fallback to simple icon
   */
  private getWalletIcon(walletName: string): string {
    try {
      switch (walletName) {
        case 'Phantom':
          // Phantom exposes its icon through window.phantom.icon
          if (typeof window.phantom !== 'undefined' && window.phantom?.icon) {
            console.log('Using actual Phantom icon:', window.phantom.icon.substring(0, 100) + '...');
            return window.phantom.icon;
          }
          // Also check in navigator.wallets if available
          if (typeof window.navigator !== 'undefined' && (window.navigator as any).wallets?.Phantom?.icon) {
            console.log('Using Phantom icon from navigator.wallets');
            return (window.navigator as any).wallets.Phantom.icon;
          }
          break;
          
        case 'Solflare':
          // Solflare exposes its icon through window.solflare.icon
          if (typeof window.solflare !== 'undefined' && window.solflare?.icon) {
            console.log('Using actual Solflare icon:', window.solflare.icon.substring(0, 100) + '...');
            return window.solflare.icon;
          }
          break;
          
        case 'Coinbase Wallet':
          // Coinbase Wallet exposes its icon through window.coinbaseSolana.icon
          if (typeof window.coinbaseSolana !== 'undefined' && window.coinbaseSolana?.icon) {
            console.log('Using actual Coinbase Wallet icon:', window.coinbaseSolana.icon.substring(0, 100) + '...');
            return window.coinbaseSolana.icon;
          }
          break;
      }
    } catch (error) {
      console.warn(`Error getting icon for ${walletName}:`, error);
    }
    
    // Log when using fallback icons
    console.log(`Using fallback icon for ${walletName}`);
    
    // Return the proper wallet icons from the main application
    switch (walletName) {
      case 'Phantom':
        // This is the actual Phantom wallet icon from your main application
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTA4IiBoZWlnaHQ9IjEwOCIgdmlld0JveD0iMCAwIDEwOCAxMDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwOCIgaGVpZ2h0PSIxMDgiIHJ4PSIyNiIgZmlsbD0iI0FBOUZGMiIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNNDguNTI2NyA2OS45MjI5QzQyLjAwNTQgNzYuODUwOSAzNC40MjkyIDg1LjYxODIgMjQuMzQ4IDg1LjYxODJDMTkuNTgyNCA4NS42MTgyIDE1IDgzLjY1NjMgMTUgNzUuMTM0MkMxNSA1My40MzA1IDQ0LjYzMjYgMTkuODMyNyA3Mi4xMjY4IDE5LjgzMjdDODcuNzY4IDE5LjgzMjcgOTQgMzAuNjg0NiA5NCA0My4wMDc5Qzk0IDU4LjgyNTggODMuNzM1NSA3Ni45MTIyIDczLjUzMjEgNzYuOTEyMkM3MC4yOTM5IDc2LjkxMjIgNjguNzA1MyA3NS4xMzQyIDY4LjcwNTMgNzIuMzE0QzY4LjcwNTMgNzEuNTc4MyA2OC44Mjc1IDcwLjc4MTIgNjkuMDcxOSA2OS45MjI5QzY1LjU4OTMgNzUuODY5OSA1OC44Njg1IDgxLjM4NzggNTIuNTc1NCA4MS4zODc4QzQ3Ljk5MyA4MS4zODc4IDQ1LjY3MTMgNzguNTA2MyA0NS42NzEzIDc0LjQ1OThDNDUuNjcxMyA3Mi45ODg0IDQ1Ljk3NjggNzEuNDU1NiA0Ni41MjY3IDY5LjkyMjlaTTgzLjY3NjEgNDIuNTc5NEM4My42NzYxIDQ2LjE3MDQgODEuNTU3NSA0Ny45NjU4IDc5LjE4NzUgNDcuOTY1OEM3Ni43ODE2IDQ3Ljk2NTggNzQuNjk4OSA0Ni4xNzA0IDc0LjY5ODkgNDIuNTc5NEM3NC42OTg5IDM4Ljk4ODUgNzYuNzgxNiAzNy4xOTMxIDc5LjE4NzUgMzcuMTkzMUM4MS41NTc1IDM3LjE5MzEgODMuNjc2MSAzOC45ODg1IDgzLjY3NjEgNDIuNTc5NFpNNzAuMjEwMyA0Mi41Nzk1QzcwLjIxMDMgNDYuMTcwNCA2OC4wOTE2IDQ3Ljk2NTggNjUuNzIxNiA0Ny45NjU4QzYzLjMxNTcgNDcuOTY1OCA2MS4yMzMgNDYuMTcwNCA2MS4yMzMgNDIuNTc5NUM2MS4yMzMgMzguOTg4NSA2My4zMzU3IDM3LjE5MzEgNjUuNzIxNiAzNy4xOTMxQzY4LjA5MTYgMzcuMTkzMSA3MC4yMTAzIDM4Ljk4ODUgNzAuMjEwMyA0Mi41Nzk1WiIgZmlsbD0iI0ZGRkZGOCIvPjwvc3ZnPg==';
      
      case 'Solflare':
        return 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJTIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiMwMjA1MGE7c3Ryb2tlOiNmZmVmNDY7c3Ryb2tlLW1pdGVybGltaXQ6MTA7c3Ryb2tlLXdpZHRoOi41cHg7fS5jbHMtMntmaWxsOiNmZmVmNDY7fTwvc3R5bGU+PC9kZWZzPjxyZWN0IGNsYXNzPSJjbHMtMiIgeD0iMCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiByeD0iMTIiIHJ5PSIxMiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTI0LjIzLDI2LjQybDIuNDYtMi4zOCw0LjU5LDEuNWMzLjAxLDEsNC41MSwyLjg0LDQuNTEsNS40MywwLDEuOTYtLjc1LDMuMjYtMi4yNSw0LjkzbC0uNDYuNS4xNy0xLjE3Yy42Ny00LjI2LS41OC02LjA5LTQuNzItNy40M2wtNC4zLTEuMzhoMFpNMTguMDUsMTEuODVsMTIuNTIsNC4xNy0yLjcxLDIuNTktNi41MS0yLjE3Yy0yLjI1LS43NS0zLjAxLTEuOTYtMy4zLTQuNTF2LS4wOGgwWk0xNy4zLDMzLjA2bDIuODQtMi43MSw1LjM0LDEuNzVjMi44LjkyLDMuNzYsMi4xMywzLjQ2LDUuMThsLTExLjY1LTQuMjJoMFpNMTMuNzEsMjAuOTVjMC0uNzkuNDItMS41NCwxLjEzLTIuMTcuNzUsMS4wOSwyLjA1LDIuMDUsNC4wOSwyLjcxbDQuNDIsMS40Ni0yLjQ2LDIuMzgtNC4zNC0xLjQyYy0yLS42Ny0yLjg0LTEuNjctMi44NC0yLjk2TTI2LjgyLDQyLjg3YzkuMTgtNi4wOSwxNC4xMS0xMC4yMywxNC4xMS0xNS4zMiwwLTMuMzgtMi01LjI2LTYuNDMtNi43MmwtMy4zNC0xLjEzLDkuMTQtOC43Ny0xLjg0LTEuOTYtMi43MSwyLjM4LTEyLjgxLTQuMjJjLTMuOTcsMS4yOS04Ljk3LDUuMDktOC45Nyw4Ljg5LDAsLjQyLjA0LjgzLjE3LDEuMjktMy4zLDEuODgtNC42MywzLjYzLTQuNjMsNS44LDAsMi4wNSwxLjA5LDQuMDksNC41NSw1LjIybDIuNzUuOTItOS41Miw5LjE0LDEuODQsMS45NiwyLjk2LTIuNzEsMTQuNzMsNS4yMmgwWiIvPjwvc3ZnPg==';
      
      case 'Coinbase Wallet':
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8Y2lyY2xlIGN4PSI1MTIiIGN5PSI1MTIiIHI9IjUxMiIgZmlsbD0iIzAwNTJGRiIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE1MiA1MTJDMTUyIDcxMC44MjMgMzEzLjE3NyA4NzIgNTEyIDg3MkM3MTAuODIzIDg3MiA4NzIgNzEwLjgyMyA4NzIgNTEyQzg3MiAzMTMuMTc3IDcxMC44MjMgMTUyIDUxMiAxNTJDMzEzLjE3NyAxNTIgMTUyIDMxMy4xNzcgMTUyIDUxMlpNNDIwIDM5NkM0MDYuNzQ1IDM5NiAzOTYgNDA2Ljc0NSAzOTYgNDIwVjYwNEMzOTYgNjE3LjI1NSA0MDYuNzQ1IDYyOCA0MjAgNjI4SDYwNEM2MTcuMjU1IDYyOCA2MjggNjE3LjI1NSA2MjggNjA0VjQyMEM2MjggNDA2Ljc0NSA2MTcuMjU1IDM5NiA2MDQgMzk2SDQyMFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=';
      
      default:
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMkM2LjQ4IDAgMiA0LjQ4IDIgMTBzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnpNMTIgMjBjLTQuNDEgMC04LTMuNTktOC04czMuNTktOCA4LTggOCAzLjU5IDggOC0zLjU5IDgtOCA4eiIgZmlsbD0iIzAwNTJGRiIvPgo8cGF0aCBkPSJNMTIgNkE2IDYgMCAxMDExIDE4QTYgNiAwIDAwMTIgNnpNMTIgOEE0IDQgMCAxMTExIDE2QzExLjU1IDE2IDEyIDE1LjU1IDEyIDh6IiBmaWxsPSIjMDA1MkZGIi8+Cjwvc3ZnPg==';
    }
  }

        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTA4IiBoZWlnaHQ9IjEwOCIgdmlld0JveD0iMCAwIDEwOCAxMDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiByeD0iMjYiIGZpbGw9IiNBQjlGRjIiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00Ni41MjY3IDY5LjkyMjlDNDIuMDA1NCA3Ni44NTA5IDM0LjQyOTIgODUuNjE4MiAyNC4zNDggODUuNjE4MkMxOS41ODI0IDg1LjYxODIgMTUgODMuNjU2MyAxNSA3NS4xMzQyQzE1IDUzLjQzMDUgNDQuNjMyNiAxOS44MzI3IDcyLjEyNjggMTkuODMyN0M4Ny43NjggMTkuODMyNyA5NCAzMC42ODQ2IDk0IDQzLjAwNzlDOTQgNTguODI1OCA4My43MzU1IDc2LjkxMjIgNzMuNTMyMSA3Ni45MTIyQzcwLjI5MzkgNzYuOTEyMiA2OC43MDUzIDc1LjEzNDIgNjguNzA1MyA3Mi4zMTRDNjguNzA1MyA3MS41NzgzIDY4LjgyNzUgNzAuNzgxMiA2OSA5MjI5QzY1LjU4OTMgNzUuODY5OSA1OC44Njg1IDgxLjM4NzggNTIuNTc1NCA4MS4zODc4QzQ3Ljk5MzA4IDE4MS4zODc4IDQ1LjY3MTMgNzguNTA2MyA0NS42NzEzIDc0LjQ1OThDNDUuNjcxMyA3Mi45ODg0IDQ1Ljk3NjggNzEuNDU1NiA0Ni41MjY3IDY5LjkyMjlWem0xNy4zLTQuMDM1M2MzLjQ1MjQtLjIyMSA3LjA3MzUtMS4wNTggMTAuMjE1LTEuNjU3MWMxLjY4LS42NTUgMy4yNTUtMS41MTQgNC43MjgtMi40OTVjMS40NzMtLjk3IDEuOTctMi40OTQgMS45Ny0zLjM5OGMwLS43MDMtLjMwOS0xLjM2Ni0uODk5LTEuOTI0Yy0uNTg5LS41NS4xNy0xLjIyLS43NTMtMS43MjQjY2MwLjM0My0uMTkzLjYyLS40MDMuODg4LS42MjJjLjQ2Ni0uMjIyLjg4OC0uNDM0IDEuMjQ3LS42OTJjLjM2LS4yNTYuNjg4LS41NTMuOTg4LS45OTJjLjMwMS0uNDQ0LjQ4Mi0uOTQxLjU2MS0xLjQ2MWMuMTMtLjQ4LjI0LS45NjIuMzQzLTEuNDcyYy4xMDMtLjUyLjE1My0xLjA3LjE1My0xLjY1MmMtLjAwNi0uNjA5LS4xOTktMS4xOTMtLjU3Mi0xLjY4MyMtLjM3LS40ODgtLjg2LTEuMjQ2LTEuNDQtMS44MjRjLS41OC0uNTctMS4yMi0xLjA1LTEuOTItMTUuMjQ1Qzc0Ljg2NiAxOS44MzI3IDMxLjgyIDMxLjgyIDE1IDMxLjgyQzQuOTU1IDMxLjgyIDMuNTQ2IDMzLjMyMiAyLjI5NCAzNS41MWMtMS4yNTIgMi4yMTgtLjgyIDIuMjE4LTEuMTY1IDMuMjU5QzEuMjMgNC4yOTMuNTM3IDMuODQ5LjQ1OCA1LjA5Yy0uMDc5IDEuMjMgMS4yMjIgMS44MyAyLjM2OSAyLjQ0N2MxLjE0Ny42MTQgMi40NzguMjM3IDMuNDY3LS4wMzljLjk4OC0uMjcyIDEuOTM0LTEuNTQgMi44NjEtMi40MjZjLjMwLS4yNDEuNTYtLjQ2NC44MS0uNzI3Yy4yNS0uMjYzLjQ4LS41MjYuNzEtLjc3NWMxLjE5LTEuMjYgMi41NTUtMi4wOSAzLjM4Ny0yLjQ5NWMuOTMtLjQwIDEuOTUtLjYzIDIuMTUtLjg1Yy4yMS0uMjIuMzgtLjQyLjQ5LS42NGMxLjEzLS4yNSAyLjQ1LS41IDEuNjYtLjY4YzEuMjEtLjE4IDIuNTktLjI4IDMuOTMtLjM1Yy42LS4wNiAxLjE4LS4xMiAxLjczLS4xMmMyLjE5IDAtNC4xNi4zNDgtNi4xNi43NTNjLjU4LjQxIDEuMTcuODEgMS44MSAxLjM1Yy42My4yNiAxLjM2LjQ0IDEuMjMuNTNjLjA4LjA4LjE4LjEzLjI4LjE1YzAuMDkuMDIuMTkuMDMuMjguMDNjMS45MSAwIDMuOTgtLjM3IDUuOTgtLjk4YzEuOTgtLjYxIDMuNzEtMS41NiA1LjQ1LTIuNjZjMS43NC0xLjEgMy4yOC0yLjM3IDQuNjEtMy44NWMxLjMyLTEuNDkgMi41Ni0zLjA3IDIuNjEtNC4wM2MuMDUtLjkxLS4yMi0xLjczLS41Ny0yLjA5Yy0uMzUtLjM2LS43OS0uNjMtMS4zMy0uODZjLjExLS4yMi4yMi0uNDQuMzQtLjYyYy4xMS0uMTkuMjMtLjM4LjQyLS41NWMxLjE1LS4yMjIgMi4zMS0uNDYzIDMuNTMtLjcyNWMxLjIyLS4zMTkgMi40Ny0uNTYzIDMuNjktLjgyYzEuMjItLjM1OCAyLjQyLS41OTggMy41Ny0uODEyYzEuMTUtLjMxNyAyLjM3LS41MjMgMy41OC0uNjA2YzEuMjEtLjA4MiAyLjQzLS4xMjIgMy42OS0uMTIyYzIuMTkgMCA0LjM4LjQxIDYuNTIgMS4xMmMxLjE0LjcxIDIuMjUgMS42MzIgMy4zMjcgMi4yOTJjMS4wNCAuNjUgMS45NiAxLjQzIDIuNzQgMi4zMmMxLjE5IDEuMDEgMi4yNyAxLjg4IDIuMzIgMi4xMWMuMjMgLjI2IDEuNDMgMS42MiAyLjA5IDIuMjIuMDMuMjEgMS4yNi4yMSAyLjA5IDEuMjFjMS4wMiAwIDEuOTgtLjA0IDIuOTMtLjE3YzAuOTUtLjEzIDEuOTAuMzIgMi43Ni43MWMuMzQuMjguNzMuNTguOTguOTRjLjI2LjM5LjQzLjczLjU5IDEuMTljLjE3LjQ1LjI2LjkyLjMxIDEuNTZjLjA1LjU3LjA3IDEuMTMuMDcgMS42NyAwLjAwMi41MjMtLjA2IDEuMDQtLjE3IDEuNTZjLS4xLjUxLS4yMS45Ny0uMzMuMTNjLS4xMi4xNy0uMjQuMzEtLjMxLjQ2Yy0uMDguMjQtLjE2LjQ3LS4yNi42OGMtLjEwLjIyLS4yMS4yNy0uMzEuMjdoLS4wMjB6TTU0LjQyLDUzLjU1Yy0xLjA5LjY5LTIuMTguOTktMy4yOCAxLjE0Yy0uNzMuMjQtMS41LjM4LTIuMjkuMzgjZWMwLjM0LS4yNC42OC0uNTguOTgtLjkyYy4zMi0uMzMuNTgtLjczLjgwLS4xM2MxLjQ0LS41OSAyLjg4LTEuMTggNC4zMi0xLjczYy41Ni0uMzYuOTgtLjcyIDEuMjMtLjk1Yy4yNi0uMjMuNTUtLjQ0LjgyLS42MmMuMjctLjE4LjU3LS4zMjkuOTAuNDYjYzAuMjMuMTMuNDguMjMuNzEuMjZjLjMzLjAyLjY3LjA0IDEuMDEuMDRjMS42NiAwIDIuMjItLjQgMi44My0xLjE3Yy42MS0uNzcuODEtMS42NiAxLjM0LTIuNjZjLjUzLS45OSAxLjA4LTEuOTQgMS41Ni0yLjk5Yy40OC0uOTUuOTMtMS44OSAxLjM0LTIuODRjLjQxLS45My43OS0xLjgzIDEuMTYtMi43M2MuMzgtLjk1LjcyLTEuODktMS4wNC0yLjk2Yy0uMzItMS4wNi0uMzItMi4yMS0uMjctMy4zOGMtLjAxLS42LS4wOS0xLjE5LS4yMi0xLjczYy0uMTMtLjU0LS4zNC0xLjA3LS42Ni0xLjU0Yy0uMzEtLjQ3LS42My0uOTMtLjk1LTEuNDZjLS4zMi0uNTMtLjY2LTEuMDYtLjk2LTEuNTljLS4yOS0uNTUtLjU2LTEuMDgtLjgzLTEuNjZjLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgtLjgzLTEuNTljLS4yNy0uNTktLjU1LTEuMDktLjgzLTEuNTljLS4zNi0uNDgtLjY3LTEuMDItLjk3LTEuNTljLS4yOS0uNDgtLjU2LTEuMDgt