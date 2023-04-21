const { ipcRenderer, contextBridge } = require("electron");

// Adds an object 'api' to the global window object:
contextBridge.exposeInMainWorld("api", {
	submitHash: (arg) => ipcRenderer.invoke("submit-hash", arg),
	connect: (host) => ipcRenderer.invoke("connect", host),
	disconnect: () => ipcRenderer.invoke("disconnect"),
});

let logCounter = 0;

ipcRenderer.on("server-log", (event, arg) => {
	const outLoug = document.getElementById("out-log");
	outLoug.innerHTML = `> ${new Date().toLocaleTimeString()} ${new Date().getMilliseconds()}ms - ${arg}<br />${
		document.getElementById("out-log").innerHTML
	}`;
	logCounter++;
	if (logCounter > 500) {
		outLoug.innerHTML = "";
		logCounter = 0;
	}
});

ipcRenderer.on("hash-complete", (event, message) => {
	alert(message);
});

ipcRenderer.on("disconnected", (event, arg) => {
	const connectButton = document.getElementById("connect-button");
	const disconnectButton = document.getElementById("disconnect-button");
	const inputHashArea = document.getElementById("input-hash-area");
	disconnectButton.classList.add("is-hidden");
	connectButton.classList.remove("is-hidden");
	inputHashArea.classList.add("is-hidden");
});
