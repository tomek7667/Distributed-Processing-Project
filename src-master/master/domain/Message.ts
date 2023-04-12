import { randomUUID } from "crypto";
import { Algorithm } from "@common/index";

export enum MessageType {
	SubmitHash,
	SolveHash,
}

interface MessageData {
	id: string;
	createdAt: Date;
	rawData: string;
	socketId: string;
	type: MessageType;
	algorithm?: Algorithm;
	hash?: string;
}

interface CreateMessageData {
	socketId: string;
	message: string;
}

export class Message {
	public id: string;
	public createdAt: Date;
	public rawData: string;
	public socketId: string;
	public type: MessageType;
	public algorithm?: Algorithm;
	public hashOrSolution?: string;

	constructor(data: MessageData) {
		this.id = data.id;
		this.createdAt = data.createdAt;
		this.rawData = data.rawData;
		this.socketId = data.socketId;
		this.type = data.type;
		this.algorithm = data.algorithm;
		this.hashOrSolution = data.hash;
	}

	static create(data: CreateMessageData): Message {
		const splitted = data.message.split(":");
		if (splitted.length < 3) {
			throw new Error("Invalid message");
		}
		const decoded = {
			type: parseInt(splitted[0]) as MessageType,
			algorithm: splitted[1] as Algorithm,
			hash: splitted[2] as string,
			rawData: data.message as string,
		};
		return new Message({
			id: randomUUID(),
			createdAt: new Date(),
			socketId: data.socketId,
			rawData: decoded.rawData,
			type: decoded.type,
			algorithm: decoded.algorithm,
			hash: decoded.hash,
		});
	}

	public toString(): string {
		return this.rawData;
	}
}
