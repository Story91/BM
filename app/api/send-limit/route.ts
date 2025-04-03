import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Initialize Redis client
const redis = new Redis({
  url: process.env.REDIS_URL as string,
  token: process.env.REDIS_TOKEN as string,
});

// Funkcja pomocnicza do sprawdzenia, czy data była dzisiaj
function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

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
    
    // Pobierz informacje o wysłanych BM
    const sendKey = `bm:sends:${address.toLowerCase()}`;
    const sendData = await redis.hgetall(sendKey) as {
      count?: string;
      lastSent?: string;
    } || {};
    
    // Jeśli nie ma wcześniejszych wysłań lub ostatnie wysłanie nie było dzisiaj
    if (!sendData.lastSent || !isToday(sendData.lastSent)) {
      return NextResponse.json({ 
        success: true, 
        limitReached: false,
        count: 0,
        limit: 1  // Można zmienić limit jeśli potrzeba
      });
    }
    
    // Jeśli wysłano dzisiaj, sprawdź licznik
    const count = parseInt(sendData.count || '0');
    const dailyLimit = 1;  // Limit 1 BM dziennie na użytkownika
    
    return NextResponse.json({ 
      success: true, 
      limitReached: count >= dailyLimit,
      count,
      limit: dailyLimit
    });
    
  } catch (error) {
    console.error('Error checking send limit:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check send limit' 
    }, { status: 500 });
  }
} 