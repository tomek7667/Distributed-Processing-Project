import express from "express";
import { Controller, Request } from ".";

export const withCatch =
	(controller: Controller) =>
	async (
		req: Request,
		res: express.Response,
		next: express.NextFunction
	): Promise<void> => {
		try {
			await controller(req, res, next);
		} catch (err) {
			next(err);
		}
	};
