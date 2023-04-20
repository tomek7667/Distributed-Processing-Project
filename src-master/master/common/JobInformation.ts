export const MINIMUM_PRINTABLE_ASCII = 32;
export const MAXIMUM_PRINTABLE_ASCII = 126;

export class JobInformation {
	type: "wordlist" | "bruteforce";
	index?: number;
}

export class WordlistJobInformation implements JobInformation {
	public type: "wordlist";
	public wordlist: string;
	public index: number;

	constructor(wordlist: string, index: number) {
		this.wordlist = wordlist;
		this.index = index;

		this.type = "wordlist";
	}

	public static create(
		wordlist: string,
		index: number
	): WordlistJobInformation {
		return new WordlistJobInformation(wordlist, index);
	}
}

export class BruteforceJobInformation implements JobInformation {
	public type: "bruteforce";
	public start: Array<number>;
	public iterations: number;

	constructor(start: Array<number>, iterations: number) {
		this.start = start;
		this.iterations = iterations;
		this.type = "bruteforce";
	}

	public static create(
		previous: Array<number>,
		iterations: number
	): BruteforceJobInformation {
		const next = this.calculateNext(previous, iterations);
		return new BruteforceJobInformation(next, iterations);
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
		const newArray: Array<number> = [];
		let carry = 0;
		let i = previous.length - 1;
		let j = 0;
		while (i >= 0) {
			let value = previous[i] + carry;
			if (j === 0) {
				value += iterations;
			}
			if (value > MAXIMUM_PRINTABLE_ASCII) {
				carry = 1;
				value = MINIMUM_PRINTABLE_ASCII;
			} else {
				carry = 0;
			}
			newArray.unshift(value);
			i--;
			j++;
		}
		if (carry === 1) {
			newArray.unshift(MINIMUM_PRINTABLE_ASCII);
		}
		return newArray;
	}
}
