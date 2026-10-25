import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { test } from "node:test";

const mainFile = fileURLToPath(new URL("../electron/main.cjs", import.meta.url));
const mainSource = readFileSync(mainFile, "utf8");
const mainRequire = createRequire(mainFile);

test("personal packaged build never loads the updater, including with a feed override", () => {
	let updaterLoads = 0;
	let menu: Array<{ submenu: Array<{ label?: string; enabled?: boolean }> }> = [];
	const electron = {
		app: { isPackaged: true, setName() {}, requestSingleInstanceLock: () => false, quit() {} },
		Menu: {
			buildFromTemplate(template: typeof menu) { menu = template; return template; },
			setApplicationMenu() {},
		},
	};
	const context = {
		require: (id: string) => {
			if (id === "electron") return electron;
			if (id === "electron-updater") {
				updaterLoads++;
				throw new Error("The personal build must not load the updater");
			}
			return mainRequire(id);
		},
		process: { platform: "win32", argv: [], env: { LH_UPDATE_FEED: "https://example.invalid/updates" }, on() {} },
		console: { log() {} },
		__dirname: dirname(mainFile),
	};
	runInNewContext(mainSource, context, { filename: mainFile });
	runInNewContext("setupAutoUpdater(); checkForUpdates(); installUpdateNow(); installMenu();", context);
	assert.equal(updaterLoads, 0);
	assert.equal(runInNewContext("autoUpdater", context), null);
	const updateItem = menu.flatMap((item) => item.submenu).find((item) => item.label === "Check for Updates…");
	assert.ok(updateItem);
	assert.equal(updateItem.enabled, false);
});
