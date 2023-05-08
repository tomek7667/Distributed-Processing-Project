import { Message, MessageType } from "@domain/index";
import { Algorithm, HashInterface } from "../common";
import { socketServer } from "../routes";
import { Job } from "@common/Job";
import { readdirSync } from "fs";
import {
	BruteforceJobInformation,
	EMPTY_BRUTEFORCE_JOB,
	WordlistJobInformation,
} from "@common/JobInformation";
import path from "path";
import { createHash } from "crypto";

// In milliseconds
const availableWordlists: Map<string, number> = new Map<string, number>().set(
	"rockyou",
	readdirSync(path.join(__dirname, "./wordlists/rockyou")).length
);

const LIFECHECK_TIMEOUT = 2500;
const ROUND_REFRESH_INTERVAL = 25;
const BRUTEFORCE_AMOUNT_PER_JOB = 1_000_000;
const MAXIMUM_BRUTEFORCE_JOBS_AMOUNT = 3_000;
const LOG_LAST_JOB = true;

const hashValidationMap = new Map<string, RegExp>([
	[Algorithm.MD5, /^[a-f0-9]{32}$/],
	[Algorithm.SHA256, /^[a-f0-9]{64}$/],
	[Algorithm.SHA512, /^[a-f0-9]{128}$/],
]);

interface RoundInterface {
	hash: HashInterface;
	round: number;
	jobs: Set<Job>;
	solution?: string;
	solvedAt?: Date;
	bruteforceLastArray?: Array<number>;
	solvedById?: string;
	debugLog?: string;
}

export class QueueService {
	private currentRound: RoundInterface | null = null;
	private roundCounter = 0;

	constructor(
		private readonly hashQueue: Array<HashInterface>,
		private readonly users: Set<string>
	) {}

	public initialize(): void {
		socketServer.on("connection", (socket) => {
			let lifecheck = true;
			console.log(`new client connection: ${socket.id}`);
			this.users.add(socket.id);

			socket.on("data", (data) => {
				try {
					const msg = Message.create({
						socketId: socket.id,
						message: data,
					});

					switch (msg.type) {
						case MessageType.SubmitHash:
							this.addHash({
								algorithm: msg.algorithm,
								hash: msg.hashOrSolution,
								createdById: msg.socketId,
								createdAt: msg.createdAt,
							});
							socket.emit("log", "Hash has been added to queue");
							break;
						case MessageType.SolveHash:
							this.solve(msg.socketId, msg.hashOrSolution);
							break;
						default:
							console.log(socket.id, "Invalid message type");
							console.log(msg);
							throw new Error("Invalid message type");
					}
				} catch (e) {
					socket.emit("log", `[ERROR]: ${e?.message}`);
				}
			});

			const lifecheckInterval = setInterval(() => {
				lifecheck = false;
				socket.emit("lifecheck");
				setTimeout(() => {
					if (!lifecheck) {
						console.log(
							`client inactive - disconnecting: ${socket.id}`
						);
						this.removeUser(socket.id);
						socket.disconnect();
						clearInterval(lifecheckInterval);
					}
				}, LIFECHECK_TIMEOUT);
			}, LIFECHECK_TIMEOUT * 2);

			socket.on("forceDisconnect", () => {
				console.log(`client disconnecting: ${socket.id}`);
				this.removeUser(socket.id);
				socket.disconnect();
				clearInterval(lifecheckInterval);
			});

			socket.on("lifecheck", () => {
				lifecheck = true;
			});
		});

		setInterval(() => {
			const previousDebugLog = this.currentRound?.debugLog;
			if (this.currentRound === null && this.hashQueue.length > 0) {
				const hash = this.hashQueue.shift()!;
				console.log(
					`Starting new round with hash ${hash.hash} for user ${hash.createdById}`
				);
				socketServer.emit(
					"log",
					`Starting new round with hash ${hash.hash} on algorithm ${hash.algorithm}`
				);
				socketServer
					.to(hash.createdById)
					.emit("log", "[INFO]: Your hash has been started.");
				this.currentRound = {
					hash,
					round: this.roundCounter++,
					jobs: new Set<Job>(),
					bruteforceLastArray: EMPTY_BRUTEFORCE_JOB,
				};
				this.currentRound.jobs = this.getJobs(hash);
			} else if (
				this.currentRound !== null &&
				!this.users.has(this.currentRound.hash.createdById)
			) {
				console.log(
					`User ${this.currentRound.hash.createdById} disconnected - discarding the round.`
				);
				socketServer.emit(
					"log",
					`User disconnected - discarding round ${this.currentRound.round} with hash ${this.currentRound.hash.hash}`
				);
				this.currentRound = null;
			} else if (
				this.currentRound !== null &&
				this.currentRound.solution !== undefined
			) {
				console.log(
					`Round ${this.currentRound.round} with hash ${this.currentRound.hash.hash} has been solved by ${this.currentRound.solvedById}`
				);
				socketServer.emit(
					"log",
					`Round ${this.currentRound.round} with hash <b>${
						this.currentRound.hash.hash
					}</b> has been solved by ${
						this.currentRound.solvedById
					} at ${this.currentRound.solvedAt.toLocaleString()}. The solution was <b>${
						this.currentRound.solution
					}</b>.`
				);
				socketServer
					.to(this.currentRound.hash.createdById)
					.emit(
						"log",
						`[INFO]: Your hash has been solved. The solution is: <b>${this.currentRound.solution}</b>`
					);
				socketServer
					.to(this.currentRound.hash.createdById)
					.emit(
						"hash-complete",
						`We cracked your hash!\n\nHash:\n${this.currentRound.hash.hash}\nSolution:\n${this.currentRound.solution}`
					);
				if (
					this.currentRound.hash.createdById !==
					this.currentRound.solvedById
				) {
					socketServer
						.to(this.currentRound.solvedById)
						.emit(
							"log",
							`[INFO]: You have solved a hash. The solution is: <b>${this.currentRound.solution}</b>`
						);
				}
				this.currentRound = null;
			} else if (
				this.currentRound !== null &&
				Array.from(this.currentRound.jobs).every((job) => job.isDone)
			) {
				socketServer.emit(
					"log",
					`Round ${this.currentRound.round} with hash ${this.currentRound.hash.hash} was not able to succeed.`
				);
				socketServer
					.to(this.currentRound.hash.createdById)
					.emit(
						"hash-complete",
						`We were not able to crack your hash.\n\nHash:\n${this.currentRound.hash.hash}`
					);
				this.currentRound = null;
			} else if (
				this.currentRound !== null &&
				this.currentRound.solution === undefined
			) {
				const jobsDone = Array.from(this.currentRound.jobs).filter(
					(job) => job.isDone
				);
				this.currentRound.debugLog = `Jobs done: ${jobsDone.length}/${this.currentRound.jobs.size}`;
				const unassignedUsers = Array.from(this.users).filter(
					(user) => {
						return !Array.from(this.currentRound!.jobs).some(
							(job) => job.solverId === user && !job.isDone
						);
					}
				);
				unassignedUsers.forEach((user) => {
					const unassignedJobs = Array.from(
						this.currentRound!.jobs
					).filter((job) => !job.isAssigned);
					if (unassignedJobs.length > 0) {
						if (
							parseInt(
								(this.currentRound.jobs.size / 2).toString()
							) === unassignedJobs.length
						) {
							console.log(`Halfway there!`);
						}
						const unassignedJob = unassignedJobs[0];
						this.currentRound.jobs.delete(unassignedJob);
						unassignedJob.assign(user);
						this.currentRound.jobs.add(unassignedJob);
						socketServer
							.to(user)
							.emit(
								"log",
								`<span style="color: hsl(0, 0%, 71%);">[INFO]: You have been assigned a job with id: ${unassignedJob.id}</span>`
							);
						socketServer
							.to(user)
							.emit("job", unassignedJob.toJSON());
					}
				});

				/**
				 * Unassign jobs that take too long for a user to solve.
				 */
				const assignedJobs = Array.from(this.currentRound.jobs).filter(
					(job) => job.isAssigned
				);
				assignedJobs.forEach((job) => {
					if (job.isTimedOut) {
						const timedOutJob = job;
						socketServer
							.to(timedOutJob.solverId)
							.emit(
								"log",
								`<span style="color: hsl(0, 0%, 71%);">[INFO]: Your job with id: ${timedOutJob.id} has timed out. It has been unassigned.</span>`
							);
						console.log(
							`Job ${timedOutJob.id} has timed out. It has been unassigned.`
						);
						this.currentRound.jobs.delete(timedOutJob);
						timedOutJob.unassign();
						this.currentRound.jobs.add(timedOutJob);
					}
				});
			}
			if (
				this.currentRound?.debugLog &&
				previousDebugLog !== this.currentRound?.debugLog
			) {
				console.log(this.currentRound?.debugLog);
			}
		}, ROUND_REFRESH_INTERVAL);
		console.log("Queue service initialized");
	}

	public addHash(hash: HashInterface): void {
		this.hashQueue.forEach((hashInterface) => {
			if (hashInterface.hash === hash.hash) {
				throw new Error(
					`This hash is already in the queue. Submitted at ${hashInterface.createdAt.toLocaleString()}`
				);
			}
			if (hashInterface.createdById === hash.createdById) {
				throw new Error(
					`You already have a hash in the queue: ${
						hashInterface.hash
					} created at ${hashInterface.createdAt.toLocaleString()}`
				);
			}
		});
		if (
			this.currentRound !== null &&
			this.currentRound.hash.createdById === hash.createdById
		) {
			throw new Error(
				`Current round is already assigned to you. Hash: ${this.currentRound.hash.hash}`
			);
		}
		if (
			this.currentRound !== null &&
			this.currentRound.hash.hash === hash.hash &&
			this.currentRound.hash.algorithm === hash.algorithm
		) {
			throw new Error(
				`Current round is working already on this hash with that algorithm. Submitted at ${this.currentRound.hash.createdAt.toLocaleString()}`
			);
		}

		if (hashValidationMap.get(hash.algorithm) === undefined) {
			throw new Error("Algorithm not supported");
		}
		if (!hashValidationMap.get(hash.algorithm)!.test(hash.hash)) {
			throw new Error(
				`Hash is not valid. Must match ${
					hash.algorithm
				} algorithm regex: ${hashValidationMap.get(hash.algorithm)}`
			);
		}
		this.hashQueue.push(hash);
	}

	private removeUser(userId: string): void {
		this.hashQueue.forEach((hashInterface, index) => {
			if (hashInterface.createdById === userId) {
				this.hashQueue.splice(index, 1);
			}
		});
		if (this.currentRound !== null) {
			this.currentRound.jobs.forEach((job) => {
				if (job.solverId === userId && !job.isDone) {
					this.currentRound!.jobs.delete(job);
					job.unassign();
					this.currentRound!.jobs.add(job);
				}
			});
		}

		this.users.delete(userId);
	}

	private getJobs(hash: HashInterface): Set<Job> {
		// All jobs that need to be done in a round
		const wordlistJobs = this.getWordlistJobs(hash);
		const bruteforceJobs = this.getBruteforceJobs(hash);
		const jobs = new Set<Job>();
		wordlistJobs.forEach((job) => jobs.add(job));
		bruteforceJobs.forEach((job) => jobs.add(job));
		return jobs;
	}

	private getWordlistJobs(hash: HashInterface): Set<Job> {
		const jobs = new Set<Job>();
		availableWordlists.forEach((wordlistLength, wordlist) => {
			for (let i = 0; i < wordlistLength; i++) {
				const wordlistJobInformation = WordlistJobInformation.create(
					wordlist,
					i
				);
				const job = Job.create({
					jobHashData: hash,
					jobInformation: wordlistJobInformation,
				});
				jobs.add(job);
			}
		});
		console.log(
			`Created ${jobs.size} wordlist jobs for round ${this.roundCounter}`
		);
		return jobs;
	}

	private getBruteforceJobs(hash: HashInterface): Set<Job> {
		const jobs = new Set<Job>();
		for (let i = 0; i < MAXIMUM_BRUTEFORCE_JOBS_AMOUNT; i++) {
			const bruteforceJobInformation = BruteforceJobInformation.create(
				this.currentRound.bruteforceLastArray,
				BRUTEFORCE_AMOUNT_PER_JOB
			);
			this.currentRound.bruteforceLastArray =
				bruteforceJobInformation.next;
			const job = Job.create({
				jobHashData: hash,
				jobInformation: bruteforceJobInformation,
			});
			jobs.add(job);
		}
		if (LOG_LAST_JOB) {
			console.log(
				Array.from(jobs.values())[Array.from(jobs.values()).length - 1]
			);
		}
		console.log(
			`Created ${jobs.size} bruteforce jobs for round ${this.roundCounter}`
		);
		return jobs;
	}

	private solve(id: string, solution: string): void {
		if (this.currentRound === null) {
			throw new Error(
				"No round is currently running. What are you trying to solve?"
			);
		}
		if (solution === "") {
			// Mark job as done without a
			this.currentRound.jobs.forEach((job) => {
				// There should only be one job per user that is not done
				if (job.solverId === id && !job.isDone) {
					this.currentRound.jobs.delete(job);
					job.markAsDone();
					this.currentRound.jobs.add(job);
				}
			});
			return;
		}

		const hash = createHash(this.currentRound.hash.algorithm)
			.update(solution)
			.digest("hex");

		if (hash !== this.currentRound.hash.hash) {
			throw new Error("Your solution is not correct!");
		}

		this.currentRound.solution = solution;
		this.currentRound.solvedAt = new Date();
		this.currentRound.solvedById = id;
	}
}
