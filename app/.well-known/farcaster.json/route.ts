import { NextResponse } from 'next/server';

// Farcaster manifest required for mini-apps
export async function GET() {
  return NextResponse.json({
    accountAssociation: {
      header: process.env.FARCASTER_HEADER,
      payload: process.env.FARCASTER_PAYLOAD,
      signature: process.env.FARCASTER_SIGNATURE
    },
    frame: {
      version: process.env.NEXT_PUBLIC_VERSION || "next",
      name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Base Morning",
      iconUrl: process.env.NEXT_PUBLIC_ICON_URL || "https://bm-five-nu.vercel.app/bm-splash.png",
      splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE_URL || "https://bm-five-nu.vercel.app/bm-splash.png",
      splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "#0060FF",
      homeUrl: process.env.NEXT_PUBLIC_HOME_URL || "https://bm-five-nu.vercel.app",
      imageUrl: process.env.NEXT_PUBLIC_IMAGE_URL || "https://bm-five-nu.vercel.app/bm-splash.png"
    }
  });
}
