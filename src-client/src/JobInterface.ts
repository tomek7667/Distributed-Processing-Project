export interface JobInterface {
	id: string;
	jobHashData: {
		algorithm: HashAlgorithm;
		hash: string;
		createdById: string;
		createdAt: Date;
	};
	createdAt: Date;
}

export interface WordlistJob extends JobInterface {
	jobInformation: {
		type: "wordlist";
		wordlist: string;
		index: number;
	};
}

export interface BruteForceJob extends JobInterface {
	jobInformation: {
		type: "bruteforce";
		start: Array<number>;
		iterations: number;
	};
}

export type JobType = "wordlist" | "bruteforce";

export const jobFromJson = (
	json: Record<string, any>
): WordlistJob | BruteForceJob => {
	if (!json || !json["jobInformation"] || !json["jobInformation"]["type"]) {
		throw new Error("Invalid job json");
	}
	const jobType = json["jobInformation"]["type"] as JobType;
	const id = json.id as string;
	const jobHashData = {
		algorithm: json.jobHashData.algorithm! as HashAlgorithm,
		hash: json.jobHashData.hash as string,
		createdById: json.jobHashData.createdById as string,
		createdAt: new Date(json.jobHashData.createdAt as string),
	};
	const createdAt = new Date(json.createdAt as string);
	switch (jobType) {
		case "wordlist":
			return {
				id,
				jobHashData,
				createdAt,
				jobInformation: {
					type: "wordlist",
					wordlist: json.jobInformation.wordlist as string,
					index: json.jobInformation.index as number,
				},
			};
		case "bruteforce":
			return {
				id,
				jobHashData,
				createdAt,
				jobInformation: {
					type: "bruteforce",
					start: json.jobInformation.start as Array<number>,
					iterations: json.jobInformation.iterations as number,
				},
			};
	}
};
