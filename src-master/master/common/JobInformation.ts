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
	public knownPrefix: string;
	public maxLength: number;

	constructor(knownPrefix: string, maxLength: number) {
		this.knownPrefix = knownPrefix;
		this.maxLength = maxLength;

		this.type = "bruteforce";
	}

	public static create(
		knownPrefix: string,
		maxLength: number
	): BruteforceJobInformation {
		return new BruteforceJobInformation(knownPrefix, maxLength);
	}
}
