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
exports.uploadFile = void 0;
exports.downloadS3Folder = downloadS3Folder;
exports.copyFinalDist = copyFinalDist;
const path_1 = __importDefault(require("path"));
const aws_sdk_1 = require("aws-sdk");
const fs_1 = __importDefault(require("fs"));
const utils_1 = require("./utils");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    bucket: `${process.env.bucket_name}`,
};
const s3 = new aws_sdk_1.S3({
    credentials: {
        accessKeyId: `${process.env.accessKeyId}`,
        secretAccessKey: `${process.env.secretAccessKey}`,
    },
    endpoint: `${process.env.bucket_endpoint}`,
    region: "ap-northeast-1",
    s3ForcePathStyle: true,
});
function downloadS3Folder(prefix) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const allFiles = yield s3
            .listObjectsV2({
            Bucket: config.bucket,
            Prefix: prefix,
        })
            .promise();
        console.log("all files", allFiles);
        const allPromises = ((_a = allFiles.Contents) === null || _a === void 0 ? void 0 : _a.map((_a) => __awaiter(this, [_a], void 0, function* ({ Key }) {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                if (!Key) {
                    resolve("");
                    console.log("returned");
                    return;
                }
                const finalOutputPath = path_1.default.join(__dirname, Key);
                const outputFile = fs_1.default.createWriteStream(finalOutputPath);
                const dirname = path_1.default.dirname(finalOutputPath);
                if (!fs_1.default.existsSync(dirname)) {
                    fs_1.default.mkdirSync(dirname, { recursive: true });
                }
                s3.getObject({
                    Bucket: config.bucket,
                    Key,
                })
                    .createReadStream()
                    .pipe(outputFile)
                    .on("finish", () => {
                    resolve("");
                    console.log("directory pushed");
                });
            }));
        }))) || [];
        yield Promise.all(allPromises === null || allPromises === void 0 ? void 0 : allPromises.filter((x) => x !== undefined));
    });
}
const uploadFile = (fileName, localFilePath) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("called");
    const fileContent = fs_1.default.readFileSync(localFilePath);
    const response = yield s3
        .upload({
        Body: fileContent,
        Bucket: config.bucket,
        Key: fileName,
    })
        .promise();
    console.log(response);
});
exports.uploadFile = uploadFile;
function copyFinalDist(id) {
    const folderPath = path_1.default.join(__dirname, `output/${id}/dist`);
    const allFiles = (0, utils_1.getAllFiles)(folderPath);
    allFiles.forEach((file) => {
        (0, exports.uploadFile)(`dist/${id}/` + file.slice(folderPath.length + 1), file);
    });
}
