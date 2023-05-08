import { HashInterface } from "master/common";
import { QueueService } from "./QueueService";
import { CacheRepository } from "master/repositories";

export class DistributedProcessingProject {
	private hashQueue = new Array<HashInterface>();
	private users = new Set<string>();

	public get queueService(): QueueService {
		return new QueueService(
			this.hashQueue,
			this.users,
			new CacheRepository()
		);
	}

	public async initialize(): Promise<void> {
		console.log("Initializing project...");
		await this.queueService.initialize();
		console.log("Project initialized!");
	}
}

export const project = new DistributedProcessingProject();
