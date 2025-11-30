# Solana Wallet Widget

A standalone Solana wallet widget that can be embedded in any website (WordPress, HTML, etc.).

## Features
- Connect to Solana wallets (Phantom, Solflare, Coinbase, etc.)
- Stake SOL functionality
- Responsive design
- Easy to embed

## Usage

### For HTML sites:
```html
<!-- Add these scripts to your HTML -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="solana-widget.js"></script>

<!-- Add this div where you want the widget to appear -->
<div id="solana-wallet-widget"></div>

<!-- Initialize the widget -->
<script>
  document.addEventListener('DOMContentLoaded', function() {
    if (window.SolanaWidget) {
      window.SolanaWidget.init({
        containerId: 'solana-wallet-widget'
      });
    }
  });
</script>
```

### For WordPress:
1. Upload `solana-widget.js` to your WordPress site
2. Add the scripts to your theme's header or use a plugin to insert them
3. Add a div with id="solana-wallet-widget" where you want the widget to appear
4. Initialize the widget as shown above

## Customization

You can customize the widget by passing options to the init function:

```javascript
window.SolanaWidget.init({
  containerId: 'solana-wallet-widget',
  theme: 'dark', // or 'light'
  network: 'mainnet-beta', // or 'devnet', 'testnet'
  onConnect: (publicKey) => {
    console.log('Wallet connected:', publicKey);
  },
  onDisconnect: () => {
    console.log('Wallet disconnected');
  }
});
```