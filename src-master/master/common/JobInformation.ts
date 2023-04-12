export class JobInformation {
	type: "wordlist" | "bruteforce";
	index: number;
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

// TODO: Add `BruteforceJobInformation` interface
