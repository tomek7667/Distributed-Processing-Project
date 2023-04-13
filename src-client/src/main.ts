import * as path from "path";
import {
	app,
	BrowserWindow,
	ipcMain,
	IpcMainEvent,
	IpcMainInvokeEvent,
} from "electron";
import { io, Socket } from "socket.io-client";
import { WordlistJob, wordlistJobFromJson } from "./WordlistJobInterface";
import { readFileSync } from "fs";
import { createHash } from "crypto";
import { MessageType, HashAlgorithm, createMessage } from "./Message";

let mainWindow: BrowserWindow;
let socket: Socket;

const IS_DEVELOPMENT = false;
const SERVER_HOST = "http://localhost:5555";

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

		socket.on("job", (job: object) => {
			const jobData = wordlistJobFromJson(job);
			fulfillWordlistJob(jobData);
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
