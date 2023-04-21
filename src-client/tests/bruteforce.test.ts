import { BruteForceJob, JobInterface } from "../src/JobInterface";
import { HashAlgorithm } from "../src/Message";
import { randomUUID } from "crypto";
import { fulfillBruteForceJob } from "../src/jobsFunctions";

const exampleResult = "s3cr3t";
const exampleHash = "a4d80eac9ab26a4a2da04125bc2c096a";

const exampleBruteforceJob: JobInterface = {
	id: randomUUID(),
	jobHashData: {
		algorithm: HashAlgorithm.MD5,
		hash: exampleHash,
		createdById: randomUUID(),
		createdAt: new Date(),
	},
	createdAt: new Date(),
};

describe("fulfillBruteForceJob", () => {
	it("should return a JobResult that finds a password (start.length == result.length)", () => {
		const job: BruteForceJob = {
			...exampleBruteforceJob,
			jobInformation: {
				type: "bruteforce",
				start: [0x73, 0x33, 0x63, 0x72, 0x31, 0x74],
				iterations: 10000,
			},
		};
		const result = fulfillBruteForceJob(job);
		expect(result.word).toBe(exampleResult);
	});

	it("should return a JobResult that finds a password (start.length < result.length)", () => {
		const job: BruteForceJob = {
			...exampleBruteforceJob,
			jobHashData: {
				...exampleBruteforceJob.jobHashData,
				hash: "aeee905d909f505f8189c9a7950b9b95",
			},
			jobInformation: {
				type: "bruteforce",
				start: [32, 102, 50, 77],
				iterations: 300000,
			},
		};
		const result = fulfillBruteForceJob(job);
		// Array of MINIMUM_PRINTABLE_ASCII of length 5 is "     "
		expect(result.word).toBe("!!!e");
	});

	it("should return an empty JobResult that doesn't find a password", () => {
		const job: BruteForceJob = {
			...exampleBruteforceJob,
			jobInformation: {
				type: "bruteforce",
				start: [0x73, 0x33, 0x63, 0x72, 0x31],
				iterations: 1,
			},
		};

		const result = fulfillBruteForceJob(job);
		expect(result.word).toBe("");
	});
});
