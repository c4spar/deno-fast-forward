#!/usr/bin/env deno run --unstable --allow-read --allow-run

import type { EncodingProcess, EncodingStatus } from "../encoding_process.ts";
import { ffmpeg } from "../ffmpeg.ts";

const encoder = ffmpeg("https://www.w3schools.com/html/mov_bbb.mp4")
  .audioBitrate("192k")
  .videoBitrate("1M")
  .width(480)
  .height(640)
  .output("output.mp4")
  .output("output.mkv");

for await (const process: EncodingProcess of encoder) {
  process.run();
  const status: EncodingStatus = await process.status();
  process.close();
  if (!status.success) {
    throw new Error(
      `Encoding failed: ${process.encoding.output}\n${
        new TextDecoder().decode(await process.stderrOutput())
      }`,
    );
  }
  console.log("Encoding of %s done!", process.encoding.output);
}

console.log("All encodings done!");
