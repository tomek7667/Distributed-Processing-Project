import fetch from "electron-fetch";
import * as path from "path";
import { app, BrowserWindow, ipcMain } from "electron";
let mainWindow: BrowserWindow;

interface options {
	hash: string;
	algorithm: "sha256" | "sha512" | string;
}

interface resposne {
	success: boolean;
	data: any;
}

const IS_DEVELOPMENT = true;
const SERVER_URL = "http://localhost:5555";

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
		app.quit();
	});
});

ipcMain.on("submit-hash", async (event, args) => {
	const options = args as options;
	const response = await fetch(`${SERVER_URL}/api/hash`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(options),
	});

	if (response.ok) {
		const data = (await response.json()) as resposne;
		event.reply("hash-response", data);
	} else {
		console.log("Error");
	}
});
