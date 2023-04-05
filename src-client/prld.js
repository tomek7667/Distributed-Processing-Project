const { ipcRenderer, contextBridge } = require("electron");

// Adds an object 'api' to the global window object:
contextBridge.exposeInMainWorld("api", {
	submitHash: (arg) => ipcRenderer.send("submit-hash", arg),
});

ipcRenderer.on("hash-response", (event, arg) => {
	// alert(JSON.stringify(arg));
    document.getElementById("out-log").innerHTML += JSON.stringify(arg) + "<br>";
});
