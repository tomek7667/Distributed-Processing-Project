import * as path from "path";
import { readFileSync } from "fs";
import { createHash } from "crypto";
import { BruteForceJob, JobResult, WordlistJob } from "./JobInterface";
import { MessageType } from "./Message";

export const MINIMUM_PRINTABLE_ASCII = 32;
export const MAXIMUM_PRINTABLE_ASCII = 126;

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
	// YOUR CODE HERE

	//! if the hash will be found:*/
	/*
	return { messageType: MessageType.SolveHash, algorithm, word };
	*/

	//! to hash a string u use: */
	/*
	const hashResult = createHash(algorithm).update(<potential solve as string>).digest("hex");
	if (hashResult === hash) { ...; return { messageType: MessageType.SolveHash, algorithm, word }; }
	*/

	//! If you have NO solution:
	/*
	return { messageType: MessageType.SolveHash, algorithm, word: "" };
	*/
	throw new Error("Not implemented");
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
