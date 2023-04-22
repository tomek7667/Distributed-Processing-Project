const { createHash } = require("crypto");

const MINIMUM_PRINTABLE_ASCII = 32;
const MAXIMUM_PRINTABLE_ASCII = 126;

enum HashAlgorithmW {
	MD5 = "md5",
	SHA256 = "sha256",
	SHA512 = "sha512",
}

enum MessageTypeW {
	SubmitHash,
	SolveHash,
}

interface JobInterface {
	id: string;
	jobHashData: {
		algorithm: HashAlgorithmW;
		hash: string;
		createdById: string;
		createdAt: Date;
	};
	createdAt: Date;
}

interface WordlistJob extends JobInterface {
	jobInformation: {
		type: "wordlist";
		wordlist: string;
		index: number;
	};
}

interface BruteForceJob extends JobInterface {
	jobInformation: {
		type: "bruteforce";
		start: Array<number>;
		iterations: number;
	};
}

interface JobResult {
	messageType: MessageTypeW;
	algorithm: HashAlgorithmW;
	word: string;
}

const bytesToString = (bytes: Array<number>): string => {
	return bytes.map((byte) => String.fromCharCode(byte)).join("");
};

const submitSolution = (solution: JobResult): void => {
	postMessage(solution);
};

const fulfillBruteForceJob = (job: BruteForceJob): JobResult => {
	const realPassword = job.jobHashData.hash;
	const algorithm = job.jobHashData.algorithm;

	let potentialPassword = job.jobInformation.start;
	const iterations = job.jobInformation.iterations;

	let idx = potentialPassword.length - 1;

	for (let i = 0; i < iterations; i++) {
		const hashResult = createHash(algorithm)
			.update(bytesToString(potentialPassword))
			.digest("hex");

		if (hashResult === realPassword) {
			return {
				messageType: MessageTypeW.SolveHash,
				algorithm,
				word: bytesToString(potentialPassword),
			};
		}

		if (
			potentialPassword.every(
				(elem: number) => elem === MAXIMUM_PRINTABLE_ASCII
			)
		) {
			let len = potentialPassword.length;
			potentialPassword = Array(len + 1).fill(MINIMUM_PRINTABLE_ASCII);
		}

		idx = potentialPassword.length - 1;
		while (potentialPassword[idx] >= MAXIMUM_PRINTABLE_ASCII) {
			potentialPassword[idx] = MINIMUM_PRINTABLE_ASCII;
			idx--;
		}
		potentialPassword[idx]++;
	}

	return { messageType: MessageTypeW.SolveHash, algorithm, word: "" };
};

self.addEventListener("message", (e) => {
	const result = fulfillBruteForceJob(e.data);
	submitSolution(result);
});
