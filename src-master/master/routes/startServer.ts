import express from "express";
import apiRouter from "./api";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import { createServer } from "http";
import { project } from "@services/index";

export let socketServer: Server;

export const startServer = async (): Promise<void> => {
	const app = express();

	app.use(bodyParser.json());
	app.use("/api", apiRouter);

	const httpServer = createServer(app);
	socketServer = new Server(httpServer);

	project.initialize();

	httpServer.listen(5555, "localhost", () => {
		console.log("Server is running on port 5555");
	});
};
