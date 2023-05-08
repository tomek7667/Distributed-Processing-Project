import { RedisClientType, createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

export const client: RedisClientType = createClient({
	url: REDIS_URL as string,
});

interface Connection {
	client: RedisClientType;
	close(): Promise<void>;
}

export const connect = async (): Promise<Connection> => {
	try {
		await client.connect();
		await client.ping();

		console.log("Redis database connected.");

		return {
			client,
			async close() {
				await client.quit();
			},
		};
	} catch (err) {
		console.log("Redis connection could not be established.");
		throw new Error(`${JSON.stringify(client)}: ${err.message}`);
	}
};
