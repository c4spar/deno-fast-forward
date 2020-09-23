import {
  Encoding,
  EncodingOptions,
} from "./encoding.ts";
import {
  EncodingProcess,
} from "./encoding_process.ts";
import type {
  EncodingEndEventListener,
  EncodingErrorEventListener,
  EncodingEventListener,
  EncodingEventType,
  EncodingInfoEventListener,
  EncodingProgressEventListener,
  EncodingStartEventListener,
} from "./events.ts";

export function ffmpeg(
  input?: string,
  options?: EncodingOptions | string,
): FFmpeg {
  return new FFmpeg(input, options);
}

export class FFmpeg implements AsyncIterableIterator<EncodingProcess> {
  // implements AsyncIterableIterator<EncodingProcess>, PromiseLike<never> {
  #global: Encoding = new Encoding();
  #encodings: Encoding[] = [];
  #encodingIndex = -1;
  #iteratorCount = 0;

  // #thenPromise: Promise<void> | undefined;

  constructor(input?: string, options: EncodingOptions | string = {}) {
    if (input) {
      this.#global.input = input;
    }
    if (typeof options === "string") {
      this.#global.output = options;
    }
    Object.assign(this.#global, options);
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<EncodingProcess> {
    return this;
  }

  // then(
  //   resolve?: (() => never | PromiseLike<never>),
  //   reject?: ((error: unknown) => never | PromiseLike<never>),
  // ): PromiseLike<never> {
  //   if (!this.#thenPromise) {
  //     this.#thenPromise = this.encode();
  //   }
  //   if (resolve) {
  //     this.#thenPromise.then(resolve);
  //   }
  //   if (reject) {
  //     this.#thenPromise.catch(reject);
  //   }
  //   return this;
  // }

  get encoding(): Encoding | undefined {
    if (this.#encodingIndex === -1) {
      return;
    }
    return this.#encodings[this.#encodingIndex];
  }

  get encodings(): Array<Encoding> {
    return this.#encodings;
  }

  output(path: string): this {
    this.#addEncoding();
    this.#set("output", path);
    return this;
  }

  input(source: string): this {
    this.#set("input", source);
    return this;
  }

  cwd(path: string): this {
    this.#set("cwd", path);
    return this;
  }

  threads(count: number): this {
    this.#set("threads", count);
    return this;
  }

  binary(ffmpeg: string): this {
    this.#set("binary", ffmpeg);
    return this;
  }

  override(enable: boolean): this {
    this.#set("override", enable);
    return this;
  }

  format(format: string): this {
    this.#set("format", format);
    return this;
  }

  codec(codec: string): this {
    this.#set("codec", codec);
    return this;
  }

  audioCodec(codec: string): this {
    this.#set("audioCodec", codec);
    return this;
  }

  videoCodec(codec: string): this {
    this.#set("videoCodec", codec);
    return this;
  }

  audioBitrate(bitrate: number | string): this {
    this.#set("audioBitrate", bitrate);
    return this;
  }

  videoBitrate(bitrate: number | string): this {
    this.#set("videoBitrate", bitrate);
    return this;
  }

  minVideoBitrate(bitrate: number | string): this {
    this.#set("minVideoBitrate", bitrate);
    return this;
  }

  maxVideoBitrate(codec: number | string): this {
    this.#set("maxVideoBitrate", codec);
    return this;
  }

  videoBufSize(size: number | string): this {
    this.#set("videoBufSize", size);
    return this;
  }

  width(width: number | string): this {
    this.#set("width", width);
    return this;
  }

  height(height: number | string): this {
    this.#set("height", height);
    return this;
  }

  frameRate(frameRate: number): this {
    this.#set("frameRate", frameRate);
    return this;
  }

  sampleRate(hz: number): this {
    this.#set("sampleRate", hz);
    return this;
  }

  frames(frames: number): this {
    this.#set("frames", frames);
    return this;
  }

  audioQuality(quality: number): this {
    this.#set("audioQuality", quality);
    return this;
  }

  audioChannels(count: number): this {
    this.#set("audioChannels", count);
    return this;
  }

  /**
   * https://ffmpeg.org/ffmpeg-utils.html#time-duration-syntax
   */
  duration(duration: string | number): this {
    this.#set("duration", duration);
    return this;
  }

  loop(duration: string | number): this {
    this.#set("loop", duration);
    return this;
  }

  // rotate(deg: number): this {
  //   this.#set("rotate", deg);
  //   return this;
  // }

  noAudio(disable = true): this {
    this.#set("noAudio", disable);
    return this;
  }

  noVideo(disable = true): this {
    this.#set("noVideo", disable);
    return this;
  }

  logLevel(logLevel: string): this {
    this.#set("logLevel", logLevel);
    return this;
  }

  args(ffmpegArgs: string[]): this {
    this.#set("args", ffmpegArgs);
    return this;
  }

  addEventListener(
    event: "info",
    listener: EncodingInfoEventListener,
  ): this;
  addEventListener(
    event: "start",
    listener: EncodingStartEventListener,
  ): this;
  addEventListener(
    event: "progress",
    listener: EncodingProgressEventListener,
  ): this;
  addEventListener(
    event: "end",
    listener: EncodingEndEventListener,
  ): this;
  addEventListener(
    event: "error",
    listener: EncodingErrorEventListener,
  ): this;
  addEventListener(
    event: EncodingEventType,
    listener: EncodingEventListener,
  ): this {
    const encoding = this.encoding ?? this.#global;
    // deno-lint-ignore no-explicit-any
    encoding.addEventListener(event as any, listener as any);
    return this;
  }

  async encode(): Promise<void> {
    for await (const process of this) {
      process.run();
      for await (const event of process) {
        if (event.type === "error") {
          process.close();
          throw event.error;
        }
      }
      process.close();
    }
  }

  async next(): Promise<IteratorResult<EncodingProcess, null>> {
    if (this.#iteratorCount < this.#encodings.length) {
      return {
        value: new EncodingProcess(this.#encodings[this.#iteratorCount++]),
        done: false,
      };
    }
    return {
      done: true,
      value: null,
    };
  }

  #addEncoding = (): void => {
    this.#encodings.push(this.#global.clone());
    this.#encodingIndex = this.#encodings.length - 1;
  };

  #set = <K extends keyof EncodingOptions>(
    name: K,
    value: EncodingOptions[K],
  ): this => {
    const encoding: EncodingOptions = this.encoding ?? this.#global;
    encoding[name] = value;
    return this;
  };
}
