import { Job } from "@common/Job";
import { CacheRepositoryInterface } from "..";
import { client } from "master/cache/client";

export class CacheRepository implements CacheRepositoryInterface {
	public async set(job: Job): Promise<void> {
		const jobHash = job.jobInformation.jobHash;
		const jobString = job.toJSON();
		await client.set(`cracking:${jobHash}`, JSON.stringify(jobString));
	}

	public async get(jobHash: string): Promise<Job> {
		const jobString = await client.get(`cracking:${jobHash}`);
		if (jobString === null) {
			return null;
		}
		return Job.fromJSON(JSON.parse(jobString));
	}

	public async clearAllCache(): Promise<void> {
		await client.flushAll();
	}
}
