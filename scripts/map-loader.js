const {readdirSync, readFileSync, writeFileSync, mkdirSync, unlinkSync} = require("fs");

module.exports = async function (map) {
	if (map.includes("// BUILD_MAPS_REGISTER")) {
		console.log("Registering default maps...");

		mkdirSync("build/cache", {recursive: true});

		const maps = await Promise.all(readFileSync("resources/defaultMaps.txt", "utf8").split("\n").map(m => m.trim()).filter(m => m !== "").map(async map => {
			let data, cached = false, name, author;
			try {
				data = Uint8Array.from(readFileSync(`build/cache/${map}.mapcache`));
				offset = 0;
				name = readZeroString(data);
				author = {
					id: readZeroString(data),
					service: readZeroString(data),
					user_id: readZeroString(data),
					username: readZeroString(data),
					avatar_url: readZeroString(data)
				}
				data = data.slice(offset);
				cached = true;
			} catch (e) {
				data = await downloadMap(map, false);
				({name, author} = (await downloadMap(map, true))["entry"]);
				const cache = new Uint8Array(name.length + author.id.length + author.service.length + author.user_id.length + author.username.length + author.avatar_url.length + 6 + data.length);
				offset = 0;
				writeZeroString(cache, name);
				writeZeroString(cache, author.id);
				writeZeroString(cache, author.service);
				writeZeroString(cache, author.user_id);
				writeZeroString(cache, author.username);
				writeZeroString(cache, author.avatar_url);
				cache.set(data, offset);
				writeFileSync(`build/cache/${map}.mapcache`, cache);
			}
			console.log(`Registered map ${name} [${Math.round(data.length / 1024 * 10) / 10} KB]${cached ? " (cached)" : ""}`);
			return {id: map, name, author, data};
		}));

		map = map.replace(/\/\/ BUILD_MAPS_REGISTER/, maps.map(m => `mapRegistry.set("${JSON.stringify(m.id).slice(1, -1)}", {name: "${JSON.stringify(m.name).slice(1, -1)}", author: apiToUserAccount(${JSON.stringify(m.author)})});\nmapCache.set("${JSON.stringify(m.id).slice(1, -1)}", Uint8Array.from(atob("${Buffer.from(m.data).toString("base64")}"), c => c.charCodeAt(0)));`).join("\n"));

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

let offset = 0;
function readZeroString(buffer) {
	let result = "";
	while (buffer[offset] !== 0 && offset < buffer.length) {
		result += String.fromCharCode(buffer[offset]);
		offset++;
	}
	offset++;
	return result;
}

function writeZeroString(buffer, string) {
	for (const c of string) {
		buffer[offset++] = c.charCodeAt(0);
	}
	buffer[offset++] = 0;
}