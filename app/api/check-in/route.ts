import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Initialize Redis client
const redis = new Redis({
  url: process.env.REDIS_URL as string,
  token: process.env.REDIS_TOKEN as string,
});

// Check if two dates are the same calendar day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Check if second date is exactly one day after the first date
function isConsecutiveDay(date1: Date, date2: Date): boolean {
  // Clone date1 and add 1 day
  const nextDay = new Date(date1);
  nextDay.setDate(nextDay.getDate() + 1);
  
  return isSameDay(nextDay, date2);
}

export async function POST(request: Request) {
  try {
    const { address } = await request.json();
    
    if (!address) {
      return NextResponse.json({ 
        success: false, 
        message: 'Address is required' 
      }, { status: 400 });
    }

    // Używamy obiektu Date zamiast timestamp
    const now = new Date();
    
    // Get current streak data for the user
    const userKey = `bm:streak:${address.toLowerCase()}`;
    const userData = await redis.hgetall(userKey) as {
      streak?: string;
      lastCheckIn?: string;
    } || {};
    
    let streak = parseInt(userData.streak || '0');
    const lastCheckIn = userData.lastCheckIn ? new Date(userData.lastCheckIn) : null;
    
    // Handle different check-in scenarios
    if (!lastCheckIn) {
      // First time check-in
      streak = 1;
    } else if (isSameDay(lastCheckIn, now)) {
      // Already checked in today
      return NextResponse.json({ 
        success: true, 
        streak,
        lastCheckIn: lastCheckIn.toISOString(),
        message: 'Already checked in today'
      });
    } else if (isConsecutiveDay(lastCheckIn, now)) {
      // Consecutive day check-in
      streak += 1;
    } else {
      // Streak broken
      streak = 1;
    }

    // Check if the user hit a milestone
    const milestone = [7, 10, 30, 60, 100].includes(streak);
    
    // Aktualizujemy leaderboard
    const leaderboardKey = 'bm:leaderboard';
    const memberAddress = address.toLowerCase();
    
    // Najpierw usuwamy stare wpisy tego użytkownika, jeśli istnieją
    await redis.zrem(leaderboardKey, memberAddress);
    await redis.zrem(leaderboardKey, address); // na wszelki wypadek sprawdzamy też oryginalny format
    
    // Dodajemy nowy wpis z aktualnym streak
    await redis.zadd(leaderboardKey, { score: streak, member: memberAddress });
    
    // Save updated streak data
    await redis.hset(userKey, {
      streak: streak.toString(),
      lastCheckIn: now.toISOString()
    });
    
    // For milestones, we may want to save extra data for EAS attestation later
    if (milestone) {
      await redis.hset(`bm:milestone:${address.toLowerCase()}`, {
        milestone: streak.toString(),
        timestamp: now.toISOString()
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      streak, 
      lastCheckIn: now.toISOString(),
      milestone
    });
    
  } catch (error) {
    console.error('Error checking in:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error' 
    }, { status: 500 });
  }
} 