'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  Keypair,
  StakeProgram
} from '@solana/web3.js';

const VOTE_ACCOUNT = new PublicKey('53RJBy7aBGA7Aag6AryxEmBbsHDgwfBWagLrPbGHnfvR');
const MIN_STAKE = 0.01;

interface StakePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StakePopup: React.FC<StakePopupProps> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add this state for blocking UI during submission
  const [showSuccessPopup, setShowSuccessPopup] = useState(false); // State for showing success popup
  const [transactionSignature, setTransactionSignature] = useState(''); // State for transaction signature

  const [jitoValue, setJitoValue] = useState<number | null>(null);
  const [uptime, setUptime] = useState<number | null>(null);
  const [skipRate, setSkipRate] = useState<number | null>(null);

  const [amountError, setAmountError] = useState<string | null>(null);

  // 🔥 Developer Mode
  const [devMode, setDevMode] = useState(false);

  // GLOBAL WALLET
  const [globalWalletState, setGlobalWalletState] = useState<{
    connected: boolean;
    publicKey: string | null;
    walletName: string | null;tx
  } | null>(null);

  const wallet = useWallet();

  // GLOBAL SUBSCRIBE
  useEffect(() => {
    if (typeof window === 'undefined' || !window.subscribeToGlobalWalletState) return;

    const unsubscribe = window.subscribeToGlobalWalletState((newState) => {
      setGlobalWalletState(newState);
    });

    setTimeout(() => {
      if (window.globalWalletState) {
        setGlobalWalletState(window.globalWalletState);
      }
    }, 0);

    return () => unsubscribe && unsubscribe();
  }, []);
  
  // Add showSuccessPopup function to window object for WordPress integration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.showSuccessPopup = (message: string) => {
        // Create container div
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.inset = '0';
        container.style.background = 'rgba(0,0,0,0.5)';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.zIndex = '1000';
        container.style.fontFamily = 'Arial, sans-serif';
        
        // Create popup content
        const popup = document.createElement('div');
        popup.style.background = '#1a1a1a';
        popup.style.borderRadius = '12px';
        popup.style.padding = '30px';
        popup.style.width = '90%';
        popup.style.maxWidth = '400px';
        popup.style.textAlign = 'center';
        popup.style.border = '2px solid #ff8480';
        popup.style.position = 'relative';
        
        // Create title
        const title = document.createElement('h2');
        title.textContent = '✅ Transaction Successful!';
        title.style.color = '#ff8480';
        title.style.marginBottom = '20px';
        title.style.fontSize = '24px';
        
        // Create message container
        const messageContainer = document.createElement('div');
        messageContainer.style.color = '#fff';
        messageContainer.style.marginBottom = '20px';
        messageContainer.style.fontSize = '16px';
        messageContainer.style.whiteSpace = 'pre-line';
        messageContainer.style.wordBreak = 'break-all';
        messageContainer.textContent = message;
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.background = '#ff8480';
        closeButton.style.color = '#fff';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '5em';
        closeButton.style.padding = '12px 30px';
        closeButton.style.fontSize = '16px';
        closeButton.style.fontWeight = 'bold';
        closeButton.style.cursor = 'pointer';
        closeButton.style.width = '100%';
        closeButton.onclick = () => {
          document.body.removeChild(container);
        };
        
        // Assemble popup
        popup.appendChild(title);
        popup.appendChild(messageContainer);
        popup.appendChild(closeButton);
        container.appendChild(popup);
        
        // Add to DOM
        document.body.appendChild(container);
      };
    }
    
    // Cleanup function
    return () => {
      if (typeof window !== 'undefined' && window.showSuccessPopup) {
        delete window.showSuccessPopup;
      }
    };
  }, []);

  const effectiveConnected = globalWalletState?.connected ?? wallet.connected;
  const effectivePublicKey = globalWalletState?.publicKey ?? wallet.publicKey?.toBase58() ?? null;

  // RPC
  // const connection = useMemo(
  //   () => new Connection('http://103.167.235.81/api/rpc-proxy'),
  //   []
  // );
  const connection = useMemo(
    () => new Connection('https://vladika.love/wp-content/themes/yootheme/proxy.php'),
      []
  );

  // Get the effective wallet for transactions
  const effectiveWallet = useMemo(() => {
    // Prefer global wallet state if available
    if (globalWalletState?.connected && globalWalletState?.publicKey) {
      return {
        publicKey: new PublicKey(globalWalletState.publicKey),
        connected: globalWalletState.connected
      };
    }
    // Fallback to local wallet
    if (wallet.connected && wallet.publicKey) {
      return {
        publicKey: wallet.publicKey,
        connected: wallet.connected
      };
    }
    return null;
  }, [globalWalletState, wallet]);

  // BALANCE
  useEffect(() => {
    if (!isOpen || !effectiveConnected || !effectivePublicKey) return;

    let active = true;

    const pubkey = new PublicKey(effectivePublicKey);

    const load = async () => {
      try {
        const lamports = await connection.getBalance(pubkey);
        if (active) setAvailableBalance(lamports / LAMPORTS_PER_SOL);
      } catch (e) {
        if (active) setAvailableBalance(null);
      }
    };

    load();
    const timer = setInterval(load, 15000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [isOpen, effectiveConnected, effectivePublicKey, connection]);

  // JITO
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(
          "https://kobe.mainnet.jito.network/api/v1/steward_events?limit=1&event_type=ScoreComponentsV2&vote_account=53RJBy7aBGA7Aag6AryxEmBbsHDgwfBWagLrPbGHnfvR"
        );
        const data = await res.json();
        if (!cancelled) {
          const score = Math.round(data.events[0].data.score * 100 * 100) / 100;
          setJitoValue(score);
        }
      } catch {
        if (!cancelled) setJitoValue(null);
      }
    };

    load();
    return () => (cancelled = true);
  }, [isOpen]);

  // Stakewiz
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(
          "https://api.stakewiz.com/validator/53RJBy7aBGA7Aag6AryxEmBbsHDgwfBWagLrPbGHnfvR"
        );
        const data = await res.json();
        if (!cancelled) {
          setSkipRate(Math.round(data.skip_rate * 100) / 100);
          setUptime(data.uptime);
        }
      } catch {
        if (!cancelled) {
          setSkipRate(null);
          setUptime(null);
        }
      }
    };

    load();
    return () => (cancelled = true);
  }, [isOpen]);

  const [logMessages, setLogMessages] = useState<string[]>([]);

  // Function to send log messages to the server and auto-save on key events
  const sendLogMessage = async (message: string, autoSave: boolean = false) => {
    const timestamp = new Date().toISOString();
    const walletInfo = effectiveWallet 
      ? { 
          publicKey: effectiveWallet.publicKey.toBase58(), 
          connected: effectiveWallet.connected 
        } 
      : null;
    const logEntry = `[${timestamp}] [${walletInfo ? `wallet(${walletInfo.publicKey}, ${walletInfo.connected ? 'connected' : 'disconnected'})` : 'no_wallet'}] ${message}`;
    
    // Also log to console for immediate visibility
    console.log(`[SENDING LOG] [${walletInfo ? `wallet(${walletInfo.publicKey}, ${walletInfo.connected ? 'connected' : 'disconnected'})` : 'no_wallet'}] ${message}`);
    
    // Update local log state for UI purposes
    setLogMessages(prev => {
      const newLogs = [...prev, logEntry];
      return newLogs;
    });
    
    // Send log to server
    try {
      console.log(`[NETWORK] Sending log to http://localhost:8081/`);
      const response = await fetch('http://localhost:8081/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          walletInfo,
          filename: 'stake-transactions.log' // Use a single log file for all transactions
        })
      });
      
      console.log(`[NETWORK] Response status: ${response.status}`);
      console.log(`[NETWORK] Response headers:`, [...response.headers.entries()]);
      
      // Try to read the response body
      const responseBody = await response.text();
      console.log(`[NETWORK] Response body:`, responseBody);
      
      if (!response.ok) {
        console.error('Failed to send log to server:', response.statusText);
      } else {
        console.log('[NETWORK] Log sent successfully');
      }
    } catch (error) {
      console.error('[NETWORK ERROR] Failed to send log to server:', error);
      // Log more details about the error
      if (error instanceof TypeError) {
        console.error('[NETWORK ERROR] This might be a CORS or network connectivity issue');
      }
    }
  };

  // Test function to verify logging
  const testLogging = () => {
    console.log('[TEST] Testing logging functionality');
    sendLogMessage('[TEST] This is a test log message');
  };

  // HANDLE STAKE
  const handleConfirm = async () => {
    // Block UI during submission
    setIsSubmitting(true);
    setMessage('');
    setAmountError(null);

    const num = parseFloat(amount);
    if (isNaN(num) || num < MIN_STAKE) {
      setAmountError(`Минимум ${MIN_STAKE} SOL`);
      setIsSubmitting(false);
      return;
    }
    if (!effectiveConnected || !effectivePublicKey) {
      setAmountError('Подключи кошёк');
      setIsSubmitting(false);
      return;
    }
    if (!window.globalWalletSignTransaction || !window.globalWalletSendTransaction) {
      setAmountError('Кошелёк не готов');
      setIsSubmitting(false);
      return;
    }

    // If developer mode is enabled, simulate successful transaction without sending
    if (devMode) {
      setMessage('Подготовка...');
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage('Подпиши в кошельке...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage('Симуляция...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a fake signature for demonstration
      const fakeSignature = '5SigFakeSignatureDemo1234567890abcdef1234567890abcdef1234567890abcdef123456789';
      
      // Close current popup
      setIsSubmitting(false);
      onClose();
      
      // Show success message in a new popup
      setTimeout(() => {
        showSuccessPopup(`Transaction Successful!

Signature: ${fakeSignature}

View on Solana Explorer: solana.fm/tx/${fakeSignature}`);
      }, 100);
      
      return;
    }

    try {
      setMessage('Подготовка...');

      const rentExempt = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);
      const lamports = Math.floor(num * LAMPORTS_PER_SOL) + rentExempt;
      const stakeAccount = Keypair.generate();

      const createIx = StakeProgram.createAccount({
        fromPubkey: new PublicKey(effectivePublicKey),
        stakePubkey: stakeAccount.publicKey,
        authorized: {
          staker: new PublicKey(effectivePublicKey),
          withdrawer: new PublicKey(effectivePublicKey),
        },
        lamports,
      });

      const delegateIx = StakeProgram.delegate({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: new PublicKey(effectivePublicKey),
        votePubkey: VOTE_ACCOUNT,
      });

      const tx = new Transaction().add(createIx, delegateIx);
      tx.feePayer = new PublicKey(effectivePublicKey);
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      // ←←← ЭТО ГЛАВНОЕ ИСПРАВЛЕНИЕ
      tx.partialSign(stakeAccount);

      setMessage('Подпиши в кошельке...');
      const signedTx = await window.globalWalletSignTransaction(tx);

      setMessage('Симуляция...');
      const sim = await connection.simulateTransaction(signedTx);
      if (sim.value.err) throw new Error(JSON.stringify(sim.value.err));

      setMessage('Отправляем в сеть...');
      const signature = await window.globalWalletSendTransaction(signedTx, connection);

      setMessage(`ГОТОВО!

${signature}

solana.fm/tx/${signature}`);
      console.log('VLADIKA STAKED:', signature);
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 15000);

    } catch (err) {
      console.error(err);
      
      // Check if user cancelled the transaction
      if (err?.message?.includes('User rejected the request') || 
          err?.message?.includes('Transaction cancelled') ||
          err?.message?.includes('rejected') ||
          err?.code === 4001) {  // Common error code for user rejection
        // Clear all messages and unblock UI when user cancels
        setMessage('');
        setAmountError(null);
      } else {
        // Show error message for other errors
        setAmountError(err && err.message ? err.message : 'Ошибка');
      }
      
      // Always unblock UI on error
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="stake-popup-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div className="stake-popup-content">
        <div className="stake-popup-header"></div>

        <div className="stake-popup-tips">
          This is your staking jackpot 0% comission + MEV rewards.
          Stake smart, earn more. Your SOL deserves this kind of luck!
        </div>

        <div className="flex">
          <div className="col-param">{uptime ?? '?'}%<br /><span>Uptime</span></div>
          <div className="col-param">{skipRate ?? '?'}%<br /><span>Skip Rate</span></div>
          <div className="col-param">{jitoValue ?? '?'}<br /><span>Jito Score</span></div>
        </div>

        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-60px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>

        <div className="red-content-popup">
          <div className="red-content">
            {/* Test Logging Button */}
            <div style={{ textAlign: 'right', marginBottom: '10px' }}>
              <button
                onClick={testLogging}
                style={{
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'none'
                }}
              >
                Test Logging
              </button>
            </div>

            {/* ❗ DEVELOPER MODE TOGGLE */}
            <div
              style={{
                display: 'none',
                alignItems: 'center',
                marginBottom: '10px',
                marginTop: '10px',
                padding: '8px 12px',
                backgroundColor: '#2d2d2d',
                borderRadius: '6px',
                border: devMode ? '1px solid #ff554f' : '1px solid #444'
              }}
            >
              <input
                type="checkbox"
                checked={devMode}
                onChange={() => setDevMode(!devMode)}
                id="devModeToggle"
                style={{ 
                  marginRight: '8px',
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  accentColor: '#ff554f'
                }}
              />
              <label 
                htmlFor="devModeToggle" 
                style={{ 
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: devMode ? '600' : 'normal',
                  display: 'none'
                }}
              >
                Developer mode (simulation only)
              </label>
            </div>

            <p className="text-amount">
              Available amount:{' '}
              <span className="amount-value">
                {availableBalance !== null
                  ? availableBalance.toFixed(3)
                  : effectiveConnected
                  ? 'Loading...'
                  : 'Connect wallet'}
              </span>
            </p>

            {/* INPUT */}
            <div className="input-container">
              <span className="input-icon i-sol"></span>
              <input
                type="text"
                placeholder={`${MIN_STAKE} SOL`}
                value={amount}
                onChange={(e) => {
                  const v = e.target.value;
                  setAmount(v);

                  const n = parseFloat(v);
                  if (v === '') setAmountError(null);
                  else if (isNaN(n)) setAmountError('Enter valid number');
                  else if (n < MIN_STAKE)
                    setAmountError(`Minimum ${MIN_STAKE} SOL`);
                  else if (availableBalance && n > availableBalance)
                    setAmountError(`Exceeds balance (${availableBalance.toFixed(3)} SOL)`);
                  else setAmountError(null);
                }}
                className="stake-input"
                disabled={isSubmitting}
                style={{
                  borderColor: amountError ? '#ff554f' : '#ccc',
                  borderWidth: amountError ? 2 : 1,
                  opacity: isSubmitting ? 0.3 : 1
                }}
              />
              {amountError && (
                <div style={{ color: '#fff', marginTop: 5, fontWeight: 'bold' }}>
                  ❌ {amountError}
                </div>
              )}
            </div>

            <div className="stake-button-container">
              <button 
                onClick={handleConfirm} 
                className="stake-submit-btn"
                disabled={isSubmitting}
                style={{
                  opacity: isSubmitting ? 0.3 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Sending...' : 'Stake'}
              </button>
            </div>

            <span className="text-footer">
              The maximum stake is your balance minus 0.01,
              to ensure you have some SOL left for future transactions.
            </span>
          </div>
        </div>

        {message && (
          <div
            style={{
              position: 'absolute',
              top: '-170px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 40px)',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
              color: message.includes('✅') ? '#155724' : '#721c24',
              border: `2px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              zIndex: 1001,
              maxWidth: '500px',
              textAlign: 'left'
            }}
          >
            <div 
              style={{ 
                whiteSpace: 'pre-line',
                wordBreak: 'break-all',
                overflowWrap: 'break-word',
                lineHeight: '1.4'
              }}
            >
              {message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
