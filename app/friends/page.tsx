"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { Identity, Avatar, Name } from "@coinbase/onchainkit/identity";

interface User {
  address: string;
  streak: number;
  lastCheckIn: string;
}

export default function FriendsPage() {
  const { address, isConnected } = useAccount();
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Fetch active users who checked in today
  useEffect(() => {
    async function fetchActiveUsers() {
      if (!address) return;

      setIsLoading(true);
      try {
        const response = await fetch('/api/active-users');
        const data = await response.json();
        
        if (data.success) {
          // Filter out current user
          const filteredUsers = data.users.filter((user: User) => 
            user.address.toLowerCase() !== address.toLowerCase()
          );
          setActiveUsers(filteredUsers);
        }
      } catch (error) {
        console.error("Error fetching active users:", error);
      } finally {
        setIsLoading(false);
      }
    }

    // Check if current user has remaining daily sends
    async function checkDailyLimit() {
      if (!address) return;
      
      try {
        const response = await fetch(`/api/send-limit?address=${address}`);
        const data = await response.json();
        
        if (data.success) {
          setDailyLimit(data.limitReached);
        }
      } catch (error) {
        console.error("Error checking daily limit:", error);
      }
    }

    fetchActiveUsers();
    checkDailyLimit();
  }, [address]);

  // Handle send BM
  const handleSendBM = async () => {
    if (!address || !selectedUser || isSending) return;
    
    setIsSending(true);
    setSendSuccess(false);
    
    try {
      const response = await fetch('/api/send-bm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: address,
          recipient: selectedUser
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSendSuccess(true);
        setSelectedUser(null);
        setDailyLimit(data.limitReached);
      } else if (data.limitReached) {
        setDailyLimit(true);
      }
    } catch (error) {
      console.error("Error sending BM:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = activeUsers.filter(user => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    // Check if address contains search term
    return user.address.toLowerCase().includes(searchLower);
    // Note: ENS names are automatically handled by the Identity component
  });

  return (
    <div className="flex flex-col min-h-screen font-sans items-center">
      <div className="w-screen max-w-[520px] modern-card min-h-screen">
        <header className="flex justify-between items-center py-3 px-4 border-b border-opacity-20 border-[var(--text-muted)]">
          <Link href="/" className="text-base font-mono font-bold text-[var(--foreground)]">
            Base Morning
          </Link>
          <div className="text-base font-mono text-[var(--text-muted)]">
            {isConnected && address && (
              <Identity address={address as `0x${string}`} className="!bg-inherit p-0">
                <Name className="text-inherit" />
              </Identity>
            )}
          </div>
        </header>

        <main className="flex flex-col py-6 px-5 pb-24">
          <div className="flex items-center mb-6">
            <Link href="/" className="mr-2 text-[var(--foreground)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Send BM to Friends</h1>
          </div>

          {!isConnected || !address ? (
            <div className="flex flex-col items-center justify-center h-[300px]">
              <p className="text-center text-[var(--text-muted)]">Please connect your wallet to send BM</p>
            </div>
          ) : dailyLimit ? (
            <div className="p-4 bg-[var(--secondary)] border border-[var(--accent)] border-opacity-20 rounded-lg mb-4">
              <p className="text-center text-[var(--accent)]">
                You&apos;ve reached your daily limit for sending BM! Come back tomorrow to send more.
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center items-center h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--accent)]"></div>
            </div>
          ) : activeUsers.length === 0 ? (
            <div className="p-4 bg-[var(--secondary)] border border-[var(--text-muted)] border-opacity-20 rounded-lg">
              <p className="text-center text-[var(--foreground)]">
                No active users found. Come back later when more people have checked in today!
              </p>
            </div>
          ) : (
            <>
              {sendSuccess && (
                <div className="p-4 bg-[var(--secondary)] border border-[var(--accent)] border-opacity-20 rounded-lg mb-4">
                  <p className="text-center text-[var(--accent)]">BM sent successfully!</p>
                </div>
              )}
              
              <div className="mb-4">
                <p className="text-sm text-[var(--text-muted)] mb-2">
                  Select a friend who checked in today to send them BM. They&apos;ll receive a notification!
                </p>
              </div>
              
              {/* Search input */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by address or ENS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 bg-[var(--secondary)] border border-[var(--text-muted)] border-opacity-30 rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              
              <div className="border border-[var(--secondary)] rounded-lg overflow-hidden bg-[var(--card-bg)] shadow-md">
                <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--primary)] scrollbar-track-[var(--secondary)]">
                  {filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-[var(--text-muted)]">
                      No users found matching your search
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div 
                        key={user.address}
                        className={`flex justify-between items-center p-3 hover:bg-[var(--secondary)] border-b border-[var(--secondary)] last:border-b-0 cursor-pointer ${
                          selectedUser === user.address ? 'bg-[var(--primary)] bg-opacity-20' : ''
                        }`}
                        onClick={() => setSelectedUser(user.address)}
                      >
                        <div className="flex items-center">
                          <Identity
                            address={user.address as `0x${string}`}
                            className="!bg-inherit p-0 [&>div]:space-x-2"
                          >
                            <Avatar className="w-8 h-8" />
                            <Name className="text-inherit font-medium" />
                          </Identity>
                        </div>
                        <div className="text-sm text-[var(--text-muted)]">
                          {user.streak} day streak
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </main>

        <footer className="fixed bottom-0 left-0 right-0 max-w-[520px] mx-auto border-t border-opacity-20 border-[var(--text-muted)] backdrop-blur-md bg-[var(--card-bg)] bg-opacity-80 z-10">
          <div className="flex w-full px-3 py-3 justify-between items-center">
            <Link
              href="/"
              className="px-5 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]"
            >
              Back to Streak
            </Link>
            
            {isConnected && !dailyLimit && (
              <button
                type="button"
                onClick={handleSendBM}
                disabled={!selectedUser || isSending}
                className={`px-5 py-2 rounded-lg font-bold text-white ${
                  !selectedUser || isSending
                    ? 'bg-[var(--secondary)] opacity-60'
                    : 'modern-button active:scale-[0.98] transition-all'
                }`}
              >
                {isSending ? 'Sending...' : 'SEND BM'}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
} 