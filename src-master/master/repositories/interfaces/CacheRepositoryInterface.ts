import { Job } from "@common/Job";

export interface CacheRepositoryInterface {
	/**
	 * Creates a job in the cache if it does not exist
	 *
	 * @param job - The job to be cached
	 */
	set(job: Job): Promise<void>;

	/**
	 * Gets a job from the cache
	 *
	 * @param jobHash - The hash of the job information to be retrieved
	 */
	get(jobHash: string): Promise<Job | null>;

	/**
	 * Deletes all jobs from cache - used for debugging purposes
	 * and when the server starts up
	 */
	clearAllCache(): Promise<void>;
}
