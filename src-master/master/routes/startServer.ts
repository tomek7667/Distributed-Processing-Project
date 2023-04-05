import express from "express";

export const startServer = async (): Promise<void> => {
	const app = express();

	app.listen(5555, "localhost", () => {
		console.log("Server is running on port 5555");
	});
};
