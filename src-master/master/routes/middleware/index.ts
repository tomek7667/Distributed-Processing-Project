import express from "express";

export type Controller = (
	req: Request,
	res: express.Response,
	next?: express.NextFunction
) => Promise<void>;

export interface Request extends express.Request {}
