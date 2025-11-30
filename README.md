# Solana Wallet Widget

A standalone Solana wallet widget that can be embedded in any website (WordPress, HTML, etc.). The widget automatically detects installed Solana wallets and allows users to connect, view balances, and stake SOL.

## Features

- Automatic wallet detection for Phantom, Solflare, Coinbase Wallet, Backpack, and Trust Wallet
- Wallet connection with balance display
- SOL staking functionality
- Responsive design that works on all websites
- Matches the styling of the main Next.js application

## Build Instructions

To build the standalone widget:

```bash
npm run build:standalone
```

This will generate the widget bundle at `standalone-widget/dist/solana-widget.js`.

## Usage

1. Include the required CDN scripts in your HTML:
   ```html
   <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
   <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
   <script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js"></script>
   ```

2. Include the widget script:
   ```html
   <script src="solana-widget.js"></script>
   ```

3. Add a button element with class `wallet-adapter-button`:
   ```html
   <button class="wallet-adapter-button">Connect Wallet</button>
   ```

4. The widget will automatically replace the button with the full wallet functionality.

## Development

To run the development server for testing:

```bash
cd standalone-widget
php -S 127.0.0.1:8001
```

Then visit http://127.0.0.1:8001/test.html to test the widget.

## Customization

The widget uses the same styling as the main Next.js application, including:
- Wallet button styling with pi-wallet icon
- Modal windows for wallet selection
- Stake SOL button with custom styles
- Consistent color scheme and typography

All styling can be customized by modifying the CSS in `standalone-widget/solana-widget.ts`.