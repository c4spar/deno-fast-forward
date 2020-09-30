import { assertEquals, dirname, ensureDir, exists } from "./dev_deps.ts";
import { Encoding } from "./encoding.ts";
import { EncodingProcess } from "./encoding_process.ts";
import { EncodingEventStream } from "./encoding_event_stream.ts";
import {
  EncodingEndEvent,
  EncodingErrorEvent,
  EncodingInfoEvent,
  EncodingStartEvent,
} from "./events.ts";
import { EncodingProgressEvent } from "./events.ts";
import { FFmpeg } from "./ffmpeg.ts";

const rootDir: string = dirname(import.meta.url).replace(/^file:\/\//, "");
const inputPath = `${rootDir}/fixtures/sample.mp4`;

Deno.test({
  name: "custom encoding event stream",
  sanitizeResources: false,
  async fn() {
    const outputPath = `${rootDir}/.tmp/custom encoding event stream.mp4`;
    await ensureDir(`${rootDir}/.tmp`);

    const encoding = new Encoding();
    encoding.input = inputPath;
    encoding.output = outputPath;
    encoding.override = true;
    encoding.width = 200;

    const encodingProcess = new EncodingProcess(encoding);
    const eventStream = new EncodingEventStream(encodingProcess);

    encodingProcess.run();

    let startEvent: EncodingStartEvent | undefined;
    let infoEvent: EncodingInfoEvent | undefined;
    let progressEvent: EncodingProgressEvent | undefined;
    let endEvent: EncodingEndEvent | undefined;
    let errorEvent: EncodingErrorEvent | undefined;
    for await (const event of eventStream) {
      switch (event.type) {
        case "start":
          startEvent = event;
          break;
        case "info":
          infoEvent = event;
          break;
        case "progress":
          progressEvent = event;
          break;
        case "end":
          endEvent = event;
          break;
        case "error":
          errorEvent = event;
          break;
      }
    }

    const outputFileExists: boolean = await exists(outputPath);
    assertEquals(outputFileExists, true);
    assertEquals(startEvent instanceof EncodingStartEvent, true);
    assertEquals(infoEvent instanceof EncodingInfoEvent, true);
    assertEquals(progressEvent instanceof EncodingProgressEvent, true);
    assertEquals(endEvent instanceof EncodingEndEvent, true);
    assertEquals(errorEvent, undefined);
    assertEquals(progressEvent?.progress, 100);

    const status = await encodingProcess.status();
    assertEquals(status.code, 0);
    assertEquals(status.success, true);

    const output = await encodingProcess.output();
    assertEquals(output instanceof Uint8Array, true);

    const errorOutput = await encodingProcess.stderrOutput();
    assertEquals(errorOutput instanceof Uint8Array, true);

    encodingProcess.close();
  },
});

Deno.test({
  name: "multi encoding event stream",
  sanitizeResources: false,
  async fn() {
    const outputPath1 = `${rootDir}/.tmp/multi encoding event stream 1.mp4`;
    const outputPath2 = `${rootDir}/.tmp/multi encoding event stream 2.mp4`;

    const encoder = new FFmpeg()
      .input(inputPath)
      .override(true)
      .width(200)
      .output(outputPath1)
      .output(outputPath2);

    let startEvent: EncodingStartEvent | undefined;
    let infoEvent: EncodingInfoEvent | undefined;
    let progressEvent: EncodingProgressEvent | undefined;
    let endEvent: EncodingEndEvent | undefined;
    for await (const encodingProcess of encoder) {
      encodingProcess.run();
      for await (const event of encodingProcess) {
        switch (event.type) {
          case "start":
            startEvent = event;
            break;
          case "info":
            infoEvent = event;
            break;
          case "progress":
            progressEvent = event;
            break;
          case "end":
            endEvent = event;
            break;
          case "error":
            throw event.error;
        }
      }
      const status = await encodingProcess.status();
      assertEquals(status.code, 0);
      assertEquals(status.success, true);
    }

    const outputFile1Exists: boolean = await exists(outputPath1);
    assertEquals(outputFile1Exists, true, "Missing output file 1.");
    const outputFile2Exists: boolean = await exists(outputPath2);
    assertEquals(outputFile2Exists, true, "Missing output file 2.");
    assertEquals(
      startEvent instanceof EncodingStartEvent,
      true,
      "Invalid start event.",
    );
    assertEquals(
      infoEvent instanceof EncodingInfoEvent,
      true,
      "Invalid info event.",
    );
    assertEquals(
      progressEvent instanceof EncodingProgressEvent,
      true,
      "Invalid progress event.",
    );
    assertEquals(
      endEvent instanceof EncodingEndEvent,
      true,
      "Invalid end event.",
    );
    assertEquals(progressEvent?.progress, 100);
  },
});
