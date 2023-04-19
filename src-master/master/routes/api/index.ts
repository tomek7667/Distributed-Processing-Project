import express from "express";

const router = express.Router();

router.get("/ping", (_req, res) => {
	res.json({
		success: true,
		data: `pong! at ${new Date().toLocaleString()}}`,
	});
});

export default router;
// 
// b 
// c
// ...
// z