import type {APIMapInformation, MapVersion} from "../network/api/MapRegistryRoutes";
import {apiToUserAccount, type UserAccount} from "../network/protocol/util/ProtocolUtils";
import {decodeMap} from "./codec/MapCodec";
import {GameMap} from "./GameMap";
import {downloadMap, getMapVersion} from "../network/api/MapRegistryRoutes";
import {IllegalStateException} from "../util/Exceptions";

const mapRegistry: Map<string, EncodedMapData> = new Map();
const mapCache: Map<string, Uint8Array> = new Map();

type EncodedMapData = {
	name: string;
	author: UserAccount
}

type MapInformation = Omit<APIMapInformation, "author"> & { author: UserAccount };

/**
 * Retrieves a map from the registry by its ID.
 * @param id string ID of the map version
 * @returns the map
 */
export async function mapFromId(id: string): Promise<GameMap> {
	if (!mapCache.has(id)) {
		mapCache.set(id, await downloadMap({id}).await(200));
	}
	const data = mapCache.get(id);
	if (!data) throw new IllegalStateException("Invalid map cache");
	const decoded = decodeMap(data);
	const map = new GameMap(id, decoded.width, decoded.height, decoded.types);
	for (let i = 0; i < decoded.tiles.length; i++) {
		map.setTileId(i, decoded.tiles[i]);
	}
	map.calculateAreaMap();
	map.calculateDistanceMap();
	return map;
}

/**
 * Retrieves the map information from the registry by its ID.
 * @param id string ID of the map version
 * @returns the map information
 */
export async function mapInfoFromId(id: string): Promise<MapVersion & { entry: Omit<MapInformation, "versions"> }> {
	const value = await getMapVersion({id}).await(200);
	return {...value, entry: {...value.entry, author: apiToUserAccount(value.entry.author)}};
}

/**
 * @returns an object containing the names and ids of all default maps (bundled with the game)
 */
export function getDefaultMapIds(): [string, EncodedMapData][] {
	return Array.from(mapRegistry.entries());
}

// The following lines are filled in by the build process
// BUILD_MAPS_REGISTER
// End of map register block