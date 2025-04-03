import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Initialize Redis client
const redis = new Redis({
  url: process.env.REDIS_URL as string,
  token: process.env.REDIS_TOKEN as string,
});

// Funkcja pomocnicza do sprawdzenia, czy check-in był dzisiaj
function isToday(dateString: string): boolean {
  const checkInDate = new Date(dateString);
  const today = new Date();
  
  return (
    checkInDate.getDate() === today.getDate() &&
    checkInDate.getMonth() === today.getMonth() &&
    checkInDate.getFullYear() === today.getFullYear()
  );
}

export async function GET() {
  try {
    // Pobierz wszystkie klucze pasujące do wzorca streak
    const streakKeys = await redis.keys('bm:streak:*');
    
    if (!streakKeys || streakKeys.length === 0) {
      return NextResponse.json({ 
        success: true, 
        users: [] 
      });
    }
    
    // Pobierz dane dla każdego użytkownika
    const usersPromises = streakKeys.map(async (key) => {
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
    });
    
    const allUsers = await Promise.all(usersPromises);
    
    // Filtruj tylko użytkowników, którzy zrobili check-in dzisiaj
    const activeUsers = allUsers.filter(user => 
      user.lastCheckIn && isToday(user.lastCheckIn)
    );
    
    return NextResponse.json({ 
      success: true, 
      users: activeUsers
    });
    
  } catch (error) {
    console.error('Error fetching active users:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch active users' 
    }, { status: 500 });
  }
} 