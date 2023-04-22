enum HashAlgorithm {
	MD5 = "md5",
	SHA256 = "sha256",
	SHA512 = "sha512",
}

enum MessageType {
	SubmitHash,
	SolveHash,
}

const settings = {};

const createMessage = (
	messageType: MessageType,
	algorithm: HashAlgorithm,
	hashOrSolution: string
): string => {
	return `${messageType}:${algorithm}:${hashOrSolution}`;
};

interface api {
	submitHash: (message: string) => Promise<boolean>;
	connect: (host: string) => Promise<boolean>;
	disconnect: () => Promise<boolean>;
	getVersion: () => Promise<string>;
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
	const hostField = document.getElementById("host-field") as HTMLInputElement;
	const disconnectButton = document.getElementById("disconnect-button")!;
	const inputHashArea = document.getElementById("input-hash-area");
	connectButton.addEventListener("click", async () => {
		connectButton.classList.add("is-loading");
		hostField.classList.add("is-hidden");
		const result = await _window.api.connect(hostField.value);
		if (!result) {
			connectButton.classList.remove("is-loading");
			hostField.classList.remove("is-hidden");
			return;
		}

		connectButton.classList.remove("is-loading");
		disconnectButton.classList.remove("is-hidden");
		connectButton.classList.add("is-hidden");
		inputHashArea.classList.remove("is-hidden");
	});
	disconnectButton.addEventListener("click", async () => {
		connectButton.classList.add("is-loading");
		hostField.classList.remove("is-hidden");
		const result = await _window.api.disconnect();
		if (!result) {
			connectButton.classList.remove("is-loading");
			hostField.classList.add("is-hidden");
			return;
		}
		connectButton.classList.remove("is-loading");
		disconnectButton.classList.add("is-hidden");
		connectButton.classList.remove("is-hidden");
		inputHashArea.classList.add("is-hidden");
	});
};

const generateTitle = async (): Promise<string> => {
	const _window = window as unknown as WindowInterface;
	const version = await _window.api.getVersion();
	return `Password Cracker v${version}`;
};

window.addEventListener("DOMContentLoaded", async () => {
	const pTitleElement = document.getElementById("p-title");
	const tTitleElement = document.getElementById("t-title");
	console.log("DOM loaded");
	pTitleElement.innerText = await generateTitle();
	tTitleElement.innerText = await generateTitle();
	addListeners();
});
