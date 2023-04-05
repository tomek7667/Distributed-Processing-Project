import express from "express";
import apiRouter from "./api";
import bodyParser from "body-parser";

export const startServer = async (): Promise<void> => {
	const app = express();

	app.use(bodyParser.json());
	app.use("/api", apiRouter);

	app.listen(5555, "localhost", () => {
		console.log("Server is running on port 5555");
	});
};
