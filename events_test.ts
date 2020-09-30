import {
  assertNotEquals,
  assertEquals,
  dirname,
  ensureDir,
} from "./dev_deps.ts";
import {
  EncodingEndEvent,
  EncodingEvent,
  EncodingInfoEvent,
  EncodingStartEvent,
} from "./events.ts";
import { FFmpeg } from "./ffmpeg.ts";

const rootDir: string = dirname(import.meta.url).replace(/^file:\/\//, "");
const inputPath = `${rootDir}/fixtures/sample.mp4`;

function registerEventListener(encoder: FFmpeg): Array<EncodingEvent | Error> {
  const events: Array<EncodingEvent | Error> = [];
  encoder
    .addEventListener("start", (event) => events.push(event))
    .addEventListener("info", (event) => events.push(event))
    .addEventListener("end", (event) => events.push(event))
    .addEventListener("error", (event) => events.push(event));
  return events;
}

Deno.test({
  name: "encoding events",
  async fn() {
    const outputPath = `${rootDir}/.tmp/encoding events.mp4`;
    await ensureDir(`${rootDir}/.tmp`);

    const encoder = new FFmpeg()
      .override(true)
      .width(200)
      .input(inputPath)
      .output(outputPath);

    const events = registerEventListener(encoder);

    await encoder.encode();

    const [
      startEvent,
      infoEvent,
      endEvent,
      errorEvent,
    ]: Array<EncodingEvent | Error> = events;

    assertEquals(errorEvent, undefined);

    assertEquals(startEvent instanceof EncodingStartEvent, true);
    if (infoEvent instanceof EncodingInfoEvent) {
      assertNotEquals(infoEvent.info, undefined);
      assertNotEquals(infoEvent.info.format, undefined);
      assertEquals(Array.isArray(infoEvent.info.streams), true);
      assertEquals(infoEvent.info.streams.length > 0, true);
    }

    assertEquals(infoEvent instanceof EncodingInfoEvent, true);
    if (infoEvent instanceof EncodingInfoEvent) {
      assertNotEquals(infoEvent.info, undefined);
      assertNotEquals(infoEvent.info.format, undefined);
      assertEquals(Array.isArray(infoEvent.info.streams), true);
      assertEquals(infoEvent.info.streams.length > 0, true);
    }

    assertEquals(endEvent instanceof EncodingEndEvent, true);
    if (infoEvent instanceof EncodingInfoEvent) {
      assertNotEquals(infoEvent.info, undefined);
      assertNotEquals(infoEvent.info.format, undefined);
      assertEquals(Array.isArray(infoEvent.info.streams), true);
      assertEquals(infoEvent.info.streams.length > 0, true);
    }
  },
});
