# Solana Wallet Widget

A standalone Solana wallet widget that can be embedded in any website (WordPress, HTML, etc.).

## Features
- Automatic wallet detection (Phantom, Solflare, Coinbase Wallet, Backpack, Trust Wallet)
- Wallet connection with "Detected" badges for installed wallets
- "More options" dropdown for other wallets
- Stake SOL functionality
- Wallet balance fetching using the same RPC proxy as the main application
- Responsive design
- Easy to embed

## Building the Widget

To build the widget, run:

```bash
npm run build:standalone
```

This will generate the bundled widget at `dist/solana-widget.js`.

## Usage

### For HTML sites:

```html
<!-- Add these scripts to your HTML -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<!-- Solana Web3.js -->
<script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js"></script>
<!-- Widget script (build this first with npm run build:standalone) -->
<script src="dist/solana-widget.js"></script>

<!-- Add buttons with class "wallet-adapter-button" - these will be automatically replaced -->
<button class="wallet-adapter-button">Connect Wallet</button>

<!-- Or initialize manually -->
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // The widget auto-initializes, but you can also manually initialize with options:
    if (window.SolanaWalletWidget) {
      window.SolanaWalletWidget.init({
        network: 'mainnet-beta', // or 'devnet', 'testnet'
        theme: 'light', // or 'dark'
        onConnect: (publicKey) => {
          console.log('Wallet connected:', publicKey);
        },
        onDisconnect: () => {
          console.log('Wallet disconnected');
        }
      });
    }
  });
</script>
```

### For WordPress:

1. Upload `dist/solana-widget.js` to your WordPress site
2. Add the CDN scripts and widget script to your theme's header or use a plugin to insert them
3. Add buttons with class "wallet-adapter-button" where you want the widget to appear
4. The widget will automatically replace these buttons

## Testing

To test the widget locally:

1. Build the widget: `npm run build:standalone`
2. Start the PHP development server: `php -S 127.0.0.1:8001` (from the standalone-widget directory)
3. Open http://127.0.0.1:8001/test.html in your browser

## How it Works

The widget automatically detects installed Solana wallets by checking for specific objects in the window object:
- Phantom: `window.phantom`
- Solflare: `window.solflare`
- Coinbase Wallet: `window.coinbaseSolana`
- Backpack: `window.backpack`
- Trust Wallet: `window.trustWallet`

When a user connects their wallet, the widget:
1. Displays which wallet is connected
2. Shows the public key
3. Fetches the wallet balance using the RPC proxy endpoint: `http://103.167.235.81/api/rpc-proxy`
4. Allows staking SOL with validator metrics

## Customization

You can customize the widget by passing options to the init function:

```javascript
window.SolanaWalletWidget.init({
  network: 'mainnet-beta', // or 'devnet', 'testnet'
  theme: 'dark', // or 'light'
  onConnect: (publicKey) => {
    console.log('Wallet connected:', publicKey);
  },
  onDisconnect: () => {
    console.log('Wallet disconnected');
  }
});
```