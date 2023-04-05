interface options {
	hash: string;
	algorithm: "sha256" | "sha512" | string;
}

interface api {
	submitHash: (args: options) => Promise<void>;
}

interface WindowInterface extends Window {
	api: api;
}

const addListeners = () => {
	const submitHashButton = document.getElementById("submit-hash")!;
	submitHashButton.addEventListener("click", () => {
		console.log("Clicked!");
		const hash = (document.getElementById(
			"hash-field"
		) as HTMLInputElement)!.value;
		const algorithm = (document.getElementById(
			"algorithm-select"
		) as HTMLSelectElement)!.value;
		(window as unknown as WindowInterface).api.submitHash({
			hash,
			algorithm,
		});
	});
};

window.addEventListener("DOMContentLoaded", () => {
	console.log("DOM loaded");
	addListeners();
});
