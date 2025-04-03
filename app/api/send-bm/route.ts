import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { sendFrameNotification } from "@/lib/notification-client";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sender, recipient } = body;
    
    if (!sender || !recipient) {
      return NextResponse.json({ 
        success: false, 
        error: 'Sender and recipient are required' 
      }, { status: 400 });
    }
    
    // Sprawdź czy nadawca i odbiorca zrobili check-in dzisiaj
    const senderKey = `bm:streak:${sender.toLowerCase()}`;
    const recipientKey = `bm:streak:${recipient.toLowerCase()}`;
    
    const [senderData, recipientData] = await Promise.all([
      redis.hgetall(senderKey) as Promise<{ lastCheckIn?: string } | null>,
      redis.hgetall(recipientKey) as Promise<{ lastCheckIn?: string; streak?: string } | null>
    ]);
    
    if (!senderData?.lastCheckIn || !isToday(senderData.lastCheckIn)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Sender must check in today before sending BM' 
      }, { status: 400 });
    }
    
    if (!recipientData?.lastCheckIn || !isToday(recipientData.lastCheckIn)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Recipient must check in today to receive BM' 
      }, { status: 400 });
    }
    
    // Sprawdź dzienny limit wysyłania
    const sendKey = `bm:sends:${sender.toLowerCase()}`;
    const sendData = await redis.hgetall(sendKey) as {
      count?: string;
      lastSent?: string;
    } || {};
    
    const dailyLimit = 1; // Limit 1 BM dziennie na użytkownika
    let count = 0;
    
    // Jeśli ostatnie wysłanie było dzisiaj, zwiększ licznik
    if (sendData.lastSent && isToday(sendData.lastSent)) {
      count = parseInt(sendData.count || '0');
      
      // Sprawdź czy przekroczono limit
      if (count >= dailyLimit) {
        return NextResponse.json({ 
          success: false, 
          limitReached: true,
          error: 'Daily send limit reached' 
        }, { status: 400 });
      }
      
      count++;
    } else {
      // Pierwsza wysyłka dzisiaj
      count = 1;
    }
    
    // Zapisz informacje o wysłaniu
    const now = new Date();
    await redis.hset(sendKey, {
      count: count.toString(),
      lastSent: now.toISOString()
    });
    
    // Zapisz BM w historii odbiorcy
    const recipientBmKey = `bm:received:${recipient.toLowerCase()}`;
    await redis.lpush(recipientBmKey, JSON.stringify({
      sender: sender.toLowerCase(),
      timestamp: now.toISOString()
    }));
    
    // Zwiększ streak odbiorcy
    if (recipientData && recipientData.lastCheckIn) {
      const recipientStreak = parseInt(recipientData.streak || '1');
      
      // Zwiększ streak o 1 
      const newStreak = recipientStreak + 1;
      
      // Zapisz zaktualizowany streak
      await redis.hset(recipientKey, {
        streak: newStreak.toString(),
        // Nie aktualizujemy lastCheckIn, żeby użytkownik nadal mógł zrobić normalny check-in
      });
      
      // Aktualizacja na leaderboard
      const leaderboardKey = 'bm:leaderboard';
      await redis.zrem(leaderboardKey, recipient.toLowerCase());
      await redis.zadd(leaderboardKey, { score: newStreak, member: recipient.toLowerCase() });
    }
    
    // Spróbuj wysłać powiadomienie
    try {
      // Pobierz FID dla użytkownika z Farcaster (uproszczone, w praktyce potrzebna relacja adres -> fid)
      const userFidKey = `bm:fid:${recipient.toLowerCase()}`;
      const fid = await redis.get(userFidKey);
      
      if (fid && typeof fid === 'number') {
        await sendFrameNotification({
          fid,
          title: 'You received BM!',
          body: 'Someone sent you BM. Check your notifications!'
        });
      }
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
      // Kontynuuj, nawet jeśli nie udało się wysłać powiadomienia
    }
    
    // Zwróć sukces
    return NextResponse.json({ 
      success: true, 
      limitReached: count >= dailyLimit
    });
    
  } catch (error) {
    console.error('Error sending BM:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send BM' 
    }, { status: 500 });
  }
} 