import express from "express";

const router = express.Router();

router.post("/hash", (req, res) => {
	console.log(req.body);
	res.json({
		success: true,
		data: "Hash sent successfully",
	});
});

export default router;
