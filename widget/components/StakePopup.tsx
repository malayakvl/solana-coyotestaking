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

  const effectiveConnected = globalWalletState?.connected ?? wallet.connected;
  const effectivePublicKey = globalWalletState?.publicKey ?? wallet.publicKey?.toBase58() ?? null;

  // RPC
  const connection = useMemo(
    () => new Connection('http://103.167.235.81/api/rpc-proxy'),
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
    sendLogMessage('[STAKE] Starting stake process, amount: ' + amount + ', devMode: ' + devMode);
    
    // Log wallet state at the beginning
    sendLogMessage(`[STAKE] Initial wallet state - connected: ${wallet.connected}, has publicKey: ${!!wallet.publicKey}`);
    sendLogMessage(`[STAKE] Initial global wallet state - connected: ${globalWalletState?.connected}, publicKey: ${globalWalletState?.publicKey}`);
    sendLogMessage(`[STAKE] Effective connection - connected: ${effectiveConnected}, publicKey: ${effectivePublicKey}`);
    
    if (amountError) {
      const errorMsg = `❌ ${amountError}`;
      sendLogMessage('[STAKE] Amount validation error: ' + amountError);
      setMessage(errorMsg);
      return;
    }

    const num = parseFloat(amount);
    sendLogMessage('[STAKE] Parsed amount, input: ' + amount + ', parsed: ' + num);

    if (isNaN(num) || num < MIN_STAKE) {
      const errorMsg = `❌ Минимум ${MIN_STAKE} SOL`;
      sendLogMessage('[STAKE] Amount below minimum, amount: ' + num + ', minimum: ' + MIN_STAKE);
      setMessage(errorMsg);
      return;
    }
    
    if (!effectiveConnected || !effectivePublicKey) {
      const errorMsg = '❌ Connect wallet first';
      sendLogMessage('[STAKE] Wallet not connected, connected: ' + effectiveConnected + ', publicKey: ' + effectivePublicKey);
      setMessage(errorMsg);
      return;
    }

    // Log wallet information
    sendLogMessage('[STAKE] Using wallet: ' + (effectiveWallet ? effectiveWallet.publicKey.toBase58() : 'none'));

    try {
      const preparingMsg = '🔄 Preparing transaction...';
      sendLogMessage('[STAKE] Preparing transaction, amount: ' + num + ', publicKey: ' + effectivePublicKey);
      setMessage(preparingMsg);

      const stakeAccount = Keypair.generate();
      sendLogMessage('[STAKE] Generated stake account: ' + stakeAccount.publicKey.toBase58());
      
      const rentExempt = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);
      sendLogMessage('[STAKE] Rent exemption amount: ' + rentExempt);

      const lamports = num * LAMPORTS_PER_SOL + rentExempt;
      sendLogMessage('[STAKE] Total lamports calculation, stakeAmount: ' + num + 
                   ', lamportsPerSol: ' + LAMPORTS_PER_SOL + 
                   ', rentExempt: ' + rentExempt + 
                   ', totalLamports: ' + lamports);

      // BUILD IXS
      sendLogMessage('[STAKE] Creating stake account instruction');
      const createIx = StakeProgram.createAccount({
        fromPubkey: new PublicKey(effectivePublicKey),
        stakePubkey: stakeAccount.publicKey,
        authorized: {
          staker: new PublicKey(effectivePublicKey),
          withdrawer: new PublicKey(effectivePublicKey),
        },
        lamports,
      });
      sendLogMessage('[STAKE] Stake account instruction created');

      sendLogMessage('[STAKE] Creating delegate instruction');
      const delegateIx = StakeProgram.delegate({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: new PublicKey(effectivePublicKey),
        votePubkey: VOTE_ACCOUNT,
      });
      sendLogMessage('[STAKE] Delegate instruction created');

      const tx = new Transaction().add(createIx, delegateIx);
      sendLogMessage('[STAKE] Transaction created');

      // Set fee payer — обовʼязково
      tx.feePayer = new PublicKey(effectivePublicKey);
      sendLogMessage('[STAKE] Fee payer set: ' + effectivePublicKey);

      // Set recent blockhash — обовʼязково
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      sendLogMessage('[STAKE] Blockhash set: ' + blockhash);

      // 🔥 DEVELOPER MODE
      if (devMode) {
        const devMessage = '🛠 Developer mode: simulating...';
        sendLogMessage('[STAKE] Developer mode simulation: ' + devMessage);
        setMessage(devMessage);

        sendLogMessage('[STAKE] Simulating transaction');
        const sim = await connection.simulateTransaction(tx);
        sendLogMessage('[STAKE] Simulation result: ' + JSON.stringify(sim));

        if (sim.value.err) {
          const errorMsg = `Simulation error: ${JSON.stringify(sim.value.err)}`;
          sendLogMessage('[STAKE] Simulation error: ' + JSON.stringify(sim.value.err));
          setAmountError(errorMsg);
          return;
        }

        const fakeSignature = [...Array(88)]
          .map(() => Math.random().toString(36)[2])
          .join('');
        sendLogMessage('[STAKE] Developer simulation successful, signature: ' + fakeSignature, true); // Auto-save on success

        const successMessage = `✅ Developer simulation SUCCESS

Signature: ${fakeSignature}
Slot: ${Math.floor(Math.random() * 100000000)}
Status: simulated only
(Not broadcast to network)`;
        setMessage(successMessage);

      if (sim.value.err) {
        console.error('Simulation failed:', sim.value.err);
        setAmountError(`Ошибка симуляции: ${JSON.stringify(sim.value.err)}`);
        return;
      }

      // NORMAL MODE - REAL TRANSACTION
      sendLogMessage('[STAKE] Preparing real transaction');
      
      // Log wallet state for debugging
      sendLogMessage(`[STAKE] Wallet state - connected: ${wallet.connected}, has sendTransaction: ${!!wallet.sendTransaction}`);
      sendLogMessage(`[STAKE] Global wallet state - connected: ${globalWalletState?.connected}, publicKey: ${globalWalletState?.publicKey}`);
      sendLogMessage(`[STAKE] Effective wallet - connected: ${effectiveWallet?.connected}, publicKey: ${effectiveWallet?.publicKey.toBase58()}`);
      sendLogMessage(`[STAKE] Global signing functions available - sendTransaction: ${!!(typeof window !== 'undefined' && window.globalWalletSendTransaction)}`);
      
      // Check if wallet is connected through global state
      if (!globalWalletState?.connected || !globalWalletState?.publicKey) {
        const errorMsg = 'Wallet not connected. Please connect your wallet first.';
        sendLogMessage('[STAKE] Error: ' + errorMsg);
        setAmountError(errorMsg);
        return;
      }
      
      // Check if global signing functions are available
      if (typeof window === 'undefined' || !window.globalWalletSendTransaction) {
        const errorMsg = 'Wallet signing functions not available. Please reconnect your wallet.';
        sendLogMessage('[STAKE] Error: ' + errorMsg);
        setAmountError(errorMsg);
        return;
      }

      try {
        sendLogMessage('[STAKE] Sending transaction for signing');
        // Use the global sendTransaction function with connection parameter
        const signature = await window.globalWalletSendTransaction(tx, connection);
        sendLogMessage('[STAKE] Transaction sent successfully, signature: ' + signature, true); // Auto-save on success
        
        const successMessage = `✅ Transaction sent successfully!
        
Signature: ${signature}
Check explorer for confirmation.`;
        setMessage(successMessage);
        
        setTimeout(onClose, 3000);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        sendLogMessage('[STAKE] Error sending transaction: ' + errorMessage, true); // Auto-save on error
        setAmountError(errorMessage);
        return;
      }

    } catch (err: unknown) {
      sendLogMessage('[STAKE] Error during stake process: ' + (err instanceof Error ? err.message : 'Unknown error'), true); // Auto-save on error
      if (err instanceof Error) {
        setAmountError(err.message);
      } else {
        setAmountError('An unknown error occurred');
      }
      setMessage('');
    }
  };

const handleConfirm = async () => {
  setMessage('');
  setAmountError(null);

  const num = parseFloat(amount);
  if (isNaN(num) || num < MIN_STAKE) return setAmountError(`Минимум ${MIN_STAKE} SOL`);
  if (!effectiveConnected || !effectivePublicKey) return setAmountError('Подключи кошелёк');
  if (!window.globalWalletSignTransaction || !window.globalWalletSendTransaction) 
    return setAmountError('Кошелёк не готов');

  try {
    setMessage('Готовим...');

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

    setMessage(`ГОТОВО!\n\n${signature}\n\nsolana.fm/tx/${signature}`);
    console.log('VLADIKA STAKED:', signature);
    setTimeout(onClose, 15000);

  } catch (err: any) {
    console.error(err);
    setAmountError(err?.message || 'Ошибка');
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
                  fontSize: '12px'
                }}
              >
                Test Logging
              </button>
            </div>

            {/* ❗ DEVELOPER MODE TOGGLE */}
            <div
              style={{
                display: 'flex',
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
                  fontWeight: devMode ? '600' : 'normal'
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
              style={{
                borderColor: amountError ? '#ff554f' : '#ccc',
                borderWidth: amountError ? 2 : 1
              }}
            />
            {amountError && (
              <div style={{ color: '#fff', marginTop: 5, fontWeight: 'bold' }}>
                ❌ {amountError}
              </div>
            )}

            <div className="stake-button-container">
              <button onClick={handleConfirm} className="stake-submit-btn">
                Stake
              </button>
            </div>

            <span className="text-footer">
              The maximum stake is your balance minus 0.01
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
