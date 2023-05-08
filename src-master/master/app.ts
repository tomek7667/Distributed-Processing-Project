import { startServer } from "./routes";
import { connect as redisConnect } from "./cache/client";

const bootstrap = async () => {
	await Promise.all([redisConnect()]);
	await startServer();
};

bootstrap();
