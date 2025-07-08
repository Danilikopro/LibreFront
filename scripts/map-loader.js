const {readdirSync, readFileSync, writeFileSync, mkdirSync, unlinkSync} = require("fs");

module.exports = async function (map) {
	if (map.includes("// BUILD_MAPS_REGISTER")) {
		console.log("Registering default maps...");

		mkdirSync("build/cache", {recursive: true});

		const maps = await Promise.all(readFileSync("resources/defaultMaps.txt", "utf8").split("\n").map(m => m.trim()).filter(m => m !== "").map(async map => {
			let data, cached = false, name = "";
			try {
				data = Uint8Array.from(readFileSync(`build/cache/${map}.mapcache`));
				name = readZeroString(data, 0);
				data = data.slice(name.length + 1);
				cached = true;
			} catch (e) {
				data = await downloadMap(map, false);
				({name} = (await downloadMap(map, true))["entry"]);
				const cache = new Uint8Array(name.length + 1 + data.length);
				writeZeroString(cache, 0, name);
				cache.set(data, name.length + 1);
				writeFileSync(`build/cache/${map}.mapcache`, cache);
			}
			console.log(`Registered map ${name} [${Math.round(data.length / 1024 * 10) / 10} KB]${cached ? " (cached)" : ""}`);
			return {id: map, name, data};
		}));

		map = map.replace(/\/\/ BUILD_MAPS_REGISTER/, maps.map(m => `registerMap("${m.name}", "${Buffer.from(m.data).toString("base64")}");`).join("\n"));

		for (const file of readdirSync("build/cache")) {
			if (!maps.some(m => file === `${m.id}.mapcache`)) {
				console.log(`Removing unused cache ${file}`);
				unlinkSync(`build/cache/${file}`);
			}
		}
	}
	return map;
}

async function downloadMap(id, info) {
	return new Promise(resolve => {
		fetch(`https://warfront.io/api/v1/maps/versions/${id}${info ? "/details" : ""}`)
			.then(async map => {
				if (map.status === 200) {
					if (info) resolve(await map.json());
					else resolve(new Uint8Array(await map.arrayBuffer()));
				} else if (map.status === 429) {
					const wait = parseInt(map.headers.get("Retry-After")) + 10;
					console.log(`Got HTTP 429: Waiting ${wait} seconds before retrying...`);
					setTimeout(() => {
						downloadMap(id, info).then(resolve);
					}, wait * 1000);
				} else {
					console.warn("Failed to download map " + id + ": " + map.status + " " + map.statusText);
					resolve(null);
				}
			})
			.catch(e => {
				console.error(e);
				resolve(null);
			});
	});
}

function readZeroString(buffer, offset) {
	let i = offset, result = "";
	while (buffer[i] !== 0 && i < buffer.length) {
		result += String.fromCharCode(buffer[i]);
		i++;
	}
	return result;
}

function writeZeroString(buffer, offset, string) {
	let i = offset;
	for (const c of string) {
		buffer[i++] = c.charCodeAt(0);
	}
	buffer[i++] = 0;
	return i;
}