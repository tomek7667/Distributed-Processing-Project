export interface WordlistJob {
	id: string;
	jobHashData: {
		algorithm: HashAlgorithm;
		hash: string;
		createdById: string;
		createdAt: Date;
	};
	jobInformation: {
		wordlist: string;
		index: number;
		type: string;
	};
	createdAt: Date;
}

export const wordlistJobFromJson = (json: Record<string, any>): WordlistJob => {
	return {
		id: json.id as string,
		jobHashData: {
			algorithm: json.jobHashData.algorithm! as HashAlgorithm,
			hash: json.jobHashData.hash as string,
			createdById: json.jobHashData.createdById as string,
			createdAt: new Date(json.jobHashData.createdAt as string),
		},
		jobInformation: {
			wordlist: json.jobInformation.wordlist as string,
			index: json.jobInformation.index as number,
			type: json.jobInformation.type as string,
		},
		createdAt: new Date(json.createdAt as string),
	};
};
