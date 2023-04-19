import * as path from "path";
import {
	app,
	BrowserWindow,
	ipcMain,
	IpcMainEvent,
	IpcMainInvokeEvent,
} from "electron";
import { io, Socket } from "socket.io-client";
import { readFileSync } from "fs";
import { createHash } from "crypto";
import { MessageType, createMessage } from "./Message";
import { BruteForceJob, jobFromJson, WordlistJob } from "./JobInterface";

let mainWindow: BrowserWindow;
let socket: Socket;

const IS_DEVELOPMENT = false;
const SERVER_HOST = "http://localhost:5555";
const MINIMUM_PRINTABLE_ASCII = 32;
const MAXIMUM_PRINTABLE_ASCII = 126;

const createWindow = () => {
	console.log(path.join(__dirname, "../prld.js"));
	mainWindow = new BrowserWindow({
		width: 1270,
		height: 720,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: true,
			preload: path.join(__dirname, "../prld.js"),
		},
	});

	mainWindow.loadFile(path.join(__dirname, "../index.html"));
	if (IS_DEVELOPMENT) {
		mainWindow.webContents.openDevTools();
	}
};

app.whenReady().then(() => {
	createWindow();

	app.on("window-all-closed", () => {
		try {
			closeSocket();
		} catch (e) {}
		app.quit();
	});
});

ipcMain.handle("submit-hash", async (event, args): Promise<boolean> => {
	log("Submitting hash...", event);
	socket.emit("data", args);
	return true;
});

ipcMain.handle("connect", async (event, args): Promise<boolean> => {
	log("Connecting to the socket server...", event);
	socket = io(SERVER_HOST);
	const result = await addSocketListeners(event);
	return result;
});

ipcMain.handle("disconnect", async (event, args): Promise<boolean> => {
	log("Disconnecting from the socket server...", event);
	closeSocket();
	return true;
});

const log = (message: string, event: IpcMainEvent | IpcMainInvokeEvent) => {
	event.sender.send("server-log", message);
};

const addSocketListeners = (
	event: IpcMainEvent | IpcMainInvokeEvent
): Promise<boolean> => {
	return new Promise((resolve, reject) => {
		let isConnectionEstablished = false;
		socket.on("connect", () => {
			log("Connected to the socket server!", event);
			isConnectionEstablished = true;
			return resolve(true);
		});

		socket.on("log", (message: string) => {
			log(message, event);
		});

		socket.on("disconnect", () => {
			log("Disconnected from the socket server!", event);
		});

		socket.on("lifecheck", () => {
			socket.emit("lifecheck");
		});

		socket.on("job", (jobData: object) => {
			const job = jobFromJson(jobData);
			fulfillJob(job);
		});

		socket.on("hash-complete", (message: string) => {
			event.sender.send("hash-complete", message);
		});

		setTimeout(() => {
			if (!isConnectionEstablished) {
				log("Connection to the socket server timed out!", event);
				closeSocket();
				return resolve(false);
			}
		}, 5000);
	});
};

const fulfillJob = (job: WordlistJob | BruteForceJob): void => {
	switch (job.jobInformation.type) {
		case "wordlist":
			fulfillWordlistJob(job as WordlistJob);
			break;
		case "bruteforce":
			fulfillBruteForceJob(job as BruteForceJob);
			break;
	}
};

const fulfillWordlistJob = (job: WordlistJob): void => {
	const wordlist = getWordlist(
		job.jobInformation.wordlist,
		job.jobInformation.index
	);
	const hash = job.jobHashData.hash;
	const algorithm = job.jobHashData.algorithm;
	// For loop is faster than forEach
	for (let i = 0; i < wordlist.length; i++) {
		const word = wordlist[i];
		const hashResult = createHash(algorithm).update(word).digest("hex");
		if (hashResult === hash) {
			socket.emit(
				"data",
				createMessage(MessageType.SolveHash, algorithm, word)
			);
			break;
		}
	}
	socket.emit("data", createMessage(MessageType.SolveHash, algorithm, ""));
};

/*
	Current password is array of bytes. Example:
	Word `example` is represented as [101, 120, 97, 109, 112, 108, 101].
	String.fromCharCode(101) === "e"
	String.fromCharCode(120) === "x"
	... etc.

	The minimum printable ASCII character is 32, and the maximum is 126 and
	are accessible via constants at the top of this file.

	Each position of byte array is a character in the password. The rotations
	are done by incrementing the byte at the end of the array. If the byte
	is 126, it is set to 32 and the byte before it is incremented. This
	continues until the byte at the beginning of the array is incremented.
	
	If the byte at the beginning of the array is incremented, the array
	becomes one character longer, the rest of the array is set to
	MINIMUM_PRINTABLE_ASCII from beginning to end.

	The process is repeated until the iterations are exhausted.
*/
const fulfillBruteForceJob = (job: BruteForceJob): void => {
	// YOUR CODE HERE
	//! if the hash will be found:*/
	/*
	socket.emit(
		"data",
		createMessage(MessageType.SolveHash, algorithm, <string solving the hash>)
	);
	*/
	//! to hash a string u use: */
	/*
	const hashResult = createHash(algorithm).update(<potential solve>).digest("hex");
	if (hashResult === hash) { ...; return; }
	*/
	//! If you have NO solution:
	/*
	socket.emit("data", createMessage(MessageType.SolveHash, algorithm, ""));
	*/
};

const getWordlist = (wordlist: string, index: number): Array<string> => {
	const wordlistPath = path.join(
		__dirname,
		`../libs/wordlists/${wordlist}/${wordlist}_${index}.txt`
	);
	const wordlistData = readFileSync(wordlistPath, "utf-8");
	const wordlistArray = wordlistData.split("\n").map((word) => word.trim());
	return wordlistArray;
};

const closeSocket = () => {
	if (socket?.active) {
		socket.emit("forceDisconnect");
		socket.close();
	}
};
