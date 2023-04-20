import * as path from "path";
import { readFileSync } from "fs";
import { createHash } from "crypto";
import { BruteForceJob, JobResult, WordlistJob } from "./JobInterface";
import { MessageType } from "./Message";

export const MINIMUM_PRINTABLE_ASCII = 32;
export const MAXIMUM_PRINTABLE_ASCII = 126;
export const MAXIMUM_DISTANCE =
	MAXIMUM_PRINTABLE_ASCII - MINIMUM_PRINTABLE_ASCII + 1;

export const fulfillWordlistJob = (job: WordlistJob): JobResult => {
	const wordlist = getWordlist(
		job.jobInformation.wordlist,
		job.jobInformation.index
	);
	const hash = job.jobHashData.hash;
	const algorithm = job.jobHashData.algorithm;

	// For loop is faster than forEach
	for (let i = 0; i < wordlist.length; i++) {
		const word = wordlist[i];
		const hashResult = createHash(algorithm).update(word).digest("hex");
		if (hashResult === hash) {
			return { messageType: MessageType.SolveHash, algorithm, word };
		}
	}
	return { messageType: MessageType.SolveHash, algorithm, word: "" };
};

/*
	Current password is array of bytes. Example:
	Word `example` is represented as [101, 120, 97, 109, 112, 108, 101].
	String.fromCharCode(101) === "e"
	String.fromCharCode(120) === "x"
	... etc.

	The minimum printable ASCII character is 32, and the maximum is 126 and
	are accessible via constants at the top of this file.

	Each position of byte array is a character in the password. The rotations
	are done by incrementing the byte at the end of the array. If the byte
	is 126, it is set to 32 and the byte before it is incremented. This
	continues until the byte at the beginning of the array is incremented.
	
	If the byte at the beginning of the array is incremented, the array
	becomes one character longer, the rest of the array is set to
	MINIMUM_PRINTABLE_ASCII from beginning to end.

	The process is repeated until the iterations are exhausted.
*/
export const fulfillBruteForceJob = (job: BruteForceJob): JobResult => {
	const realPassword = job.jobHashData.hash;
	const algorithm = job.jobHashData.algorithm;

	let potentialPassword = job.jobInformation.start;
	const iterations = job.jobInformation.iterations;

	for (let i = 0; i < iterations; i++) {
		const hashResult = createHash(algorithm)
			.update(bytesToString(potentialPassword))
			.digest("hex");
		if (hashResult === realPassword) {
			return {
				messageType: MessageType.SolveHash,
				algorithm,
				word: bytesToString(potentialPassword),
			};
		}
		potentialPassword = addOneToArray(potentialPassword);
	}

	// let idx = potentialPassword.length - 1;
	// let code = potentialPassword[idx];

	// if (
	// 	potentialPassword.every((el: number) => el === MAXIMUM_PRINTABLE_ASCII)
	// ) {
	// 	let len = potentialPassword.length;
	// 	potentialPassword = Array(len + 1).fill(MINIMUM_PRINTABLE_ASCII);
	// }
	// idx = potentialPassword.length - 1;
	// code = potentialPassword[idx];
	// if (code < MAXIMUM_PRINTABLE_ASCII) {
	// 	potentialPassword = potentialPassword.slice(0, idx).concat(code + 1);
	// } else {
	// 	potentialPassword = potentialPassword
	// 		.slice(0, idx)
	// 		.concat(MINIMUM_PRINTABLE_ASCII);
	// 	while (true) {
	// 		idx--;
	// 		if (idx < 0) {
	// 			return {
	// 				messageType: MessageType.SolveHash,
	// 				algorithm,
	// 				word: "",
	// 			};
	// 		}
	// 		code = potentialPassword[idx];
	// 		if (code < MAXIMUM_PRINTABLE_ASCII) {
	// 			potentialPassword[idx] = code + 1;
	// 			break;
	// 		}
	// 	}
	// }

	return { messageType: MessageType.SolveHash, algorithm, word: "" };
};

const getWordlist = (wordlist: string, index: number): Array<string> => {
	const wordlistPath = path.join(
		__dirname,
		`../libs/wordlists/${wordlist}/${wordlist}_${index}.txt`
	);
	const wordlistData = readFileSync(wordlistPath, "utf-8");
	const wordlistArray = wordlistData.split("\n").map((word) => word.trim());
	return wordlistArray;
};

const bytesToString = (bytes: Array<number>): string => {
	return bytes.map((byte) => String.fromCharCode(byte)).join("");
};

const addOneToArray = (array: Array<number>): Array<number> => {
	if (array.every((value) => value === MAXIMUM_PRINTABLE_ASCII)) {
		array = array.map(() => MINIMUM_PRINTABLE_ASCII);
		array.push(MINIMUM_PRINTABLE_ASCII);
		return array;
	}
	let i = array.length - 1;
	while (array[i] === MAXIMUM_PRINTABLE_ASCII) {
		array[i] = MINIMUM_PRINTABLE_ASCII;
		i--;
	}
	array[i]++;
	return array;
};
