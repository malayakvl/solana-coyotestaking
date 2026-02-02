'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  wallet?: {
    connected: boolean;
    publicKey: PublicKey | null;
    sendTransaction?: (tx: Transaction, connection: Connection) => Promise<string>;
    signTransaction?: (tx: Transaction) => Promise<Transaction>;
  };
  devModeEnabled?: boolean;
}

export const StakePopup: React.FC<StakePopupProps> = ({ isOpen, onClose, wallet: propWallet }) => {
  const walletContext = useWallet();
  const effectiveWallet = propWallet || walletContext;

  const getPublicKey = (): PublicKey | null => {
    if (effectiveWallet?.publicKey) return effectiveWallet.publicKey;
    if (walletContext.publicKey) return walletContext.publicKey;
    if (typeof window !== 'undefined' && (window as any).solana?.publicKey) {
      try {
        return new PublicKey((window as any).solana.publicKey.toString());
      } catch (e) { console.error(e); }
    }
    return null;
  };

  const publicKeyToUse = getPublicKey();
  const isConnected = !!publicKeyToUse;

  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);

  const [jitoValue, setJitoValue] = useState<number | null>(null);
  const [uptime, setUptime] = useState<number | null>(null);
  const [skipRate, setSkipRate] = useState<number | null>(null);
  const isSubmittingRef = useRef(false);

  // ✅ Инициализация Connection без WebSocket
  // const connection = useMemo(
  //   () => new Connection('https://solspy.org/api/rpc-proxy'),
  //   []
  // );
  const connection = useMemo(
    () => new Connection('https://mainnet.helius-rpc.com/?api-key=749e48d5-4f8a-4736-931a-d588a9f99cab', 'confirmed'),
    []
  );

  const cachedBlockhash = useRef<{ blockhash: string; lastValidBlockHeight: number } | null>(null);
  const cachedRentExempt = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const updateCache = async () => {
      try {
        const [blockhashInfo, rentExempt] = await Promise.all([
          connection.getLatestBlockhash(),
          connection.getMinimumBalanceForRentExemption(StakeProgram.space)
        ]);
        cachedBlockhash.current = blockhashInfo;
        cachedRentExempt.current = rentExempt;
      } catch (err: any) { console.error('Cache error:', err.message); }
    };
    updateCache();
    const interval = setInterval(updateCache, 30000);
    return () => clearInterval(interval);
  }, [isOpen, connection]);

  useEffect(() => {
    if (!isOpen || !isConnected || !publicKeyToUse) {
      setAvailableBalance(null);
      return;
    }
    // Removed AbortController as 'signal' option is not supported by getBalance with commitment string
    connection.getBalance(publicKeyToUse, 'confirmed')
      .then(lamports => setAvailableBalance(lamports / LAMPORTS_PER_SOL))
      .catch(() => setAvailableBalance(null));
    // No cleanup needed for AbortController if it's not used
  }, [isOpen, isConnected, publicKeyToUse, connection]);

  useEffect(() => {
    if (!isOpen) return;
    fetch("https://kobe.mainnet.jito.network/api/v1/steward_events?limit=1&event_type=ScoreComponentsV2&vote_account=53RJBy7aBGA7Aag6AryxEmBbsHDgwfBWagLrPbGHnfvR")
      .then(res => res.json())
      .then(data => {
        const score = Math.round(data.events[0].data.score * 10000) / 100;
        setJitoValue(score);
      }).catch(() => { });

    fetch("https://api.stakewiz.com/validator/53RJBy7aBGA7Aag6AryxEmBbsHDgwfBWagLrPbGHnfvR")
      .then(res => res.json())
      .then(data => {
        setSkipRate(Math.round(data.skip_rate * 100) / 100);
        setUptime(data.uptime);
      }).catch(() => { });
  }, [isOpen]);



  const handleConfirm = async () => {
    if (isSubmittingRef.current) return;
    if (!publicKeyToUse) {
      setAmountError('Wallet not connected');
      return;
    }
    if (!cachedBlockhash.current || !cachedRentExempt.current) {
      setAmountError('Loading details...');
      return;
    }

    const num = parseFloat(amount);
    if (isNaN(num) || num < MIN_STAKE) {
      setAmountError(`Minimum ${MIN_STAKE} SOL`);
      return;
    }
    if (availableBalance && num > availableBalance) {
      setAmountError('Insufficient balance');
      return;
    }

    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setMessage('Fetching fresh network data...');

      // Get fresh blockhash right before signing
      const { blockhash } = await connection.getLatestBlockhash('confirmed');

      const rentExempt =
        cachedRentExempt.current ||
        (await connection.getMinimumBalanceForRentExemption(StakeProgram.space));

      const lamports = Math.floor(num * LAMPORTS_PER_SOL) + rentExempt;

      const stakeAccount = Keypair.generate();

      const tx = new Transaction().add(
        StakeProgram.createAccount({
          fromPubkey: publicKeyToUse,
          stakePubkey: stakeAccount.publicKey,
          authorized: {
            staker: publicKeyToUse,
            withdrawer: publicKeyToUse,
          },
          lamports,
        }),
        StakeProgram.delegate({
          stakePubkey: stakeAccount.publicKey,
          authorizedPubkey: publicKeyToUse,
          votePubkey: VOTE_ACCOUNT,
        })
      );

      tx.feePayer = publicKeyToUse;
      tx.recentBlockhash = blockhash;

      // ────────────────────────────────────────────────
      //  Important: sign with wallet FIRST
      // ────────────────────────────────────────────────

      setMessage('Waiting for wallet signature...');

      const provider = (window as any).solana || (window as any).phantom?.solana;
      if (!provider?.signTransaction) {
        throw new Error('Wallet does not support signTransaction');
      }

      // Let Phantom sign first (this is what removes the warning)
      const signedTx = await provider.signTransaction(tx);

      // Then apply the stakeAccount signature
      signedTx.partialSign(stakeAccount);

      // Now send the fully signed transaction ourselves
      setMessage('Sending transaction...');

      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,           // recommended: let RPC simulate first
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      });

      setMessage('Confirming on-chain...');

      // Wait for confirmation
      let confirmed = false;
      for (let i = 0; i < 40; i++) {
        const { value: statuses } = await connection.getSignatureStatuses([signature]);
        const status = statuses[0];

        if (status?.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
        }

        if (
          status?.confirmationStatus === 'confirmed' ||
          status?.confirmationStatus === 'finalized'
        ) {
          confirmed = true;
          break;
        }

        await new Promise((r) => setTimeout(r, 2000));
      }

      if (!confirmed) {
        throw new Error('Confirmation timeout');
      }

      setIsSubmitting(false);
      isSubmittingRef.current = false;

      if (typeof window !== 'undefined' && (window as any).showSuccessPopup) {
        (window as any).showSuccessPopup(
          `Transaction Successful!\n\nSignature: ${signature}\n\nView on Solana Explorer: https://solana.fm/tx/${signature}`
        );
      }

    } catch (err: any) {
      console.error('TX Error:', err);
      setIsSubmitting(false);
      isSubmittingRef.current = false;

      if (err.code === 4001 || err.message?.includes('rejected')) {
        setAmountError('Transaction cancelled');
      } else if (err.code === -32603) {
        setAmountError('Internal wallet error (-32603). Check balance or try again.');
      } else {
        setAmountError(err.message || 'Transaction failed');
      }
    }
  };


  const handleConfirm1 = async () => {
    if (isSubmittingRef.current) return;
    if (!publicKeyToUse) { setAmountError('Wallet not connected'); return; }
    if (!cachedBlockhash.current || !cachedRentExempt.current) { setAmountError('Loading details...'); return; }

    const num = parseFloat(amount);
    if (isNaN(num) || num < MIN_STAKE) { setAmountError(`Minimum ${MIN_STAKE} SOL`); return; }
    if (availableBalance && num > availableBalance) { setAmountError(`Insufficient balance`); return; }

    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setMessage('Fetching fresh network data...');

      // Запрашиваем самый свежий blockhash прямо перед транзакцией
      const blockhashInfo = await connection.getLatestBlockhash('confirmed');
      const rentExempt = cachedRentExempt.current || await connection.getMinimumBalanceForRentExemption(StakeProgram.space);

      const lamports = Math.floor(num * LAMPORTS_PER_SOL) + rentExempt;
      const stakeAccount = Keypair.generate();

      const tx = new Transaction().add(
        StakeProgram.createAccount({
          fromPubkey: publicKeyToUse,
          stakePubkey: stakeAccount.publicKey,
          authorized: { staker: publicKeyToUse, withdrawer: publicKeyToUse },
          lamports,
        }),
        StakeProgram.delegate({
          stakePubkey: stakeAccount.publicKey,
          authorizedPubkey: publicKeyToUse,
          votePubkey: VOTE_ACCOUNT,
        })
      );

      tx.feePayer = publicKeyToUse;
      tx.recentBlockhash = blockhashInfo.blockhash;
      tx.partialSign(stakeAccount);

      const provider = (window as any).solana || (window as any).phantom?.solana;
      if (!provider?.signAndSendTransaction) throw new Error('No wallet provider available');

      setIsSubmitting(true);
      setMessage('Waiting for wallet signature...');

      provider.signAndSendTransaction(tx)
        .then((result: any) => {
          const signature = typeof result === 'string' ? result : (result.signature || result);
          console.log('✅ Signed:', signature);
          return signature;
        })
        .then(async (signature: string) => {
          setMessage('Confirming on-chain...');
          let confirmed = false;
          for (let i = 0; i < 40; i++) {
            const { value: statuses } = await connection.getSignatureStatuses([signature]);
            const status = statuses[0];
            if (status?.err) throw new Error('Transaction failed on-chain');
            if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
              confirmed = true;
              break;
            }
            await new Promise(r => setTimeout(r, 2000));
          }
          if (!confirmed) throw new Error('Confirmation timeout');
          return signature;
        })
        .then((signature: string) => {
          setIsSubmitting(false);
          isSubmittingRef.current = false;
          if (typeof window !== 'undefined' && (window as any).showSuccessPopup) {
            (window as any).showSuccessPopup(`Transaction Successful!\n\nSignature: ${signature}\n\nView on Solana Explorer: solana.fm/tx/${signature}`);
          }
        })
        .catch((err: any) => {
          console.error('TX Error:', err);
          setIsSubmitting(false);
          isSubmittingRef.current = false;
          if (err.code === 4001 || err.message?.includes('rejected')) {
            setAmountError('Transaction cancelled');
          } else if (err.code === -32603) {
            setAmountError('Internal wallet error (-32603). Check balance or try again.');
          } else {
            setAmountError(err.message || 'Transaction failed');
          }
        });

    } catch (err: any) {
      setIsSubmitting(false);
      setAmountError(err.message);
    }
  };

  useEffect(() => { if (isOpen) { setMessage(''); setAmountError(null); } }, [isOpen]);

  if (!isOpen) return null;

  // Add showSuccessPopup function to window object for WordPress integration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.showSuccessPopup = (message: string) => {
        // Закрываем основное окно стейкинга
        onClose();

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
        popup.style.marginTop = '120px';
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

          signatureContainer.appendChild(signatureTitle);
          signatureContainer.appendChild(signatureText);
        }

        // Create a div with red background to contain the close button
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'success-popup-button-container';

        // Create text above the button
        const buttonText = document.createElement('div');
        buttonText.textContent = "You can stake tokens in your wallet's `Staking` tab. Feeling fancy already? You should - your SOL in the right hands";
        buttonText.className = 'success-popup-button-text';

        buttonContainer.appendChild(buttonText);

        // Create explorer link
        const linkMatch = message.match(/(solana\.fm\/tx\/[A-Za-z0-9]+)/);
        if (linkMatch && linkMatch[1]) {
          const linkContainer = document.createElement('div');
          linkContainer.className = 'success-popup-link-container';

          const link = document.createElement('a');
          link.href = `https://${linkMatch[1]}`;
          link.textContent = 'View transaction on Solana Explorer';
          link.target = '_blank';
          link.className = 'success-popup-explorer-link-new';

          buttonContainer.appendChild(linkContainer);
          linkContainer.appendChild(link);
        }

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.className = 'success-popup-close-button';
        closeButton.onclick = () => {
          document.body.removeChild(container);
        };

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
      // ❌ Мы УДАЛИЛИ отсюда removeChild(existingContainer), 
      // чтобы попап успеха не исчезал при закрытии основного окна стейкинга.
    };
  }, []);

  return (
    <div className="stake-popup-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="stake-popup-content">
        <div className="stake-popup-header"></div>
        <div className="stake-popup-tips">
          Your trusted validator. Stake smart, earn more.
          <br />0% commission + 100 % MEV rewards. Keep every lamport!
        </div>

        <div className="flex">
          <div className="col-param">{uptime ?? '?'}%<br /><span>Uptime</span></div>
          <div className="col-param">{skipRate ?? '?'}%<br /><span>Skip Rate</span></div>
          <div className="col-param">{jitoValue ?? '?'}<br /><span>Jito Score</span></div>
        </div>

        <button onClick={onClose} className="success-popup-confirm-close">x</button>

        <div className="red-content-popup">
          <div className="red-content">
            <p className="text-amount">
              Available amount: <span className="amount-value">{availableBalance !== null ? availableBalance.toFixed(3) : (isConnected ? 'Loading...' : 'Connect wallet')}</span>
            </p>

            <div className="input-container">
              <span className="input-icon i-sol"></span>
              <input
                type="text"
                placeholder={`${MIN_STAKE} SOL`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="stake-input"
                disabled={isSubmitting}
                style={{ borderColor: amountError ? '#ff554f' : '#ccc', borderWidth: amountError ? 2 : 1 }}
              />
              {amountError && <div style={{ color: '#fff', marginTop: 5, fontWeight: 'bold', fontSize: '12px' }}>❌ {amountError}</div>}
              {message && <div style={{ color: '#fff', marginTop: 5, fontSize: '12px' }}>ℹ️ {message}</div>}
            </div>

            <div className="stake-button-container">
              <button
                onClick={handleConfirm}
                className="stake-submit-btn"
                disabled={isSubmitting || !isConnected}
                style={{ opacity: (isSubmitting || !isConnected) ? 0.4 : 1 }}
              >
                {isSubmitting ? 'Sending...' : 'Stake'}
              </button>
            </div>
            <span className="text-footer">The maximum stake is your balance minus 0.01, to ensure you have some SOL left for future transactions.</span>
          </div>
        </div>
      </div>
    </div>
  );
};