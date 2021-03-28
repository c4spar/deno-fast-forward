<h1 align="center">Fast Forward</h1>

<p align="center">An easy to use ffmpeg module for Deno.</p>

<p align="center" class="badges-container">
  <a href="https://github.com/c4spar/deno-fast-forward/actions?query=workflow%3ATest">
    <img alt="Build status" src="https://github.com/c4spar/deno-fast-forward/workflows/Test/badge.svg?branch=main" />
  </a>
  <a href="https://github.com/c4spar/deno-fast-forward/releases">
    <img alt="Version" src="https://img.shields.io/github/v/release/c4spar/deno-fast-forward?logo=github&color=blue&label=latest" />
  </a>
  <a href="https://deno.land/">
    <img alt="Deno version" src="https://img.shields.io/badge/deno-^1.6.2-blue?logo=deno" />
  </a>
  <a href="https://doc.deno.land/https/deno.land/x/fast_forward/mod.ts">
    <img alt="doc" src="https://img.shields.io/badge/deno-doc-yellow?logo=deno" />
  </a>
  <a href="https://github.com/c4spar/deno-fast-forward/actions?query=workflow%3Aci">
    <img alt="Licence" src="https://img.shields.io/github/license/c4spar/deno-fast-forward?logo=github" />
  </a>
  <a href="https://nest.land/package/fast_forward">
    <img src="https://nest.land/badge.svg" alt="nest.land badge">
  </a>
</p>

> ⚠️ Work In Progress! Expect breaking changes!

## Contents

- [Installation](#installation)
- [Usage](#usage)
- [Getting Started](#getting-started)
- [Examples](#Examples)
  - [Events](#events)
  - [Process Handling](#process-handling)
  - [Event Stream](#event-stream)
  - [Output Stream](#output-stream)
- [Contributing](#contributing)
- [License](#license)

## Installation

This is a Deno module and can be imported directly from the repo and from
following registries.

[Deno Registry](https://deno.land/x/fast_forward)

```typescript
import { ffmpeg } from "https://deno.land/x/fast_forward@<version>/prompt/mod.ts";
```

[Nest Registry](https://nest.land/package/fast_forward)

```typescript
import { ffmpeg } from "https://x.nest.land/fast_forward@<version>/prompt/mod.ts";
```

[Github](https://github.com/c4spar/deno-fast-forward)

```typescript
import { ffmpeg } from "https://raw.githubusercontent.com/c4spar/deno-fast-forward/<version>/prompt/mod.ts";
```

## Usage

```typescript
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
  // Start encoding.
  .encode();

console.log("All encodings done!");
```

```typescript
$ deno run --allow-read --allow-run https://deno.land/x/fast_forward/examples/usage.ts
```

## Getting Started

First create an instance of FFmpeg.

```typescript
const encoder = ffmpeg("https://www.w3schools.com/html/mov_bbb.mp4");
// or using the constructor
const encoder = new FFmpeg("https://www.w3schools.com/html/mov_bbb.mp4");
```

Then you can define global options and events which will be applied to all
defined outputs.

```typescript
encoder
  .audioBitrate("192k")
  .videoBitrate("1M")
  .addEventListener(
    "progress",
    (event) => console.log("Progress: %s", event.progress),
  )
  .addEventListener("error", (event) => console.log(event.error));
```

The `.output()` method add's a new encoding object which inherits all global
options and events. Multiple outputs can be added with additional options for
each output.

```typescript
encoder
  .output("output-x264.mp4")
  .videoCodec("libx264")
  .output("output-x265.mp4")
  .videoCodec("libx265");
```

To start the encoding just call the `.encode()` method and await the returned
promise.

```typescript
await encoder.encode();
```

To get more control over the encoding precesses you can use the encoder instance
as async iterator to iterate over all encoding processes with a `for await`
loop. The process instance is an wrapper around the deno process and has almost
the same methods and properties. The encoding process can be started with the
`.run()` method and must be closed with the `.close()` method after the process
is finished or has failed.

There are to different ways to await the status. The first one is using the
`.status()` method, same like with the deno process.

```typescript
for await (const process: EndofingProcess of encoder) {
  process.run();
  const status: EncodingStatus = await process.status();
  if (!status.success) {
    process.close();
    throw new Error("Encoding failed.");
  }
  process.close();
}
console.log("All encodings done!");
```

The second one is using an async iterator. You can use the encoding process as
async iterator to iterate over all encoding events. If no error occurs then the
status is success, if the status is not success or any encoding error occurs an
error event is emitted.

```typescript
for await (const process: EndofingProcess of encoder) {
  process.run();
  for await (const event: EncodingEvent of process) {
    switch (event.type) {
      case "start":
        console.log("start encoding of: %s", event.encoding.output);
        return;
      case "info":
        console.log("Media info loaded: %o", event.info);
        return;
      case "progress":
        console.log(
          "Encoding progress of: %s - %n%",
          event.encoding.output,
          event.progress,
        );
        return;
      case "end":
        console.log("Encoding of %s done!", event.encoding.output);
        return;
      case "error":
        process.close();
        throw event.error;
    }
  }
  process.close();
}
console.log("All encodings done!");
```

## Examples

### Events

```typescript
await ffmpeg("https://www.w3schools.com/html/mov_bbb.mp4")
  .audioBitrate("192k")
  .videoBitrate("1M")
  .width(480)
  .height(640)
  .addEventListener("start", (event) => console.log("Event: %s", event.type))
  .addEventListener("info", (event) => console.log("Event: %s", event.type))
  .addEventListener("progress", (event) => console.log("Event: %s", event.type))
  .addEventListener("end", (event) => console.log("Event: %s", event.type))
  .addEventListener("error", (error) => console.log("Event: %s", error.type))
  .output("output.mp4")
  .output("output.webm")
  .encode();

console.log("All encodings done!");
```

```
$ deno run --allow-read --allow-run https://deno.land/x/fast_forward/examples/events.ts
```

### Process handling

```typescript
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
```

```
$ deno run --allow-read --allow-run https://deno.land/x/fast_forward/examples/process-handling.ts
```

### Event Stream

```typescript
const spinner = wait({ text: "" });

const encoder = ffmpeg("https://www.w3schools.com/html/mov_bbb.mp4")
  .audioBitrate("192k")
  .videoBitrate("1M")
  .width(480)
  .height(640)
  .output("output.mp4")
  .output("output.webm");

for await (const process: EncodingProcess of encoder) {
  process.run();
  spinner.start();
  for await (const event: EncodingEvent of process) {
    switch (event.type) {
      case "start":
        spinner.text = `Loading meta data: ${event.encoding.output} ...`;
        break;
      case "info":
        spinner.text = `Start encoding: ${event.encoding.output} ...`;
        break;
      case "progress":
        spinner.text = `Encode: ${event.encoding.output} - ${event.progress}%`;
        break;
      case "end":
        spinner.stop();
        process.close();
        console.log(`✔ Encode: ${process.encoding.output} - 100%`);
        break;
      case "error":
        spinner.stop();
        process.close();
        console.log(`✘ Encode: ${process.encoding.output} - failed!`);
        throw event.error;
    }
  }
}

console.log("All encodings done!");
```

```
$ deno run --allow-read --allow-run --unstable https://deno.land/x/fast_forward/examples/event-stream.ts
```

### Output Stream

```typescript
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
```

```
$ deno run --allow-read --allow-write --allow-run https://deno.land/x/fast_forward/examples/output-stream.ts
```

## Todos

### Options

- [x] output
  - [x] support multiple outputs
- [x] input
  - [ ] support multiple inputs
- [x] cwd
- [x] binary
- [x] override
- [x] format
- [x] codec
- [x] audioCodec
- [x] videoCodec
- [x] audioBitrate
- [x] videoBitrate
- [x] minVideoBitrate
- [x] maxVideoBitrate
- [x] videoBufSize
- [x] width
- [x] height
- [ ] rotate
- [x] noAudio
- [x] noVideo
- [ ] noSubtitle
- [x] logLevel
- [x] args
- [ ] seek
- [x] duration
- [x] loop
- [ ] preset (name,path)
- [ ] watermark
- [x] sampleRate
- [x] audioQuality
- [x] audioChannels
- [ ] audioFilters
- [ ] videoFilters
- [ ] metadata
- [ ] volume
- [x] frames
- [ ] frameSize/size
- [x] fps/frameRate/rate
- [ ] aspectRatio/aspect
- [ ] loudnorm/normalize
- [ ] autopad
- [ ] keepDAR
- [ ] map (map streams in container)
- [ ] add input options
- [ ] thumbnails
- [ ] concat/merge (merge input files)
- [ ] split (split output file by size/time)

### Methods

- [ ] getAvailableFilters()
- [ ] getAvailableCodecs()
- [ ] getAvailableEncoders()
- [ ] getAvailableFormats()
- [ ] validate()/checkCapabilities()
- [ ] thumbnail()/thumbnails()
- [ ] flipVertical/flipHorizontal
- [ ] rotate()

### Events

- [x] start
- [x] info/meta/metadata
- [x] progress
- [x] end
- [x] error
- [ ] stderr (ffmpeg output)

## Contributing

Any kind of contribution is welcome! Please take a look at the
[contributing guidelines](../CONTRIBUTING.md).

## License

[MIT](./LICENSE)
