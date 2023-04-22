import * as path from "path";
import {
	app,
	BrowserWindow,
	ipcMain,
	IpcMainEvent,
	IpcMainInvokeEvent,
	Notification,
	dialog,
	clipboard,
	Menu,
	Tray,
} from "electron";
import { io, Socket } from "socket.io-client";
import { createMessage } from "./Message";
import {
	BruteForceJob,
	jobFromJson,
	JobResult,
	WordlistJob,
} from "./JobInterface";
import { fulfillWordlistJob } from "./jobsFunctions";

let mainWindow: BrowserWindow;
let socket: Socket;
let tray: Tray = null;

const IS_DEVELOPMENT = false;
let SERVER_HOST = "http://0.0.0.0:5555";

const createWindow = () => {
	tray = new Tray(path.join(__dirname, "./libs/icon.png"));
	const contextMenu = Menu.buildFromTemplate([
		{
			label: "Show window",
			click: () => {
				mainWindow.show();
			},
		},
		{
			label: "Run in the background",
			click: () => {
				mainWindow.hide();
			},
		},
		{
			label: "Quit",
			click: () => {
				app.quit();
			},
		},
	]);
	tray.setToolTip(`Password Cracker v${process.env.npm_package_version}`);
	tray.setContextMenu(contextMenu);

	mainWindow = new BrowserWindow({
		width: 1270,
		height: 720,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: true,
			nodeIntegrationInWorker: true,
			preload: path.join(__dirname, "../prld.js"),
		},
		icon: path.join(__dirname, "./libs/icon.png"),
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

ipcMain.handle("connect", async (event, host): Promise<boolean> => {
	log("Connecting to the socket server...", event);
	if (!host) {
		log("No host provided!", event);
		return false;
	}
	SERVER_HOST = host;
	socket = io(SERVER_HOST);
	const result = await addSocketListeners(event);
	return result;
});

ipcMain.handle("disconnect", async (event, _args): Promise<boolean> => {
	log("Disconnecting from the socket server...", event);
	closeSocket();
	return true;
});

ipcMain.handle("get-version", async (_event, _args): Promise<string> => {
	return process.env.npm_package_version;
});

ipcMain.handle("solve-job", async (event, result: JobResult) => {
	socket.emit(
		"data",
		createMessage(result.messageType, result.algorithm, result.word)
	);
});

const log = (message: string, event: IpcMainEvent | IpcMainInvokeEvent) => {
	event.sender.send("server-log", message);
};

const addSocketListeners = (
	event: IpcMainEvent | IpcMainInvokeEvent
): Promise<boolean> => {
	return new Promise((resolve, _reject) => {
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
			fulfillJob(job, event as IpcMainEvent);
		});

		socket.on("hash-complete", (message: string) => {
			enum ButtonClicked {
				Copy,
				Close,
			}

			new Notification({
				title: "Password Cracker",
				body: message,
				urgency: "critical",
			}).show();

			const cracked = message.includes("We cracked your hash!");
			if (!cracked) {
				dialog.showMessageBoxSync({
					title: "Password Cracker",
					type: "error",
					message,
					buttons: ["Close"],
				});
				return;
			}
			const result = dialog.showMessageBoxSync({
				title: "Password Cracker",
				type: "info",
				message,
				buttons: ["Copy to clipboard", "Close"],
				defaultId: 0,
				cancelId: 1,
			});
			switch (result) {
				case ButtonClicked.Copy:
					// last line is the solution
					const solution = message
						.split("\n")
						.filter((line) => line !== "")
						.pop();

					// copy the solution to the clipboard
					clipboard.writeText(solution);
					break;
			}
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

const fulfillJob = (
	job: WordlistJob | BruteForceJob,
	event: IpcMainEvent
): void => {
	let result: JobResult;
	switch (job.jobInformation.type) {
		case "wordlist":
			result = fulfillWordlistJob(job as WordlistJob);
			socket.emit(
				"data",
				createMessage(result.messageType, result.algorithm, result.word)
			);
			break;
		case "bruteforce":
			event.sender.send("perform-bruteforce-job", job);
			break;
	}
};

const closeSocket = () => {
	if (socket?.active) {
		socket.emit("forceDisconnect");
		socket.close();
	}
};
