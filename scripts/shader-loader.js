const {readFileSync} = require("fs");

module.exports = async function (shader) {
	return shader
		.replace(/load(Vertex|Fragment)Shader\("([^"]+)"\);/g, (_, type, file) => `load${type}Shader(\`${readFileSync("src/renderer/shader/" + file)}\`);`)
		.replace(/GameFont\.fromRaw\(ctx, *"([^"]+)", *"([^"]+)"\)/g, (_, image, data) => `GameFont.fromRaw(ctx, \`data:image/png;base64,${Buffer.from(readFileSync("src/renderer/shader/" + image)).toString("base64")}\`, "${encodeFontData(JSON.parse(readFileSync("src/renderer/shader/" + data)))}")`);
}

function encodeFontData(data) {
	const writer = new LazyWriter();
	writer.writeBits(16, data["chars"].length);
	for (const char of data["chars"]) {
		writer.writeBits(16, char["id"]);
		writer.writeBits(12, char["x"]);
		writer.writeBits(12, char["y"]);
		writer.writeBits(8, char["xoffset"] + 128);
		writer.writeBits(8, char["yoffset"] + 128);
		writer.writeBits(8, char["xadvance"]);
		writer.writeBits(8, char["width"]);
		writer.writeBits(8, char["height"]);
		const kernings = data["kernings"].filter(k => k["first"] === char["id"]);
		writer.writeBits(16, kernings.length);
		for (const kern of kernings) {
			writer.writeBits(16, kern["second"]);
			writer.writeBits(8, kern["amount"] + 128);
		}
	}
	writer.writeBits(8, data["common"]["lineHeight"]);
	return Buffer.from(writer.compress()).toString("base64");
}

class LazyWriter {
	length = 0;
	data = [];
	offset = 0;
	buffer;

	actuallyWriteBits(length, value) {
		for (let i = this.offset; i < this.offset + length; i++) {
			this.buffer[i >>> 3] |= ((value >>> i - this.offset) & 1) << (~i & 7);
		}
		this.offset += length;
	}

	writeBits(length, value) {
		if (length > 32) throw new Error("Cannot write more than 32 bits at a time");
		this.data.push(() => {
			this.actuallyWriteBits(length, value);
		});
		this.length += length;
	}

	compress() {
		this.offset = 0;
		this.buffer = new Uint8Array(Math.ceil(this.length / 8));
		for (const bit of this.data) {
			bit();
		}
		return this.buffer;
	}
}