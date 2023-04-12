import * as path from "path";
import {
	app,
	BrowserWindow,
	ipcMain,
	IpcMainEvent,
	IpcMainInvokeEvent,
} from "electron";
import { io, Socket } from "socket.io-client";

let mainWindow: BrowserWindow;
let socket: Socket;

const IS_DEVELOPMENT = true;
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

		setTimeout(() => {
			if (!isConnectionEstablished) {
				log("Connection to the socket server timed out!", event);
				closeSocket();
				return resolve(false);
			}
		}, 5000);
	});
};

const closeSocket = () => {
	if (socket?.active) {
		socket.emit("forceDisconnect");
		socket.close();
	}
};
