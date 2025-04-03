import { NextResponse } from 'next/server';

// Farcaster manifest required for mini-apps
export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL;

  return NextResponse.json({
    accountAssociation: {
      header: process.env.FARCASTER_HEADER,
      payload: process.env.FARCASTER_PAYLOAD,
      signature: process.env.FARCASTER_SIGNATURE
    },
    frame: {
      version: process.env.NEXT_PUBLIC_VERSION || "vNext",
      name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Base Morning",
      homeUrl: URL,
      iconUrl: process.env.NEXT_PUBLIC_ICON_URL,
      imageUrl: process.env.NEXT_PUBLIC_IMAGE_URL,
      buttonTitle: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Base Morning"}`,
      splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE_URL,
      splashBackgroundColor: `#${process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "0060FF"}`,
      webhookUrl: `${URL}/api/webhook`
    }
  });
}
