import type {APIUserAccount} from "../protocol/util/ProtocolUtils";
import {endpointGET} from "./Endpoint";

/**
 * Get basic information about a map.
 * @param id The map ID
 */
export const getMap = endpointGET("/maps/{id}")<{}, { 200: APIMapInformation, 400: undefined, 404: undefined }>();

/**
 * Get a list of available versions for a map.
 * @param id The map ID
 * @param page The page to request (zero indexed)
 */
export const getMapVersions = endpointGET("/maps/{id}/versions")<{page: string}, { 200: MapVersion[], 400: undefined }>();

/**
 * Get binary map data compatible with the map codec.
 * @param id The map version ID
 * @internal Use {@link mapFromId} instead
 */
export const downloadMap = endpointGET("/maps/versions/{id}")<{}, { 200: Uint8Array, 400: undefined, 404: undefined, 500: string }>();

/**
 * Get basic information about a map version.
 * @param id The map version ID
 */
export const getMapVersion = endpointGET("/maps/versions/{id}/details")<{}, { 200: MapVersion & { entry: Omit<APIMapInformation, "versions"> }, 400: undefined, 404: undefined, 500: string }>();

export type APIMapInformation = {
	id: string,
	name: string,
	description: string,
	author: APIUserAccount,
	versions: MapVersion[]
}

export type MapVersion = {
	id: string,
	version: number,
	time: number
}