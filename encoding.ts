import type { EncodingErrorEvent } from "./events.ts";
import type {
  EncodingEndEvent,
  EncodingEndEventListener,
  EncodingErrorEventListener,
  EncodingEvent,
  EncodingEventListener,
  EncodingEventType,
  EncodingInfoEvent,
  EncodingInfoEventListener,
  EncodingProgressEvent,
  EncodingProgressEventListener,
  EncodingStartEvent,
  EncodingStartEventListener,
} from "./events.ts";

export interface EncodingOptions {
  input?: string;
  output?: string;
  cwd?: string;
  threads?: number;
  binary?: string;
  override?: boolean;
  format?: string;
  audioBitrate?: number | string;
  videoBitrate?: number | string;
  minVideoBitrate?: number | string;
  maxVideoBitrate?: number | string;
  videoBufSize?: number | string;
  codec?: string;
  audioCodec?: string;
  videoCodec?: string;
  width?: number | string;
  height?: number | string;
  frameRate?: number;
  sampleRate?: number;
  frames?: number;
  audioQuality?: number;
  audioChannels?: number;
  duration?: number | string;
  loop?: number | string;
  // rotate?: number;
  noAudio?: boolean;
  noVideo?: boolean;
  logLevel?: string;
  args?: string[];
}

export interface EncodingEventListenerItem {
  type: EncodingEventType;
  listener: EncodingEventListener;
}

export class Encoding implements EncodingOptions {
  #options: EncodingOptions & {
    binary: string;
    input: string;
    output: string;
  } = {
    binary: "ffmpeg",
    input: "pipe:0",
    output: "pipe:1",
  };
  #eventListeners: Array<EncodingEventListenerItem> = [];

  get output(): string {
    return this.#options.output;
  }

  set output(path: string) {
    this.#options.output = path;
  }

  get input(): string {
    return this.#options.input;
  }

  set input(source: string) {
    this.#options.input = source;
  }

  get cwd(): string | undefined {
    return this.#options.cwd;
  }

  set cwd(path: string | undefined) {
    this.#options.cwd = path;
  }

  get threads(): number | undefined {
    return this.#options.threads;
  }

  set threads(path: number | undefined) {
    this.#options.threads = path;
  }

  get binary(): string {
    return this.#options.binary;
  }

  set binary(ffmpeg: string) {
    this.#options.binary = ffmpeg;
  }

  get override(): boolean | undefined {
    return this.#options.override;
  }

  set override(enable: boolean | undefined) {
    this.#options.override = enable;
  }

  get format(): string | undefined {
    return this.#options.format;
  }

  set format(format: string | undefined) {
    this.#options.format = format;
  }

  get codec(): string | undefined {
    return this.#options.codec;
  }

  set codec(codec: string | undefined) {
    this.#options.codec = codec;
  }

  get audioCodec(): string | undefined {
    return this.#options.audioCodec;
  }

  set audioCodec(audioCodec: string | undefined) {
    this.#options.audioCodec = audioCodec;
  }

  get videoCodec(): string | undefined {
    return this.#options.videoCodec;
  }

  set videoCodec(videoCodec: string | undefined) {
    this.#options.videoCodec = videoCodec;
  }

  get audioBitrate(): number | string | undefined {
    return this.#options.audioBitrate;
  }

  set audioBitrate(audioBitrate: number | string | undefined) {
    this.#options.audioBitrate = audioBitrate;
  }

  get videoBitrate(): number | string | undefined {
    return this.#options.videoBitrate;
  }

  set videoBitrate(videoBitrate: number | string | undefined) {
    this.#options.videoBitrate = videoBitrate;
  }

  get minVideoBitrate(): number | string | undefined {
    return this.#options.minVideoBitrate;
  }

  set minVideoBitrate(bitrate: number | string | undefined) {
    this.#options.minVideoBitrate = bitrate;
  }

  get maxVideoBitrate(): number | string | undefined {
    return this.#options.maxVideoBitrate;
  }

  set maxVideoBitrate(bitrate: number | string | undefined) {
    this.#options.maxVideoBitrate = bitrate;
  }

  get videoBufSize(): number | string | undefined {
    return this.#options.videoBufSize;
  }

  set videoBufSize(size: number | string | undefined) {
    this.#options.videoBufSize = size;
  }

  get width(): number | string | undefined {
    return this.#options.width;
  }

  set width(width: number | string | undefined) {
    this.#options.width = width;
  }

  get height(): number | string | undefined {
    return this.#options.height;
  }

  set height(height: number | string | undefined) {
    this.#options.height = height;
  }

  get frameRate(): number | undefined {
    return this.#options.frameRate;
  }

  set frameRate(frameRate: number | undefined) {
    this.#options.frameRate = frameRate;
  }

  get sampleRate(): number | undefined {
    return this.#options.sampleRate;
  }

  set sampleRate(sampleRate: number | undefined) {
    this.#options.sampleRate = sampleRate;
  }

  get frames(): number | undefined {
    return this.#options.frames;
  }

  set frames(frames: number | undefined) {
    this.#options.frames = frames;
  }

  get audioQuality(): number | undefined {
    return this.#options.audioQuality;
  }

  set audioQuality(audioQuality: number | undefined) {
    this.#options.audioQuality = audioQuality;
  }

  get audioChannels(): number | undefined {
    return this.#options.audioChannels;
  }

  set audioChannels(count: number | undefined) {
    this.#options.audioChannels = count;
  }

  get duration(): number | string | undefined {
    return this.#options.duration;
  }

  set duration(duration: number | string | undefined) {
    this.#options.duration = duration;
  }

  get loop(): number | string | undefined {
    return this.#options.loop;
  }

  set loop(loop: number | string | undefined) {
    this.#options.loop = loop;
  }

  // get rotate(): number | undefined {
  //   return this.#options.rotate;
  // }
  //
  // set rotate(deg: number | undefined) {
  //   this.#options.rotate = deg;
  // }

  get noAudio(): boolean {
    return !!this.#options.noAudio;
  }

  set noAudio(disable: boolean) {
    this.#options.noAudio = disable;
  }

  get noVideo(): boolean {
    return !!this.#options.noVideo;
  }

  set noVideo(disable: boolean) {
    this.#options.noVideo = disable;
  }

  get logLevel(): string | undefined {
    return this.#options.logLevel;
  }

  set logLevel(logLevel: string | undefined) {
    this.#options.logLevel = logLevel;
  }

  get args(): string[] | undefined {
    return this.#options.args;
  }

  set args(ffmpegArgs: string[] | undefined) {
    this.#options.args = ffmpegArgs;
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
    this.#eventListeners.push({ type: event, listener });
    return this;
  }

  removeEventListener(
    event: "info",
    listener: EncodingInfoEventListener,
  ): this;
  removeEventListener(
    event: "start",
    listener: EncodingStartEventListener,
  ): this;
  removeEventListener(
    event: "progress",
    listener: EncodingProgressEventListener,
  ): this;
  removeEventListener(
    event: "end",
    listener: EncodingEndEventListener,
  ): this;
  removeEventListener(
    event: "error",
    listener: EncodingErrorEventListener,
  ): this;
  removeEventListener(
    event: EncodingEventType,
    listener: EncodingEventListener,
  ): this {
    const index: number = this.#eventListeners.findIndex((item) =>
      item.type === event && item.listener === listener
    );
    if (index !== -1) {
      this.#eventListeners.splice(index, 1);
    }
    return this;
  }

  removeAllListeners(): this {
    this.#eventListeners = [];
    return this;
  }

  emit(name: "info", /* or meta */ error: EncodingInfoEvent): void;
  emit(name: "start", error: EncodingStartEvent): void;
  emit(name: "progress", event: EncodingProgressEvent): void;
  emit(name: "end", error: EncodingEndEvent): void;
  emit(name: "error", error: EncodingErrorEvent): void;
  emit(name: EncodingEventType, event: EncodingEvent): void {
    for (const { type, listener } of this.#eventListeners) {
      if (type === name) {
        // deno-lint-ignore no-explicit-any
        listener(event as any);
      }
    }
  }

  merge(encoding: Encoding): this {
    Object.assign(this.#options, encoding.#options);
    this.#eventListeners.push(...encoding.#eventListeners);
    return this;
  }

  rebase(encoding: Encoding): this {
    this.#options = Object.assign({}, encoding.#options, this.#options);
    this.#eventListeners = [
      ...encoding.#eventListeners,
      ...this.#eventListeners,
    ];
    return this;
  }

  clone(): Encoding {
    return new Encoding().merge(this);
  }
}

function keys<K extends keyof unknown, V>(object: Record<K, V>): K[] {
  return Object.keys(object) as K[];
}
