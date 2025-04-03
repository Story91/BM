# Base Morning

Base Morning is an application for building daily habits through a check-in and streak system. The app rewards consistency and allows users to track their progress and compete with friends.

## Features

- **Daily check-ins** - Log in every day to maintain your streak
- **Streak system** - Build a chain of consistent check-ins
- **Leaderboard** - Compete with other users
- **Milestone rewards** - Receive special rewards for achieving specific streaks (7, 10, 30, 60, 100 days)
- **Notifications** - Get reminders about check-ins and information about new messages
- **Sharing** - Share your achievements on social media
- **Sending BM** - Send BM (Base Morning) to friends who have also checked in

## How We Meet the Challenge

### Utilizing notifications:
- We implemented a daily check-in reminder system to help users maintain their streaks
- Notifications when receiving "BM" from other community members
- Special milestone notifications when reaching significant streak milestones (7, 10, 30, 60, 100 days)

### Social graph integration:
- Ability to send "BM" to friends as a form of social support
- Leaderboard showing the longest streaks in the community
- Option to share achievements on social media
- On-chain attestations of important achievements on the Base blockchain

### Uniqueness of the solution:
- We combine gamification with positive habit formation
- We introduce a social dimension of accountability and support
- We leverage blockchain for verifiable confirmation of achievements
- We create a daily routine of interaction with Web3, building wider adoption

## Streak Counting Rules

1. **Starting a streak**
   - A streak begins with the first check-in
   - The initial streak value is 1

2. **Maintaining a streak**
   - To maintain a streak, you must check in every consecutive day
   - Check-in can only be done once every 24 hours
   - After checking in, the BM button will be unavailable for 24 hours

3. **Resetting a streak**
   - If you don't check in for 48 hours, your streak will be reset
   - On the next check-in after a break longer than 48 hours, the streak returns to a value of 1

4. **Milestones**
   - Special rewards/attestations for streaks of lengths: 7, 10, 30, 60, and 100 days
   - Ability to certify achievements on-chain through the Base blockchain

## How to Use the App

### Logging In
1. Open the Base Morning application
2. Click the "LOGIN" button in the upper right corner
3. Connect your wallet (Metamask, Coinbase Wallet, or other compatible wallet)

### Daily Check-in
1. After logging in, press the large blue "BM" button in the center of the screen
2. Your streak will be increased by 1 or reset to 1 (if the break was longer than 48h)
3. The check-in button will be unavailable for 24 hours
4. The app will display information about how many hours remain until the next possible check-in

### Leaderboard
1. Click the "LEADERBOARD" button at the bottom of the screen to see the user ranking
2. You will see a list of users with the longest streaks
3. If you have an active streak, you will see your position at the end of the list
4. Click "SHOW STREAK" to return to your streak view

### Sending BM to Friends
1. Click the "SEND BM" button at the bottom of the screen
2. Select a person from the list of active users (who have checked in that day)
3. Click the "SEND BM" button
4. You can only send 1 BM per day

### Sharing Achievements
1. Click the "SHARE" button below the streak counter
2. Text with information about your streak and a link to the app will be copied
3. Paste the text in your chosen social media or send it to friends

## Troubleshooting

- **I can't check in** - Check if 24 hours have passed since your last check-in
- **My streak has been reset** - Check if more than 48 hours have passed since your last check-in
- **I don't see the SEND BM button** - You must first check in to be able to send BM to others

## Technologies

Base Morning runs on the Base blockchain and uses:
- Next.js
- OnchainKit
- Redis for storing streak data
- Web3 for blockchain interaction

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-onchain --mini`]().

## For Developers

To run the development environment:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about OnchainKit, see our [documentation](https://onchainkit.xyz/getting-started).

To learn more about Next.js, see the [Next.js documentation](https://nextjs.org/docs).
