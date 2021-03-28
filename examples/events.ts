#!/usr/bin/env deno run --unstable --allow-read --allow-run

import { ffmpeg } from "../ffmpeg.ts";

await ffmpeg("https://www.w3schools.com/html/mov_bbb.mp4")
  .audioBitrate("192k")
  .videoBitrate("1M")
  .width(480)
  .height(640)
  .addEventListener("start", (event) => console.log("Event: %s", event.type))
  .addEventListener("info", (event) => console.log("Event: %s", event.type))
  .addEventListener(
    "progress",
    (event) => console.log("Event: %s", event.type, `${event.progress}%`),
  )
  .addEventListener("end", (event) => console.log("Event: %s", event.type))
  .addEventListener(
    "error",
    (error) => console.log("Error event: %s", error.error),
  )
  .output("output.mp4")
  .output("output.mov")
  .encode();

console.log("All encodings done!");
