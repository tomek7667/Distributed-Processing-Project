import { Message, MessageType } from "@domain/index";
import { Algorithm, HashInterface } from "../common";
import { socketServer } from "../routes";

const hashValidationMap = new Map<string, RegExp>([
	[Algorithm.MD5, /^[a-f0-9]{32}$/],
	[Algorithm.SHA256, /^[a-f0-9]{64}$/],
	[Algorithm.SHA512, /^[a-f0-9]{128}$/],
]);

export class QueueService {
	constructor(
		private readonly hashQueue: Array<HashInterface>,
		private readonly users: Set<string>
	) {}

	public initialize(): void {
		socketServer.on("connection", (socket) => {
			let lifecheck = true;
			console.log(`new connection: ${socket.id}`);
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
								userId: msg.socketId,
								createdAt: msg.createdAt,
							});
							socket.emit("log", "Hash added to queue");
							break;
						case MessageType.SolveHash:
							console.log(socket.id, "solve hash");
							console.log(msg);
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

			socket.on("forceDisconnect", () => {
				console.log(`disconnecting: ${socket.id}`);
				this.users.delete(socket.id);
				socket.disconnect();
			});

			socket.on("lifecheck", () => {
				lifecheck = true;
			});

			const lifecheckInterval = setInterval(() => {
				lifecheck = false;
				socket.emit("lifecheck");
				setTimeout(() => {
					if (!lifecheck) {
						console.log(`user inactive: ${socket.id}`);
						this.removeUser(socket.id);
						socket.disconnect();
						clearInterval(lifecheckInterval);
					}
				}, 2500);
			}, 5000);
		});

		console.log("Queue service initialized");
	}

	public addHash(hash: HashInterface): void {
		this.hashQueue.forEach((hashInterface) => {
			if (hashInterface.hash === hash.hash) {
				throw new Error(
					`This hash is already in the queue. Submitted at ${hashInterface.createdAt.toLocaleString()}`
				);
			}
			if (hashInterface.userId === hash.userId) {
				throw new Error(
					`You already have a hash in the queue: ${
						hashInterface.hash
					} created at ${hashInterface.createdAt.toLocaleString()}`
				);
			}
		});

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

	public removeUser(userId: string): void {
		this.hashQueue.forEach((hashInterface, index) => {
			if (hashInterface.userId === userId) {
				this.hashQueue.splice(index, 1);
			}
		});
		this.users.delete(userId);
	}
}
