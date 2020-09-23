import { ffmpeg } from "../ffmpeg.ts";

await ffmpeg("https://www.w3schools.com/html/mov_bbb.mp4")
  // Global encoding options (applied to all outputs).
  .audioBitrate("192k")
  .videoBitrate("1M")
  .width(480)
  .height(640)
  // Ouput 1.
  .output("output.mp4")
  .audioCodec("aac")
  .videoCodec("libx264")
  // Ouput 2.
  .output("output.webm")
  .audioCodec("libvorbis")
  .videoCodec("libvpx-vp9")
  .encode();

console.log("All encodings done!");
