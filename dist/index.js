"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const aws_1 = require("./aws");
const utils_1 = require("./utils");
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
dotenv_1.default.config();
const subscriber = (0, redis_1.createClient)({
    url: `${process.env.redis_url}`,
});
subscriber.connect();
const publisher = (0, redis_1.createClient)({
    url: `${process.env.redis_url}`,
});
publisher.connect();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        while (1) {
            const response = yield subscriber.brPop("build-queue", 0);
            console.log(response);
            const id = (_a = response === null || response === void 0 ? void 0 : response.element) !== null && _a !== void 0 ? _a : "jbjh";
            yield (0, aws_1.downloadS3Folder)(`output/${id}`);
            yield (0, utils_1.buildProject)(id);
            yield (0, aws_1.copyFinalDist)(id);
            yield publisher.hSet("status", id, "deployed");
            console.log("downloaded");
        }
    });
}
main();
app.listen(process.env.PORT);
