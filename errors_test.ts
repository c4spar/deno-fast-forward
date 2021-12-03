import { assertExpectError, assertInstanceOf } from "./_assertions.ts";
import {
  assertRejects,
  assertThrows,
  dirname,
  fromFileUrl,
} from "./dev_deps.ts";
import { Encoding } from "./encoding.ts";
import { EncodingEventStream } from "./encoding_event_stream.ts";
import { EncodingProcess } from "./encoding_process.ts";
import {
  EncodingEventStreamAlreadyDisposed,
  EncodingProcessAlreadyStarted,
  EncodingProcessNotStarted,
  FFmpegBinaryNotFound,
  FFmpegBinaryPermissionDenied,
  FFmpegCommandFailed,
  FFprobeBinaryNotFound,
  FFprobeBinaryPermissionDenied,
  FFprobeCommandFailed,
} from "./errors.ts";
import { EncodingErrorEvent } from "./events.ts";
import { ffmpeg } from "./ffmpeg.ts";
import { ffprobe } from "./ffprobe.ts";

const rootDir: string = dirname(fromFileUrl(import.meta.url));
const inputPath = `${rootDir}/fixtures/sample.mp4`;

Deno.test({
  name: "ffprobe binary not found error",
  async fn() {
    await assertRejects(
      () => ffprobe(inputPath, { binary: "fffprobe" }),
      FFprobeBinaryNotFound,
    );
  },
});

Deno.test({
  name: "ffprobe binary permission denied error",
  async fn() {
    await assertRejects(
      () => ffprobe(inputPath, { binary: rootDir }),
      FFprobeBinaryPermissionDenied,
    );
  },
});

Deno.test({
  name: "ffprobe command failed error",
  async fn() {
    await assertRejects(
      () => ffprobe(inputPath, { args: ["--abc"] }),
      FFprobeCommandFailed,
    );
  },
});

Deno.test({
  name: "ffmpeg binary not found error",
  fn() {
    const encoding = new Encoding();
    encoding.binary = "fffprobe";
    const process = new EncodingProcess(encoding);
    assertThrows(() => process.run(), FFmpegBinaryNotFound);
  },
});

Deno.test({
  name: "ffmpeg binary permission denied error",
  fn() {
    const encoding = new Encoding();
    encoding.binary = rootDir;
    const process = new EncodingProcess(encoding);
    assertThrows(() => process.run(), FFmpegBinaryPermissionDenied);
  },
});

Deno.test({
  name: "ffmpeg command failed error",
  async fn() {
    const outputPath = `${rootDir}/.tmp/ffmpeg command failed error.mp4`;

    const encoder = ffmpeg(inputPath)
      .output(outputPath)
      .audioBitrate("192kk");

    let errorEvent: EncodingErrorEvent | undefined;
    for await (const process of encoder) {
      process.run();
      for await (const event of process) {
        if (event.type === "error") {
          errorEvent = event;
        }
      }
      process.close();
    }

    assertInstanceOf(errorEvent, EncodingErrorEvent);
    assertExpectError(errorEvent?.error, FFmpegCommandFailed);
  },
});

Deno.test({
  name: "encoding process not started error",
  async fn() {
    const encoding = new Encoding();
    encoding.binary = "ffprobe";
    const process = new EncodingProcess(encoding);

    await assertRejects(
      () => process.status(),
      EncodingProcessNotStarted,
    );
  },
});

Deno.test({
  name: "encoding process already started error",
  async fn() {
    const outputPath =
      `${rootDir}/.tmp/encoding process already started error.mp4`;
    const encoding = new Encoding();
    encoding.input = inputPath;
    encoding.output = outputPath;
    encoding.override = true;
    const process = new EncodingProcess(encoding);
    process.run();
    assertThrows(
      () => process.run(),
      EncodingProcessAlreadyStarted,
    );
    await process.status();
    process.close();
  },
});

Deno.test({
  name: "encoding event stream already disposed error",
  fn() {
    const eventStream = new EncodingEventStream(
      new EncodingProcess(
        new Encoding(),
      ),
    );
    eventStream.dispose();
    assertThrows(
      () => eventStream.dispose(),
      EncodingEventStreamAlreadyDisposed,
    );
  },
});
