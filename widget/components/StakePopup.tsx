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

// Extend the Window interface to include custom properties
declare global {
  interface Window {
    showSuccessPopup?: (message: string) => void;
    subscribeToGlobalWalletState?: (callback: (state: any) => void) => (() => void) | null;
    globalWalletState?: any;
    globalWalletSignTransaction?: (transaction: Transaction) => Promise<Transaction>;
    globalWalletSendTransaction?: (transaction: Transaction, connection: Connection) => Promise<string>;
  }
}

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
  const isMounted = React.useRef(true);

  const [jitoValue, setJitoValue] = useState<number | null>(null);
  const [uptime, setUptime] = useState<number | null>(null);
  const [skipRate, setSkipRate] = useState<number | null>(null);
  const isSigningRef = React.useRef(false);

  const [amountError, setAmountError] = useState<string | null>(null);

  // 🔥 Developer Mode
  const [devMode, setDevMode] = useState(false);

  // GLOBAL WALLET
  const [globalWalletState, setGlobalWalletState] = useState<{
    connected: boolean;
    publicKey: string | null;
    walletName: string | null;
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
        container.id = 'success-popup-container';
        container.style.position = 'fixed';
        container.style.inset = '0';
        container.style.background = 'rgba(0,0,0,0.6)';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.zIndex = '1000';
        container.style.fontFamily = 'Open Sans, sans-serif';
        
        // Create popup content
        const popup = document.createElement('div');
        popup.style.background = '#fff';
        popup.style.borderRadius = '16px';
        popup.style.padding = '30px';
        popup.style.width = '90%';
        popup.style.maxWidth = '457px';
        popup.style.textAlign = 'center';
        // popup.style.border = '3px solid #ff8480';
        popup.style.position = 'relative';
        // popup.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
        
        // Create title
        const title = document.createElement('h2');
        title.textContent = 'You`ve successfully delegated SOL to Vladika. Your stake will start earning rewards from the next epoch.';
        title.style.color = '#ff8480';
        title.style.marginBottom = '20px';
        title.style.fontSize = '28px';
        title.style.fontWeight = 'bold';
        
        // Create success icon with background image
        const icon = document.createElement('div');
        icon.className = 'success-popup-icon';

        const closeIcon = document.createElement('div');
        closeIcon.className = 'success-popup-close';
        closeIcon.innerHTML = '&times;';
        
        // Add click handler to close the popup
        closeIcon.onclick = () => {
          document.body.removeChild(container);
        };
        
        // Create message container
        const messageContainer = document.createElement('div');
        messageContainer.style.color = '#fff';
        messageContainer.style.marginBottom = '25px';
        messageContainer.style.fontSize = '16px';
        messageContainer.style.lineHeight = '1.5';
        messageContainer.style.whiteSpace = 'pre-line';
        messageContainer.style.wordBreak = 'break-word';
        messageContainer.textContent = message;
        
        // Create signature container with better styling
        const signatureContainer = document.createElement('div');
        signatureContainer.className = 'success-popup-signature-container';
        
        // Extract signature from message
        const signatureMatch = message.match(/Signature: ([A-Za-z0-9]+)/);
        if (signatureMatch && signatureMatch[1]) {
          const signatureTitle = document.createElement('div');
          signatureTitle.textContent = 'You`ve successfully delegated SOL to Vladika. Your stake will start earning rewards from the next epoch.';
          signatureTitle.style.color = '#000';
          signatureTitle.style.fontSize = '16px';
          signatureTitle.style.marginBottom = '8px';
          
          const signatureText = document.createElement('div');
          signatureText.textContent = signatureMatch[1];
          signatureText.style.color = '#ff8480';
          signatureText.style.fontFamily = 'monospace';
          signatureText.style.fontSize = '13px';
          signatureText.style.wordBreak = 'break-all';
          signatureText.style.display = 'none';
          
          // Add transaction link
          const signatureLink = document.createElement('a');
          // signatureLink.href = `https://solanabeach.io/address/${signatureMatch[1]}/transactions`;
          signatureLink.href = `https://solanabeach.io/address/9dy9PWY9UhBZopERAYhx3hZeDig8L7ava73UU1FmwnAc/transactions`;
          signatureLink.textContent = 'View transaction on SolanaBeach';
          signatureLink.target = '_blank';
          signatureLink.style.display = 'block';
          signatureLink.style.marginTop = '8px';
          signatureLink.style.color = '#1a0dab';
          signatureLink.style.textDecoration = 'underline';
          signatureLink.style.fontSize = '14px';
          
          signatureContainer.appendChild(signatureTitle || '');
          signatureContainer.appendChild(signatureText || '');
          signatureContainer.appendChild(signatureLink || '');
        }
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.className = 'success-popup-close-button';
        
        // Hover effects are now handled by CSS classes
        
        closeButton.onclick = () => {
          document.body.removeChild(container);
        };
        
        // Create a div with red background to contain the close button
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'success-popup-button-container';
        
        // Create text above the button
        const buttonText = document.createElement('div');
        buttonText.innerHTML = "<span class='success-popup-button-text-content'>You can stake tokens in your wallet's `Staking` tab. Feeling fancy already? You should - your SOL in the right hands</span>";
        buttonText.className = 'success-popup-button-text';
        
        // Create transaction link
        const transactionLink = document.createElement('a');
        transactionLink.href = `https://solanabeach.io/address/9dy9PWY9UhBZopERAYhx3hZeDig8L7ava73UU1FmwnAc/transactions`;
        transactionLink.textContent = 'View transaction on SolanaBeach';
        transactionLink.target = '_blank';
        transactionLink.style.display = 'block';
        transactionLink.style.marginTop = '10px';
        transactionLink.style.color = '#fff';
        transactionLink.style.textDecoration = 'underline';
        transactionLink.style.fontSize = '16px';
        transactionLink.className = 'transaction-link';
        
        buttonContainer.appendChild(buttonText);
        buttonContainer.appendChild(transactionLink);
        buttonContainer.appendChild(closeButton);
        
        // Assemble popup
        popup.appendChild(icon);
        popup.appendChild(closeIcon);
        // popup.appendChild(title);
        if (signatureMatch && signatureMatch[1]) {
          popup.appendChild(signatureContainer);
        }
        popup.appendChild(buttonContainer);
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
      
      // Remove any existing popup containers
      const existingContainer = document.getElementById('success-popup-container');
      if (existingContainer) {
        document.body.removeChild(existingContainer);
      }
    };
  }, []);

  const effectiveConnected = globalWalletState?.connected ?? wallet.connected;
  const effectivePublicKey = globalWalletState?.publicKey ?? wallet.publicKey?.toBase58() ?? null;

  // RPC
  // const connection = useMemo(
  //   () => new Connection('https://rpc.d-care.online/api/rpc-proxy'),
  //   []
  // );
  // const connection = useMemo(
  //   () => new Connection('https://vladika.love/rpc.php'),
  //   []
  // );
  // console.log('connection:', 'https://vladika.love/rpc.php');
  // const connection = useMemo(
  //   () => new Connection('https://103.167.235.81.sslip.io/api/rpc-proxy'),
  //   []
  // );
  const connection = useMemo(
    () => new Connection('https://solspy.org/api/rpc-proxy'),
    []
  );
  // const connection = useMemo(
  //   () => new Connection('https://nameless-dream-ffe6.malaya-kvl.workers.dev/'),
  //   []
  // );

  // ЦЕЙ useEffect має бути ПІСЛЯ всіх інших і замість старого
  useEffect(() => {
    console.log('useEffect БАЛАНСУ ЗАПУЩЕНО');
    console.log('isOpen:', isOpen, 'connected:', effectiveConnected, 'pubkey:', effectivePublicKey);

    if (!isOpen || !effectiveConnected || !effectivePublicKey) {
      console.log('Вих conditions не пройдено — виходимо');
      // setAvailableBalance(null);
      return;
    }

    const pubkey = new PublicKey(effectivePublicKey);
    const controller = new AbortController();

    console.log('ЗАПИТ БАЛАНСУ →', connection.rpcEndpoint);

    const timeout = setTimeout(() => {
      console.error('ТАЙМАУТ 15 секунд — валідатор не відповів!');
      controller.abort();
      setAvailableBalance(null);
    }, 15000);

    // Since getBalance doesn't support signal, we'll use a Promise.race approach
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 15000);
    });

    Promise.race([
      connection.getBalance(pubkey),
      timeoutPromise
    ])
      .then(lamports => {
        if (controller.signal.aborted) return; // Don't update state if aborted
        clearTimeout(timeout);
        const sol = lamports / LAMPORTS_PER_SOL;
        console.log('БАЛАНС ОТРИМАНО:', sol.toFixed(6), 'SOL');
        setAvailableBalance(sol);
      })
      .catch(err => {
        if (!isMounted.current) return;
        setAvailableBalance(null);
        if (err.message === 'Request timeout' || controller.signal.aborted) {
          clearTimeout(timeout);
          if (err.message === 'Request timeout') {
            console.error('Запит скасовано через таймаут');
          }
          setAvailableBalance(null);
        } else {
          clearTimeout(timeout);
          console.error('getBalance помилка:', err.message || err);
          setAvailableBalance(null);
        }
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [isOpen, effectiveConnected, effectivePublicKey, connection]);

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
        if (!isMounted.current) return;
        setAvailableBalance(null);
        if (!cancelled) setJitoValue(null);
      }
    };

    load();
    isMounted.current = isOpen;
    return () => (cancelled = true);
  }, [isOpen]);

  // Stakewiz
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    // if (isOpen) {
    //   setAvailableBalance(null);
    //   setMessage('');
    //   setAmountError(null);
    // }

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
        if (!isMounted.current) return;
        setAvailableBalance(null);
        if (!cancelled) {
          setSkipRate(null);
          setUptime(null);
        }
      }
    };

    load();
    return () => (cancelled = true);
  }, [isOpen]);

  

  // const [logMessages, setLogMessages] = useState<string[]>([]);

  // Test function to verify logging
  const testLogging = () => {
    console.log('[TEST] Testing logging functionality');
    // sendLogMessage('[TEST] This is a test log message');
  };

  const validateAmount = (value: string): boolean => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      setAmountError('Enter valid number');
      return false;
    }
    if (num < MIN_STAKE) {
      setAmountError(`Minimum ${MIN_STAKE} SOL`);
      return false;
    }
    if (availableBalance !== null && num > availableBalance) {
      setAmountError(`Exceeds balance (${availableBalance.toFixed(3)} SOL)`);
      return false;
    }
    setAmountError(null);
    return true;
  };


  // HANDLE STAKE
  const handleConfirm = async () => {
    if (isSigningRef.current) return; // предотвращаем повторные клики
    setIsSubmitting(true);
    isSigningRef.current = true;
    setMessage('');
    setAmountError(null);

    const num = parseFloat(amount);
    if (!validateAmount(amount)) {
      setIsSubmitting(false);
      isSigningRef.current = false;
      return;
    }

    try {
      const rentExempt = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);
      const lamports = Math.floor(num * LAMPORTS_PER_SOL) + rentExempt;
      const stakeAccount = Keypair.generate();
      const payer = new PublicKey(effectivePublicKey);

      const createIx = StakeProgram.createAccount({
        fromPubkey: payer,
        stakePubkey: stakeAccount.publicKey,
        authorized: { staker: payer, withdrawer: payer },
        lamports
      });

      const delegateIx = StakeProgram.delegate({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: payer,
        votePubkey: VOTE_ACCOUNT
      });

      // =========== Create a transaction and add the instructions to it
      const tx = new Transaction().add(createIx, delegateIx);
      tx.feePayer = payer;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      setMessage('Waiting for wallet signature...');
      const signedTx = await window.globalWalletSignTransaction!(tx);

      signedTx.partialSign(stakeAccount);

      const raw = signedTx.serialize();
      const signature = await connection.sendRawTransaction(raw, {
        skipPreflight: false,
        preflightCommitment: 'processed',
        maxRetries: 3,
      });
      // ============= end send transaction

      setMessage('Sending transaction...');
      // const signature = await window.globalWalletSendTransaction!(signedTx, connection);

      setMessage('✅ Transaction sent');

      if (window.showSuccessPopup) {
        onClose(); // закрываем основной popup
        // window.showSuccessPopup(`Transaction Successful!\nSignature: ${signature}\nhttps://solanabeach.io/address/${signature}/transactions`);
        window.showSuccessPopup(`Transaction Successful!`);
      }

    } catch (err) {
      console.error(err);
      if (!err.message.includes('User rejected')) setAmountError(err.message || 'Error');
    } finally {
      setIsSubmitting(false);
      isSigningRef.current = false;
    }
  };


  // Clear messages when popup opens
  if (!isOpen) return null;

  // console.log('StakePopup відкрито, запитую баланс...');

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
      <div className="stake-popup-content" >
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
          x
        </button>
        
        {/* Success popup close button */}
        <button
          onClick={onClose}
          className="success-popup-close-button"
          style={{
            position: 'absolute',
            top: '-60px',
            right: '40px',
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '5px 10px',
            borderRadius: '4px'
          }}
        >
          Close
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
