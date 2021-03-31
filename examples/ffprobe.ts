#!/usr/bin/env deno run --allow-run

import { ffprobe } from "../ffprobe.ts";

console.log(
  await ffprobe("https://www.w3schools.com/html/mov_bbb.mp4"),
);
