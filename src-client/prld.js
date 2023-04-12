const { ipcRenderer, contextBridge } = require("electron");

// Adds an object 'api' to the global window object:
contextBridge.exposeInMainWorld("api", {
	submitHash: (arg) => ipcRenderer.invoke("submit-hash", arg),
	connect: () => ipcRenderer.invoke("connect"),
	disconnect: () => ipcRenderer.invoke("disconnect"),
});

ipcRenderer.on("server-log", (event, arg) => {
    document.getElementById("out-log").innerHTML = `> ${(new Date()).toLocaleTimeString()} ${(new Date()).getMilliseconds()}ms - ${arg}<br />${document.getElementById("out-log").innerHTML }`;
});

ipcRenderer.on("disconnected", (event, arg) => {
	const connectButton = document.getElementById("connect-button");
	const disconnectButton = document.getElementById("disconnect-button");
	const inputHashArea = document.getElementById("input-hash-area");
	disconnectButton.classList.add("is-hidden");
	connectButton.classList.remove("is-hidden");
	inputHashArea.classList.add("is-hidden");
});

// ipcRenderer.on("connection", (event, arg) => {
// 	console.log(event);
// 	console.log(arg);
// });