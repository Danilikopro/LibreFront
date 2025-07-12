import {type BotTrigger, registerBotTrigger} from "../BotPlayer";
import {random} from "../../Random";
import {gameTicker} from "../../GameTicker";

//@module game

export class RandomBotTrigger implements BotTrigger {
	private readonly chance: number;

	/**
	 * Creates a new random bot trigger.
	 * @param chance The chance to trigger a bot action in percent
	 */
	constructor(chance: number) {
		this.chance = chance;
	}

	trigger(): boolean {
		return random.nextInt(100) < this.chance;
	}
}

export class IntervalBotTrigger implements BotTrigger {
	private readonly interval: number;
	private lastTrigger: number;

	/**
	 * Creates a new interval bot trigger.
	 * @param interval The interval in ticks
	 * @param initialDelay The initial delay in ticks
	 */
	constructor(interval: number, initialDelay: number = 0) {
		this.interval = interval;
		this.lastTrigger = initialDelay - interval;
	}

	trigger(): boolean {
		if (gameTicker.getTickCount() - this.lastTrigger < this.interval) {
			return false;
		}
		this.lastTrigger = gameTicker.getTickCount();
		return true;
	}
}

//TODO: Implement bot trigger based on game state (e.g. when the bot was recently attacked)

registerBotTrigger(t => {
	const seed = random.nextInt(100);
	if (seed < 3) {
		t.push(new IntervalBotTrigger(5, random.nextInt(5)));
	} else if (seed < 10) {
		t.push(new RandomBotTrigger(seed));
	} else {
		t.push(
			new RandomBotTrigger(seed % 10),
			new IntervalBotTrigger(seed + 10, random.nextInt(seed))
		);
	}
});