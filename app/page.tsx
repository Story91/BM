"use client";

import {
  useMiniKit,
  useAddFrame,
  useNotification
} from "@coinbase/onchainkit/minikit";
import { Name, Identity, Avatar } from "@coinbase/onchainkit/identity";
import {
  ConnectWallet
} from "@coinbase/onchainkit/wallet";
import { useCallback, useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import {
  Transaction,
  TransactionButton,
  TransactionToast,
  TransactionToastAction,
  TransactionToastIcon,
  TransactionToastLabel,
} from "@coinbase/onchainkit/transaction";
import Link from "next/link";

// Definiujemy interfejs dla wpisów w leaderboard
interface LeaderboardEntry {
  address: string;
  streak: number;
}

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const addFrame = useAddFrame();
  const sendNotification = useNotification();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationSent, setNotificationSent] = useState(false);
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [hoursRemaining, setHoursRemaining] = useState(0);

  // Set frame ready
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);
  
  // Funkcja do pobierania danych o streaku użytkownika
  const fetchUserStreak = useCallback(async () => {
    if (!address) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/streak?address=${address}`);
      const data = await response.json();
      
      console.log("Fetched streak data:", data);
      
      if (data.success) {
        setCurrentStreak(data.streak || 0);
        if (data.lastCheckIn) {
          setLastCheckIn(data.lastCheckIn);
          
          // Sprawdzamy czy minęło 24h od ostatniego check-in
          const lastCheckDate = new Date(data.lastCheckIn);
          const now = new Date();
          const hoursElapsed = (now.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60);
          
          if (hoursElapsed < 24) {
            setCanCheckIn(false);
            setHoursRemaining(Math.ceil(24 - hoursElapsed));
          } else {
            setCanCheckIn(true);
          }
          
          // Sprawdzamy czy minęło 48h (resetowanie streaka)
          if (hoursElapsed > 48) {
            // Streak zostanie zresetowany przy następnym check-in
            console.log("Streak będzie zresetowany - minęło ponad 48h");
          }
        }
        
        if (data.notifications && data.notifications.length > 0) {
          // Obsługa powiadomień
          for (const notification of data.notifications) {
            if (notification.type === 'streak_reminder') {
              // Obsługa przypomnienia o streaku
              if (context?.client.added) {
                sendNotification({
                  title: 'Streak Reminder!',
                  body: `You have ${notification.hoursLeft} hours left to check in`
                }).catch(console.error);
              }
            } else if (notification.type === 'bm_received') {
              // Obsługa otrzymania BM
              if (context?.client.added) {
                sendNotification({
                  title: 'Someone sent you BM!',
                  body: 'Check your notifications to see who sent you BM'
                }).catch(console.error);
              }
            }
          }
        }
        
        if (data.streakReset) {
          setShowStats(true);
        } else {
          // Tylko jeśli mamy streak > 0, pokazujemy statystyki
          setShowStats(data.streak > 0);
        }
      }
    } catch (error) {
      console.error("Error fetching streak:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address, context, sendNotification]);
  
  // Dodajemy fetchUserStreak do zależności useEffect
  useEffect(() => {
    if (address) {
      fetchUserStreak();
    } else {
      // Resetujemy dane jeśli nie mamy adresu (wylogowano)
      setCurrentStreak(0);
      setLastCheckIn(null);
      setShowStats(false);
    }
  }, [address, fetchUserStreak]);

  // Reset user data on logout
  useEffect(() => {
    if (!isConnected || !address) {
      setCurrentStreak(0);
      setLastCheckIn(null);
      setShowStats(false);
      if (showLeaderboard) setShowLeaderboard(false);
    }
  }, [isConnected, address, showLeaderboard]);
  
  const loadLeaderboard = useCallback(async () => {
    if (showLeaderboard) {
      setIsLoadingLeaderboard(true);
      try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();
        if (data.success) {
          setLeaderboardData(data.streaks);
        }
      } catch (error) {
        console.error("Error loading leaderboard:", error);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    }
  }, [showLeaderboard]);
  
  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);
  
  const handleAddFrame = async () => {
    try {
      const result = await addFrame();
      
      // Dokładnie tak jak w dokumentacji, z zabezpieczeniem
      if (result) {
        console.log('Frame added:', result.url, result.token);
        alert('Frame added successfully!');
      } else {
        console.log('Frame add operation completed, but result is empty');
      }
    } catch (err) {
      console.error('Error adding frame:', err);
    }
  };

  const handleCheckIn = async () => {
    if (!address || !canCheckIn) return;
    
    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentStreak(data.streak);
        setLastCheckIn(data.lastCheckIn);
        setShowStats(true);
        
        // Ustawiamy, że użytkownik nie może zrobić check-in przez 24h
        setCanCheckIn(false);
        setHoursRemaining(24);
        
        // Send notification if milestone is reached
        if (data.milestone && context?.client.added && !notificationSent) {
          try {
            await sendNotification({
              title: 'Streak Milestone! 🔥',
              body: `Congratulations! You've reached a ${data.streak}-day streak!`
            });
            setNotificationSent(true);
          } catch (notifError) {
            console.error("Error sending notification:", notifError);
          }
        }
      } else if (data.tooSoon) {
        alert(`You already checked in today. Next check-in available in ${data.hoursRemaining} hours.`);
      }
    } catch (error) {
      console.error("Error checking in:", error);
    }
  };

  const handleShare = useCallback(async () => {
    // Używamy window.location.origin zamiast hardcodowanego URL
    const appUrl = window.location.origin;
    
    // Przygotowanie tekstu do udostępnienia
    const shareText = `🔥 My BM streak: ${currentStreak} days! 🔥\n\nJoin me on Base Morning and start your daily streak:\n${appUrl}\n\n#BaseMorning #DailyStreak`;
    
    try {
      // Próbujemy użyć Web Share API jeśli jest dostępne
      if (navigator.share) {
        await navigator.share({
          title: 'Base Morning Streak',
          text: shareText,
          url: appUrl
        });
        return;
      }
      
      // Fallback - kopiujemy tekst do schowka
      await navigator.clipboard.writeText(shareText);
      
      // Pokazujemy komunikat o sukcesie
      alert('Share text copied to clipboard! You can now paste it in your social media.');
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback do kopiowania do schowka w przypadku błędu
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Share text copied to clipboard! You can now paste it in your social media.');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        alert('Could not share. Please try again.');
      }
    }
  }, [currentStreak]);

  // Component for the streak view with updated typing
  const StreakView = ({
    currentStreak,
    lastCheckIn,
    showStats,
    handleCheckIn,
    handleShare
  }: {
    currentStreak: number;
    lastCheckIn: string | null;
    showStats: boolean;
    handleCheckIn: () => void;
    handleShare: () => void;
  }) => (
    <>
      <div className="text-center mb-6">
        <div className="mb-4 mx-auto">
          {/* Icon placeholder */}
        </div>
        <h2 className="text-6xl font-bold mb-2 text-[var(--foreground)]">{currentStreak}</h2>
        <p className="text-2xl font-semibold text-[var(--foreground)]">Day Streak</p>
        {lastCheckIn && (
          <p className="text-base text-[var(--text-muted)] mt-3">
            Last check-in: {new Date(lastCheckIn).toLocaleDateString()}
          </p>
        )}
      </div>
      
      <div className="flex flex-col items-center mt-4 mb-8">
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={!canCheckIn}
          className={`w-28 h-28 rounded-full flex items-center justify-center font-bold text-xl mb-3 shadow-lg transition-transform ${
            canCheckIn 
              ? "active:scale-95 bg-white text-[#0060FF]" 
              : "opacity-50 bg-white text-[#0060FF] cursor-not-allowed opacity-60"
          }`}
        >
          BM
        </button>
        {canCheckIn ? (
          <p className="text-base text-[var(--text-muted)]">Press to start or continue your streak</p>
        ) : (
          <p className="text-base text-[var(--accent)]">Next check-in available in {hoursRemaining}h</p>
        )}
      </div>
      
      {showStats && [7, 10, 30, 60, 100].includes(currentStreak) && (
        <div className="mt-4 mb-8 w-full max-w-[400px]">
          <p className="text-center mb-4 text-[var(--foreground)]">You&apos;ve reached a milestone! Attest your streak onchain:</p>
          <Transaction>
            <TransactionButton
              text={`ATTEST ${currentStreak} DAY STREAK`}
              className="mx-auto w-full"
            />
            <TransactionToast className="mb-4">
              <TransactionToastIcon />
              <TransactionToastLabel />
              <TransactionToastAction />
            </TransactionToast>
          </Transaction>
        </div>
      )}
      
      <div className="w-full max-w-[380px] px-4 mt-6">
        <button
          type="button"
          onClick={handleShare}
          className="w-full py-2 px-3 rounded-full border border-[var(--text-muted)] border-opacity-40 font-medium text-center text-base uppercase tracking-wide text-[var(--foreground)] hover:bg-[var(--secondary)] transition-all"
        >
          SHARE
        </button>
      </div>
    </>
  );

  // Component for leaderboard view
  const LeaderboardView = ({
    leaderboardData,
    isLoadingLeaderboard,
    loadLeaderboard,
    address,
    currentStreak
  }: {
    leaderboardData: LeaderboardEntry[];
    isLoadingLeaderboard: boolean;
    loadLeaderboard: () => void;
    address: string | undefined;
    currentStreak: number;
  }) => (
    <div className="w-full max-w-md mt-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-center flex-grow text-[var(--foreground)]">STREAK LEADERBOARD</h2>
        <button 
          className="text-xs bg-[var(--accent)] hover:opacity-90 text-black px-2 py-1 rounded-full" 
          onClick={loadLeaderboard}
        >
          Refresh
        </button>
      </div>
      
      {isLoadingLeaderboard ? (
        <div className="flex justify-center items-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--accent)]"></div>
        </div>
      ) : (
        <div className="border border-[var(--secondary)] rounded-lg overflow-hidden bg-[var(--card-bg)] shadow-md text-sm">
          {leaderboardData.length === 0 ? (
            <p className="text-center text-[var(--text-muted)] py-4">No streaks yet! Be the first to start one.</p>
          ) : (
            <>
              {/* Header row */}
              <div className="grid grid-cols-12 bg-[var(--secondary)] py-2 px-3 font-semibold border-b border-[var(--secondary)]">
                <div className="col-span-1 text-[var(--text-muted)]">#</div>
                <div className="col-span-8 text-[var(--foreground)]">User</div>
                <div className="col-span-3 text-right text-[var(--foreground)]">Streak</div>
              </div>
              
              {/* Scrollable container for leaderboard entries */}
              <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--primary)] scrollbar-track-[var(--secondary)]">
                {/* Leaderboard entries - pokazujemy wszystkich użytkowników */}
                {leaderboardData.map((entry, index) => (
                  <div 
                    key={`${entry.address}-${index}`}
                    className="grid grid-cols-12 py-2 px-3 hover:bg-[var(--secondary)] border-b border-[var(--secondary)] last:border-b-0 items-center"
                  >
                    <div className="col-span-1 text-[var(--text-muted)]">{index + 1}</div>
                    <div className="col-span-8">
                      <Identity
                        address={entry.address as `0x${string}`}
                        className="!bg-inherit p-0 [&>div]:space-x-2"
                      >
                        <Avatar className="w-5 h-5" />
                        <Name className="text-inherit text-xs" />
                      </Identity>
                    </div>
                    <div className="col-span-3 font-bold text-right flex items-center justify-end">
                      <span className="text-[var(--foreground)]">{entry.streak}</span>
                      <span className="ml-1 text-xs text-[var(--text-muted)]">days</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Your position */}
              {address && currentStreak > 0 && (
                <div className="bg-[var(--primary)] bg-opacity-20 py-2 px-3 border-t border-[var(--primary)] border-opacity-30">
                  <div className="text-center text-[var(--foreground)] font-medium text-xs">
                    Your current streak: {currentStreak} days
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen font-sans items-center relative">
      <div className="w-screen max-w-[520px] modern-card min-h-screen">
        <header className="flex justify-between items-center py-3 px-4 border-b border-opacity-20 border-[var(--text-muted)]">
          <div className="text-base font-mono font-bold text-[var(--foreground)]">
            {isConnected && address ? (
              <Identity address={address as `0x${string}`} className="!bg-inherit p-0">
                <Name className="text-inherit" />
              </Identity>
            ) : (
              "Base Morning"
            )}
          </div>
          <div className="flex items-center space-x-6">
            {isConnected ? (
              <button
                type="button"
                onClick={() => disconnect()}
                className="modern-button px-4 py-2"
              >
                LOGOUT
              </button>
            ) : (
              <ConnectWallet>
                <button className="modern-button px-4 py-2">
                  LOGIN
                </button>
              </ConnectWallet>
            )}
          </div>
        </header>

        <main className="flex flex-col items-center justify-start py-6 px-5 pb-20">
          <h1 className="text-4xl font-bold mb-6 text-[var(--foreground)]">Base Morning</h1>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold mb-3 text-[var(--foreground)]">Welcome to Base Morning</h2>
                <p className="text-[var(--text-muted)] max-w-md px-4">
                  Your daily check-in app to build consistency and earn rewards. 
                  Connect your wallet to track your daily streak!
                </p>
              </div>
              <div className="flex justify-center items-center h-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--accent)]"></div>
              </div>
              <p className="text-sm text-[var(--text-muted)]">Connect your wallet</p>
            </div>
          ) : !address ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-lg text-center mb-2 text-[var(--foreground)]">Connect your wallet to start your daily streak</p>
              <p className="text-sm text-center text-[var(--text-muted)] max-w-md">
                Base Morning helps you build healthy habits by checking in daily. 
                Connect your wallet using the LOGIN button above to start tracking your streak.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full">
              {showLeaderboard ? (
                <LeaderboardView 
                  leaderboardData={leaderboardData}
                  isLoadingLeaderboard={isLoadingLeaderboard}
                  loadLeaderboard={loadLeaderboard}
                  address={address}
                  currentStreak={currentStreak}
                />
              ) : (
                <StreakView 
                  currentStreak={currentStreak}
                  lastCheckIn={lastCheckIn}
                  showStats={showStats}
                  handleCheckIn={handleCheckIn}
                  handleShare={handleShare}
                />
              )}
            </div>
          )}
        </main>

        <footer className="fixed bottom-0 left-0 right-0 max-w-[520px] mx-auto border-t border-opacity-20 border-[var(--text-muted)] backdrop-blur-md bg-[var(--card-bg)] bg-opacity-80 z-10">
          <div className="flex w-full px-3 py-2 justify-between">
            {!context?.client.added ? (
              <button
                type="button"
                className="px-3 py-1 rounded-full text-[var(--text-muted)] border border-[var(--text-muted)] border-opacity-30 text-xs hover:bg-[var(--secondary)] transition-colors"
                onClick={handleAddFrame}
              >
                ADD FRAME
              </button>
            ) : (
              <button
                type="button"
                className="px-3 py-1 rounded-full text-[var(--accent)] border border-[var(--accent)] border-opacity-30 text-xs bg-[var(--secondary)] bg-opacity-30 flex items-center space-x-1"
                disabled
              >
                <span className="text-[var(--accent)] mr-1">✓</span> FRAME ADDED
              </button>
            )}
            
            <div className="flex space-x-2">
              <Link
                href="/friends"
                className="modern-button px-3 py-1 text-xs"
              >
                SEND BM
              </Link>
              
              <button
                type="button"
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className="modern-button px-3 py-1 text-xs"
              >
                {showLeaderboard ? 'SHOW STREAK' : 'LEADERBOARD'}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
