import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Initialize Redis client
const redis = new Redis({
  url: process.env.REDIS_URL as string,
  token: process.env.REDIS_TOKEN as string,
});

export async function GET() {
  try {
    // Get all keys matching our streak pattern
    const streakKeys = await redis.keys('bm:streak:*');
    
    if (!streakKeys || streakKeys.length === 0) {
      return NextResponse.json({ 
        success: true, 
        streaks: [] 
      });
    }
    
    // Fetch data for each user
    const streakData = await Promise.all(
      streakKeys.map(async (key) => {
        const address = key.replace('bm:streak:', '');
        const userData = await redis.hgetall(key) as {
          streak?: string;
          lastCheckIn?: string;
        } || {};
        
        const streak = parseInt(userData.streak || '0');
        const lastCheckIn = userData.lastCheckIn || null;
        
        return {
          address,
          streak,
          lastCheckIn
        };
      })
    );
    
    // Sort by streak count descending
    const sortedStreaks = streakData
      .filter(data => data.streak > 0)
      .sort((a, b) => b.streak - a.streak);
    
    return NextResponse.json({ 
      success: true, 
      streaks: sortedStreaks
    });
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch leaderboard data' 
    }, { status: 500 });
  }
} 