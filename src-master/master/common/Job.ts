import { randomUUID } from "crypto";
import { HashInterface } from "./HashInterface";
import { JobInformation, WordlistJobInformation } from "./JobInformation";

interface JobData {
	id: string;
	jobHashData: HashInterface;
	jobInformation: JobInformation;
	createdAt: Date;
	solvedAt?: Date;
}

interface CreateJobData {
	jobHashData: HashInterface;
	jobInformation: JobInformation;
}

export class Job {
	public id: string;
	public jobHashData: HashInterface;
	public jobInformation: JobInformation;
	public createdAt: Date;
	public solvedAt?: Date;
	public solverId?: string;

	constructor(data: JobData) {
		this.id = data.id;
		this.jobHashData = data.jobHashData;
		this.jobInformation = data.jobInformation;
		this.createdAt = data.createdAt;
		this.solvedAt = data.solvedAt;
	}

	public static create(data: CreateJobData): Job {
		return new Job({
			id: randomUUID(),
			jobHashData: data.jobHashData,
			jobInformation: data.jobInformation,
			createdAt: new Date(),
		});
	}

	public get isWordlistJob(): boolean {
		return this.jobInformation.type === "wordlist";
	}

	public get wordlistJobInformation(): WordlistJobInformation {
		return this.jobInformation as WordlistJobInformation;
	}

	public get isBruteforceJob(): boolean {
		return this.jobInformation.type === "bruteforce";
	}

	public get isDone(): boolean {
		return this.solvedAt !== undefined;
	}

	public get isAssigned(): boolean {
		return this.solverId !== undefined && !this.isDone;
	}

	public assign(solverId: string): void {
		this.solverId = solverId;
	}

	public unassign(): void {
		this.solverId = undefined;
	}

	public markAsDone(): void {
		this.solvedAt = new Date();
	}

	public toJSON(): Record<string, unknown> {
		return {
			id: this.id,
			jobHashData: this.jobHashData,
			jobInformation: this.jobInformation.toJSON(),
			createdAt: this.createdAt,
			doneAt: this.solvedAt,
		};
	}
}
