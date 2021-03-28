#!/usr/bin/env deno run --unstable --allow-read --allow-write --allow-run

import type { EncodingProcess } from "../mod.ts";
import { ffmpeg } from "../mod.ts";

const encoder = ffmpeg("https://www.w3schools.com/html/mov_bbb.mp4")
  .output("pipe:1")
  .format("mp4")
  .videoBitrate("933k")
  .audioBitrate("128k")
  .args(["-movflags", "frag_keyframe+empty_moov"]);

for await (const process: EncodingProcess of encoder) {
  process.run();
  if (process.stdout) {
    const outputFile: Deno.File = await Deno.open("output.mp4", {
      create: true,
      write: true,
    });
    const [status] = await Promise.all([
      process.status(),
      Deno.copy(process.stdout, outputFile),
    ]);
    console.log({ status });
  }
  process.close();
}

console.log("Encoding done!");
