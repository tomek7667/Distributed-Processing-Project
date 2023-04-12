import { Algorithm } from ".";

export interface HashInterface {
	algorithm: Algorithm;
	hash: string;
	createdById: string;
	createdAt: Date;
}
