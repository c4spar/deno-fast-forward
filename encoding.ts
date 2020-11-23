import {
  EncodingEndEvent,
  EncodingEndEventListener,
  EncodingErrorEvent,
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

export interface EncodingEventListenerItem {
  type: EncodingEventType;
  listener: EncodingEventListener;
}

export interface FFmpegInputOutputOptions {
  args?: string[];
  audioChannels?: number;
  audioCodec?: string;
  codec?: string;
  duration?: number | string;
  format?: string;
  frameRate?: number;
  noAudio?: boolean;
  noVideo?: boolean;
  sampleRate?: number;
  videoCodec?: string;
}

export type FFmpegInputOptions = FFmpegInputOutputOptions;

export interface FFmpegOutputOptions extends FFmpegInputOutputOptions {
  audioBitrate?: number | string;
  audioQuality?: number;
  frames?: number;
  height?: number | string;
  loop?: number | string;
  maxVideoBitrate?: number | string;
  minVideoBitrate?: number | string;
  override?: boolean;
  // rotate?: number;
  videoBitrate?: number | string;
  videoBufSize?: number | string;
  width?: number | string;
}

export interface EncodingOptions {
  binary?: string;
  cwd?: string;
  input?: string;
  logLevel?: string;
  output?: string;
  threads?: number;
}

/** input & output parameters */
export abstract class FFmpegBaseParameters<T extends FFmpegInputOutputOptions>
  implements FFmpegInputOutputOptions {
  #options: T;

  protected constructor(options: T) {
    this.#options = options;
    this.options = options;
  }

  protected get options(): T {
    return this.#options;
  }

  protected set options(options: T) {
    this.#options = options;
  }

  get format(): string | undefined {
    return this.options.format;
  }

  set format(format: string | undefined) {
    this.options.format = format;
  }

  get codec(): string | undefined {
    return this.options.codec;
  }

  set codec(codec: string | undefined) {
    this.options.codec = codec;
  }

  get audioCodec(): string | undefined {
    return this.options.audioCodec;
  }

  set audioCodec(audioCodec: string | undefined) {
    this.options.audioCodec = audioCodec;
  }

  get videoCodec(): string | undefined {
    return this.options.videoCodec;
  }

  set videoCodec(videoCodec: string | undefined) {
    this.options.videoCodec = videoCodec;
  }

  get frameRate(): number | undefined {
    return this.options.frameRate;
  }

  set frameRate(frameRate: number | undefined) {
    this.options.frameRate = frameRate;
  }

  get sampleRate(): number | undefined {
    return this.options.sampleRate;
  }

  set sampleRate(sampleRate: number | undefined) {
    this.options.sampleRate = sampleRate;
  }

  get audioChannels(): number | undefined {
    return this.options.audioChannels;
  }

  set audioChannels(count: number | undefined) {
    this.options.audioChannels = count;
  }

  get duration(): number | string | undefined {
    return this.options.duration;
  }

  set duration(duration: number | string | undefined) {
    this.options.duration = duration;
  }

  get noVideo(): boolean {
    return !!this.options.noVideo;
  }

  set noVideo(disable: boolean) {
    this.options.noVideo = disable;
  }

  get noAudio(): boolean {
    return !!this.options.noAudio;
  }

  set noAudio(disable: boolean) {
    this.options.noAudio = disable;
  }

  get args(): string[] | undefined {
    return this.options.args;
  }

  set args(ffmpegArgs: string[] | undefined) {
    this.options.args = ffmpegArgs;
  }

  merge(parameters: this): this {
    Object.assign(this.options, parameters.#options);
    return this;
  }

  // merge<V extends T = T>(parameters: FFmpegBaseParameters<V>): FFmpegBaseParameters<T & V> {
  rebase(parameters: this): this {
    Object.assign({}, this.options, parameters.#options, this.options);
    return this;
  }

  abstract clone(): FFmpegBaseParameters<T>;
}

/** input parameters */
export class FFmpegInputParameters
  extends FFmpegBaseParameters<FFmpegInputOptions>
  implements FFmpegInputOptions {
  constructor(options: FFmpegInputOptions = {}) {
    super(options);
  }

  clone(): FFmpegInputParameters {
    return new FFmpegInputParameters().merge(this);
  }
}

/** output parameters */
export class FFmpegOutputParameters
  extends FFmpegBaseParameters<FFmpegOutputOptions>
  implements FFmpegOutputOptions {
  constructor(options: FFmpegOutputOptions = {}) {
    super(options);
  }

  get override(): boolean | undefined {
    return this.options.override;
  }

  set override(enable: boolean | undefined) {
    this.options.override = enable;
  }

  get audioBitrate(): number | string | undefined {
    return this.options.audioBitrate;
  }

  set audioBitrate(audioBitrate: number | string | undefined) {
    this.options.audioBitrate = audioBitrate;
  }

  get videoBitrate(): number | string | undefined {
    return this.options.videoBitrate;
  }

  set videoBitrate(videoBitrate: number | string | undefined) {
    this.options.videoBitrate = videoBitrate;
  }

  get minVideoBitrate(): number | string | undefined {
    return this.options.minVideoBitrate;
  }

  set minVideoBitrate(bitrate: number | string | undefined) {
    this.options.minVideoBitrate = bitrate;
  }

  get maxVideoBitrate(): number | string | undefined {
    return this.options.maxVideoBitrate;
  }

  set maxVideoBitrate(bitrate: number | string | undefined) {
    this.options.maxVideoBitrate = bitrate;
  }

  get videoBufSize(): number | string | undefined {
    return this.options.videoBufSize;
  }

  set videoBufSize(size: number | string | undefined) {
    this.options.videoBufSize = size;
  }

  get width(): number | string | undefined {
    return this.options.width;
  }

  set width(width: number | string | undefined) {
    this.options.width = width;
  }

  get height(): number | string | undefined {
    return this.options.height;
  }

  set height(height: number | string | undefined) {
    this.options.height = height;
  }

  get frames(): number | undefined {
    return this.options.frames;
  }

  set frames(frames: number | undefined) {
    this.options.frames = frames;
  }

  get audioQuality(): number | undefined {
    return this.options.audioQuality;
  }

  set audioQuality(audioQuality: number | undefined) {
    this.options.audioQuality = audioQuality;
  }

  get loop(): number | string | undefined {
    return this.options.loop;
  }

  set loop(loop: number | string | undefined) {
    this.options.loop = loop;
  }

  // get rotate(): number | undefined {
  //   return this.options.rotate;
  // }
  //
  // set rotate(deg: number | undefined) {
  //   this.options.rotate = deg;
  // }

  clone(): FFmpegOutputParameters {
    return new FFmpegOutputParameters().merge(this);
  }
}

export class Encoding extends FFmpegOutputParameters {
  protected outputParams = {};
  #options: EncodingOptions & {
    binary: string;
    input: string;
    output: string;
  } = {
    binary: "ffmpeg",
    input: "pipe:0",
    output: "pipe:1",
  };
  #input: FFmpegInputParameters = new FFmpegInputParameters();
  #output: FFmpegOutputParameters = new FFmpegOutputParameters(
    this.outputParams,
  );
  #eventListeners: Array<EncodingEventListenerItem> = [];

  constructor(options: EncodingOptions = {}) {
    super();
    Object.assign(this.#options, options);
  }

  protected get options(): FFmpegOutputOptions {
    return this.outputParams;
  }

  protected set options(options: FFmpegOutputOptions) {
    this.outputParams = options;
  }

  get encodingOptions(): EncodingOptions {
    return this.#options;
  }

  get inputOptions(): FFmpegInputParameters {
    return this.#input;
  }

  get outputOptions(): FFmpegOutputParameters {
    return this.#output;
  }

  get input(): string {
    return this.#options.input;
  }

  set input(source: string) {
    this.#options.input = source;
  }

  get output(): string {
    return this.#options.output;
  }

  set output(path: string) {
    this.#options.output = path;
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

  get logLevel(): string | undefined {
    return this.#options.logLevel;
  }

  set logLevel(logLevel: string | undefined) {
    this.#options.logLevel = logLevel;
  }

  merge(encoding: Encoding): this {
    Object.assign(this.#options, encoding.#options);
    this.#input.merge(encoding.#input);
    this.#output.merge(encoding.#output);
    this.#eventListeners.push(...encoding.#eventListeners);
    return this;
  }

  rebase(encoding: Encoding): this {
    this.#options = Object.assign(
      {},
      encoding.#options,
      this.#options,
    );
    this.#input.rebase(encoding.#input);
    this.#output.rebase(encoding.#output);
    this.#eventListeners = [
      ...encoding.#eventListeners,
      ...this.#eventListeners,
    ];
    return this;
  }

  clone(): Encoding {
    return new Encoding().merge(this);
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
}

function keys<K extends keyof unknown, V>(object: Record<K, V>): K[] {
  return Object.keys(object) as K[];
}
