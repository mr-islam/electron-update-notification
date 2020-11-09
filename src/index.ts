"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const path_1 = __importDefault(require("path"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const electron_1 = __importDefault(require("electron"));
const gh = require('github-url-to-object');
async function setUpdateNotification(option = {}) {
    if (electron_1.default.app.isReady) {
        checkUpdate(option);
    }
    else {
        electron_1.default.app.on('ready', () => {
            checkUpdate(option);
        });
    }
}
exports.setUpdateNotification = setUpdateNotification;
async function checkUpdate({ repository, token } = {}) {
    if (!electron_1.default.app.isPackaged)
        return;
    if (!repository) {
        const pkg = require(path_1.default.join(electron_1.default.app.getAppPath(), 'package.json'));
        const obj = gh(pkg.repository);
        assert_1.default(obj, 'Repository not found. Add repository field to package.json file');
        repository = obj.user + '/' + obj.repo;
    }
    try {
        const res = await node_fetch_1.default(`https://api.github.com/repos/${repository}/releases`, {
            headers: token ? { authorization: `token ${token}` } : {},
        });
        const json = await res.json();
        const latest = json[0];
        if (!latest)
            return;
        // Remove leading v
        const latestVersion = latest.tag_name.startsWith('v')
            ? latest.tag_name.slice(1)
            : latest.tag_name;
        if (latestVersion != electron_1.default.app.getVersion()) {
            electron_1.default.dialog.showMessageBox({
                message: `New release available: ${latestVersion}\n\n${latest.body}`,
                buttons: ['Download', 'Later'],
            })
            .then(result => {
                if (result.response === 0) {
                    electron_1.default.shell.openExternal(latest.html_url);
                }
            })
        }
    }
    catch (err) {
        console.error(err);
    }
}
exports.checkUpdate = checkUpdate;
