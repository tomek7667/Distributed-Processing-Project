import { createHash } from "crypto";

export const MINIMUM_PRINTABLE_ASCII = 32;
export const MAXIMUM_PRINTABLE_ASCII = 126;
export const MAXIMUM_DISTANCE =
	MAXIMUM_PRINTABLE_ASCII - MINIMUM_PRINTABLE_ASCII + 1;
export const EMPTY_BRUTEFORCE_JOB = [MINIMUM_PRINTABLE_ASCII];

export interface JobInformation {
	type: "wordlist" | "bruteforce";
	jobHash: string;
	index?: number;
	toJSON: () => Record<string, unknown>;
}

export class WordlistJobInformation implements JobInformation {
	public type: "wordlist";
	public wordlist: string;
	public index: number;

	public jobHash: string;

	constructor(wordlist: string, index: number) {
		this.wordlist = wordlist;
		this.index = index;
		this.type = "wordlist";

		this.jobHash = WordlistJobInformation.calculateJobHash(
			this.wordlist,
			this.index
		);
	}

	public static calculateJobHash(wordlist: string, index: number): string {
		return createHash("MD5")
			.update(JSON.stringify({ type: "wordlist", wordlist, index }))
			.digest("hex");
	}

	public static create(
		wordlist: string,
		index: number
	): WordlistJobInformation {
		return new WordlistJobInformation(wordlist, index);
	}

	public toJSON(): Record<string, unknown> {
		return {
			type: this.type,
			wordlist: this.wordlist,
			index: this.index,
		};
	}

	public static fromJSON(data: Record<string, unknown>): JobInformation {
		if (data.type !== "wordlist") {
			throw new Error("Invalid job type");
		}

		return new WordlistJobInformation(
			data.wordlist as string,
			data.index as number
		);
	}
}

export class BruteforceJobInformation implements JobInformation {
	public type: "bruteforce";
	public start: Array<number>;
	public next: Array<number>;
	public iterations: number;

	public jobHash: string;

	constructor(start: Array<number>, next: Array<number>, iterations: number) {
		this.start = start;
		this.next = next;
		this.iterations = iterations;
		this.type = "bruteforce";

		this.jobHash = BruteforceJobInformation.calculateJobHash(
			this.start,
			this.iterations
		);
	}

	public static calculateJobHash(start: Array<number>, iterations: number) {
		return createHash("MD5")
			.update(JSON.stringify({ type: "bruteforce", iterations, start }))
			.digest("hex");
	}

	public static create(
		start: Array<number>,
		iterations: number
	): BruteforceJobInformation {
		const next = this.calculateNext([...start], iterations);
		return new BruteforceJobInformation(start, next, iterations);
	}

	/**
	 * 	Current password is array of bytes. Example:
		Word `example` is represented as `[101, 120, 97, 109, 112, 108, 101]`.
		`String.fromCharCode(101) === "e"`
		`String.fromCharCode(120) === "x"`
		`...` etc.

		The minimum printable ASCII character is 32, and the maximum is 126 and
		are accessible via constants at the top of this file.

		Each position of byte array is a character in the password. The rotations
		are done by incrementing the byte at the end of the array. If the byte
		is `126`, it is set to `32` and the byte before it is incremented. This
		continues until the byte at the beginning of the array is incremented.
		
		If the byte at the beginning of the array is incremented, the array
		becomes one character longer, the rest of the array is set to
		`MINIMUM_PRINTABLE_ASCII` from beginning to end.

		The process is repeated until the iterations are exhausted.
		Of course this process is done in the client.

		Following function only predicts the next password, based on `iterations`
		and `previous` array of bytes.
	 * 
	 * @param previous - array of bytes representing the previous password
	 * @param iterations - number of iterations to perform
	 * @returns - array of bytes representing the next password
	 */
	public static calculateNext(
		previous: Array<number>,
		iterations: number
	): Array<number> {
		let array: Array<number> = previous;
		for (let i = 0; i < iterations; i++) {
			array = this.addOneToArray(array);
		}
		return array;
	}

	public static addOneToArray(array: Array<number>): Array<number> {
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
	}

	public toJSON(): Record<string, unknown> {
		return {
			type: this.type,
			start: this.start,
			next: this.next,
			iterations: this.iterations,
		};
	}

	public static fromJSON(data: Record<string, unknown>): JobInformation {
		if (data.type !== "bruteforce") {
			throw new Error("Invalid job type");
		}

		return new BruteforceJobInformation(
			data.start as Array<number>,
			data.next as Array<number>,
			data.iterations as number
		);
	}
}
