export enum Algorithm {
	MD5 = "md5",
	SHA256 = "sha256",
	SHA512 = "sha512",
}

export enum MessageType {
	SubmitHash,
	SolveHash,
}

export const createMessage = (
	messageType: MessageType,
	algorithm: Algorithm,
	hashOrSolution: string
): string => {
	return `${messageType}:${algorithm}:${hashOrSolution}`;
};
