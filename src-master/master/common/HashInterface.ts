import { Algorithm } from ".";

export interface HashInterface {
	algorithm: Algorithm;
	hash: string;
	userId: string;
	createdAt: Date;
}
