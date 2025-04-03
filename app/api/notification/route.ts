import { NextResponse } from 'next/server';

// This endpoint is required by MiniKit for sending notifications
// It acts as a proxy to avoid CORS restrictions
export async function POST(req: Request) {
  try {
    // Get the request body as JSON
    const body = await req.json();
    
    // Get Coinbase Frame notification URL and token
    const url = body.url;
    const token = body.token;
    const title = body.title;
    const bodyText = body.body;
    
    if (!url || !token || !title) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }
    
    // Forward the notification to Coinbase Frame
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        body: bodyText
      })
    });
    
    if (!response.ok) {
      throw new Error(`Notification failed with status: ${response.status}`);
    }
    
    const responseData = await response.json();
    
    return NextResponse.json({ 
      success: true, 
      data: responseData 
    });
    
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send notification' 
    }, { status: 500 });
  }
} 