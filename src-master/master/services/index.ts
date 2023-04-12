import { HashInterface } from "master/common";
import { QueueService } from "./QueueService";

export class DistributedProcessingProject {
	private hashQueue = new Array<HashInterface>();
	private users = new Set<string>();

	public get queueService(): QueueService {
		return new QueueService(this.hashQueue, this.users);
	}

	public initialize(): void {
		console.log("Initializing project...");
		this.queueService.initialize();
		console.log("Project initialized!");
	}
}

export const project = new DistributedProcessingProject();
