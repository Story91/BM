import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Initialize Redis client
const redis = new Redis({
  url: process.env.REDIS_URL as string,
  token: process.env.REDIS_TOKEN as string,
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const address = url.searchParams.get('address');
    
    if (!address) {
      return NextResponse.json({ 
        success: false, 
        error: 'Address is required' 
      }, { status: 400 });
    }
    
    // Get streak data for the user
    const userKey = `bm:streak:${address.toLowerCase()}`;
    const userData = await redis.hgetall(userKey) as {
      streak?: string;
      lastCheckIn?: string;
    } || {};
    
    const streak = parseInt(userData.streak || '0');
    const lastCheckIn = userData.lastCheckIn || null;
    
    return NextResponse.json({ 
      success: true, 
      streak, 
      lastCheckIn 
    });
    
  } catch (error) {
    console.error('Error fetching streak:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch streak data' 
    }, { status: 500 });
  }
} 