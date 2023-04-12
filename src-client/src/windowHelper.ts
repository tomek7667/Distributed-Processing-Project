enum HashAlgorithm {
	MD5 = "md5",
	SHA256 = "sha256",
	SHA512 = "sha512",
}

enum MessageType {
	SubmitHash,
	SolveHash,
}

const createMessage = (
	messageType: MessageType,
	algorithm: HashAlgorithm,
	hashOrSolution: string
): string => {
	return `${messageType}:${algorithm}:${hashOrSolution}`;
};

interface api {
	submitHash: (message: string) => Promise<boolean>;
	connect: () => Promise<boolean>;
	disconnect: () => Promise<boolean>;
}

interface WindowInterface extends Window {
	api: api;
}

const addListeners = () => {
	const _window = window as unknown as WindowInterface;
	const submitHashButton = document.getElementById("submit-hash")!;
	const hashField = (document.getElementById(
		"hash-field"
	) as HTMLInputElement)!;
	const algorithmSelect = (document.getElementById(
		"algorithm-select"
	) as HTMLSelectElement)!;
	submitHashButton.addEventListener("click", async () => {
		const hash = hashField.value as string;
		const algorithm = algorithmSelect.value as unknown as HashAlgorithm;
		const result = await _window.api.submitHash(
			createMessage(MessageType.SubmitHash, algorithm, hash)
		);
		if (!result) {
			return;
		}
		hashField.value = "";
	});

	const clearLogButton = document.getElementById("clear-log")!;
	clearLogButton.addEventListener("click", () => {
		const log = document.getElementById("out-log")!;
		log.innerHTML = "";
	});

	const connectButton = document.getElementById("connect-button")!;
	const disconnectButton = document.getElementById("disconnect-button")!;
	const inputHashArea = document.getElementById("input-hash-area");
	connectButton.addEventListener("click", async () => {
		connectButton.classList.add("is-loading");
		const result = await _window.api.connect();
		if (!result) {
			connectButton.classList.remove("is-loading");
			return;
		}
		connectButton.classList.remove("is-loading");
		disconnectButton.classList.remove("is-hidden");
		connectButton.classList.add("is-hidden");
		inputHashArea.classList.remove("is-hidden");
	});
	disconnectButton.addEventListener("click", async () => {
		connectButton.classList.add("is-loading");
		const result = await _window.api.disconnect();
		if (!result) {
			connectButton.classList.remove("is-loading");
			return;
		}
		connectButton.classList.remove("is-loading");
		disconnectButton.classList.add("is-hidden");
		connectButton.classList.remove("is-hidden");
		inputHashArea.classList.add("is-hidden");
	});
};

window.addEventListener("DOMContentLoaded", () => {
	console.log("DOM loaded");
	addListeners();
});
