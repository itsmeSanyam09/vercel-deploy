import { createClient } from "redis";
import { copyFinalDist, downloadS3Folder } from "./aws";
import path from "path";
import { buildProject } from "./utils";
import dotenv from "dotenv";
import express from "express";

const app = express();
dotenv.config();
const subscriber = createClient({
  url: `${process.env.redis_url}`,
});
subscriber.connect();
const publisher = createClient({
  url: `${process.env.redis_url}`,
});
publisher.connect();

async function main() {
  while (1) {
    const response = await subscriber.brPop("build-queue", 0);
    console.log(response);
    const id: string = response?.element ?? "jbjh";
    await downloadS3Folder(`output/${id}`);
    await buildProject(id);
    await copyFinalDist(id);
    await publisher.hSet("status", id, "deployed");
    console.log("downloaded");
  }
}
main();

app.listen(process.env.PORT);
