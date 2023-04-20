import {
	BruteforceJobInformation,
	MAXIMUM_PRINTABLE_ASCII,
	MINIMUM_PRINTABLE_ASCII,
	MAXIMUM_DISTANCE,
} from "../master/common/JobInformation";

describe("Brute Force Job", () => {
	it("calculates next job correctly - 0 rotations", () => {
		const offset = 1;
		const result = BruteforceJobInformation.calculateNext(
			[
				MINIMUM_PRINTABLE_ASCII,
				MINIMUM_PRINTABLE_ASCII,
				MINIMUM_PRINTABLE_ASCII,
			],
			offset
		);
		expect(result).toEqual([
			MINIMUM_PRINTABLE_ASCII,
			MINIMUM_PRINTABLE_ASCII,
			MINIMUM_PRINTABLE_ASCII + offset,
		]);
	});

	it("calculates next job correctly - 1 rotation", () => {
		const result = BruteforceJobInformation.calculateNext(
			[
				MINIMUM_PRINTABLE_ASCII,
				MINIMUM_PRINTABLE_ASCII,
				MINIMUM_PRINTABLE_ASCII,
			],
			MAXIMUM_DISTANCE
		);
		expect(result).toEqual([
			MINIMUM_PRINTABLE_ASCII,
			MINIMUM_PRINTABLE_ASCII + 1,
			MINIMUM_PRINTABLE_ASCII,
		]);
	});

	it("adds next position in next job - 0 rotations", () => {
		const offset = 1;
		const result = BruteforceJobInformation.calculateNext(
			[
				MAXIMUM_PRINTABLE_ASCII,
				MAXIMUM_PRINTABLE_ASCII,
				MAXIMUM_PRINTABLE_ASCII,
			],
			offset
		);
		expect(result).toEqual([
			MINIMUM_PRINTABLE_ASCII,
			MINIMUM_PRINTABLE_ASCII,
			MINIMUM_PRINTABLE_ASCII,
			MINIMUM_PRINTABLE_ASCII,
		]);
	});

	it("adds next position in next job - 1 rotation", () => {
		const offset = 1 + MAXIMUM_DISTANCE + 1;
		const result = BruteforceJobInformation.calculateNext(
			[
				MAXIMUM_PRINTABLE_ASCII,
				MAXIMUM_PRINTABLE_ASCII,
				MAXIMUM_PRINTABLE_ASCII,
			],
			offset
		);
		expect(result).toEqual([
			MINIMUM_PRINTABLE_ASCII,
			MINIMUM_PRINTABLE_ASCII,
			MINIMUM_PRINTABLE_ASCII + 1,
			MINIMUM_PRINTABLE_ASCII + 1,
		]);
	});
});
