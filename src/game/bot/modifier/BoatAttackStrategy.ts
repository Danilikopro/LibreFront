import {type BotPlayer, type BotStrategy, registerBotStrategy} from "../BotPlayer";
import {borderManager} from "../../BorderManager";
import {random} from "../../Random";
import {gameMap, gameMode} from "../../GameData";
import {territoryManager} from "../../TerritoryManager";
import {boatManager} from "../../boat/BoatManager";

//@module game

export class BoatAttackStrategy implements BotStrategy {
	execute(player: BotPlayer): boolean {
		if (player.waterTiles === 0) return false;
		if (random.nextInt(100) >= 30) return false;

		const borderTiles = Array.from(borderManager.getBorderTiles(player.id)); //TODO: Check the performance hit this causes
		const startTile = borderTiles[random.nextInt(borderTiles.length)];
		const targets = gameMap.boatTargets.get(startTile);
		if (targets === undefined) return false;
		const target = targets[random.nextInt(targets.length)];
		if (!gameMode.canAttack(player.id, territoryManager.getOwner(target.tile))) return false;
		boatManager.addBoatInternal(player, target.path, 100);
		return true;
	}
}

registerBotStrategy(s => s.push(new BoatAttackStrategy()));