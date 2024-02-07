import { Redis } from "ioredis";

const redisClient = () => {
  if (process.env.REDIS_URL) {
    console.log("Redis connected");
    return process.env.REDIS_URL;
  } else {
    throw new Error("Redis Connection Error");
  }
};

export const redis = new Redis(redisClient());
