import { Redis } from "npm:ioredis";

async function checkRedis() {
  const redis = new Redis({
    host: "localhost",
    port: 6379,
    password: 'mypassword',
  });

  try {
    // Get all keys
    const keys = await redis.keys('*');
    console.log('\nFound keys:', keys);

    // Check savedGames content
    const savedGames = await redis.get('savedGames');
    if (savedGames) {
      const games = JSON.parse(savedGames);
      console.log('\nSaved Games:', JSON.stringify(games, null, 2));
    } else {
      console.log('\nNo saved games found');
    }

  } catch (error) {
    console.error('Error checking Redis:', error);
  } finally {
    await redis.quit();
  }
}

// Run the check
if (import.meta.main) {
  await checkRedis();
} 