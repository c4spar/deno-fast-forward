import { assertInstanceOf } from "./_assertions.ts";
import {
  assertEquals,
  dirname,
  ensureDir,
  exists,
  fromFileUrl,
  MuxAsyncIterator,
} from "./dev_deps.ts";
import { Encoding } from "./encoding.ts";
import { EncodingProcess } from "./encoding_process.ts";
import { FFmpeg, ffmpeg } from "./ffmpeg.ts";

const rootDir: string = dirname(fromFileUrl(import.meta.url));
const inputPath = `${rootDir}/fixtures/sample.mp4`;

Deno.test({
  name: "ffmpeg encode",
  async fn() {
    const outputPath = `${rootDir}/.tmp/ffmpeg encode.mp4`;
    await ensureDir(`${rootDir}/.tmp`);

    const encoder = ffmpeg(inputPath)
      .width(200)
      .override(true)
      .output(outputPath);

    assertEquals(encoder.encoding instanceof Encoding, true);
    assertEquals(encoder.encodings.length, 1);

    await encoder.encode();

    const outputFileExists: boolean = await exists(outputPath);
    assertEquals(outputFileExists, true);

    const encoding: Encoding | undefined = encoder.encoding;

    assertEquals(encoding instanceof Encoding, true);

    if (encoding) {
      assertEquals(encoding.width, 200);
      assertEquals(encoding.input, inputPath);
      assertEquals(encoding.output, outputPath);
    }
  },
});

Deno.test({
  name: "ffmpeg multi encoding",
  async fn() {
    const outputPath1 = `${rootDir}/.tmp/ffmpeg multi encoding 1.mp4`;
    const outputPath2 = `${rootDir}/.tmp/ffmpeg multi encoding 2.webm`;

    const encoder = new FFmpeg();
    assertInstanceOf(encoder.encoding, Encoding);
    assertEquals(encoder.encodings.length, 0);

    encoder.override(true)
      .width(200)
      .input(inputPath)
      .output(outputPath1);

    assertEquals(encoder.encoding instanceof Encoding, true);
    assertEquals(encoder.encodings.length, 1);

    encoder.output(outputPath2);

    assertEquals(encoder.encoding instanceof Encoding, true);
    assertEquals(encoder.encodings.length, 2);

    await encoder.encode();

    const outputFileExists1: boolean = await exists(outputPath1);
    const outputFileExists2: boolean = await exists(outputPath2);
    assertEquals(outputFileExists1, true);
    assertEquals(outputFileExists2, true);

    const encoding1: Encoding | undefined = encoder.encodings[0];
    const encoding2: Encoding | undefined = encoder.encodings[1];

    assertEquals(encoding1 instanceof Encoding, true);
    assertEquals(encoding2 instanceof Encoding, true);

    if (encoding1 && encoding2) {
      assertEquals(encoding1.width, 200);
      assertEquals(encoding1.input, inputPath);
      assertEquals(encoding1.output, outputPath1);
      assertEquals(encoding2.width, 200);
      assertEquals(encoding2.input, inputPath);
      assertEquals(encoding2.output, outputPath2);
    }
  },
});

Deno.test({
  name: "ffmpeg multiplexing",
  async fn() {
    const outputPath1 = `${rootDir}/.tmp/ffmpeg multiplexing 1.1.mp4`;
    const outputPath2 = `${rootDir}/.tmp/ffmpeg multiplexing 1.2.mp4`;
    const outputPath3 = `${rootDir}/.tmp/ffmpeg multiplexing 2.1.mp4`;
    const outputPath4 = `${rootDir}/.tmp/ffmpeg multiplexing 2.2.mp4`;

    const encoder1 = new FFmpeg()
      .override(true)
      .width(200)
      .input(inputPath)
      .output(outputPath1)
      .output(outputPath2);

    const encoder2 = new FFmpeg()
      .override(true)
      .width(404)
      .input(inputPath)
      .output(outputPath3)
      .output(outputPath4);

    const iterator = new MuxAsyncIterator<EncodingProcess>();
    iterator.add(encoder1);
    iterator.add(encoder2);

    for await (const process of iterator) {
      process.run();
      await process.status();
      process.close();
    }

    const outputFileExists1: boolean = await exists(outputPath1);
    const outputFileExists2: boolean = await exists(outputPath2);
    const outputFileExists3: boolean = await exists(outputPath3);
    const outputFileExists4: boolean = await exists(outputPath4);
    assertEquals(outputFileExists1, true);
    assertEquals(outputFileExists2, true);
    assertEquals(outputFileExists3, true);
    assertEquals(outputFileExists4, true);
  },
});

Deno.test({
  name: "ffmpeg encoding options",
  async fn() {
    const outputPath = `${rootDir}/.tmp/ffmpeg encoding.mp4`;
    await ensureDir(`${rootDir}/.tmp`);

    const encoder = new FFmpeg()
      .input(inputPath)
      .output(outputPath)
      .override(true)
      .cwd(Deno.cwd())
      .threads(1)
      .binary("ffmpeg")
      .format("mp4")
      .audioBitrate("192k")
      .videoBitrate("1M")
      .minVideoBitrate("1M")
      .maxVideoBitrate("1M")
      .videoBufSize("3M")
      // .codec("copy")
      .audioCodec("aac")
      .videoCodec("libx264")
      .width(200)
      .height(-1)
      // .frameRate(24)
      // .sampleRate(44100)
      .frames(100)
      .audioQuality(2)
      .audioChannels(2)
      .duration(4)
      .loop(0)
      // .rotate(-180)
      .noAudio(false)
      .noVideo(false)
      // .logLevel("repeat+level+verbose")
      .args([]);

    assertEquals(encoder.encoding instanceof Encoding, true);
    assertEquals(encoder.encodings.length, 1);

    await encoder.encode();

    const outputFileExists: boolean = await exists(outputPath);
    assertEquals(outputFileExists, true);

    assertEquals(encoder.encoding instanceof Encoding, true);

    if (encoder.encoding) {
      // assertEquals(encoding.width, 200);
      assertEquals(encoder.encoding.input, inputPath);
      assertEquals(encoder.encoding.output, outputPath);
    }
  },
});
