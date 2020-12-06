import { FFmpegInputParameters } from "./encoding_input_parameters.ts";
import {
  AbstractFFmpegOutputParameters,
  FFmpegOutputOptions,
  FFmpegOutputParameters,
} from "./encoding_output_parameters.ts";
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

interface EncodingEventListenerItem {
  type: EncodingEventType;
  listener: EncodingEventListener;
}

export interface EncodingOptions {
  binary?: string;
  cwd?: string;
  input?: string;
  logLevel?: string;
  output?: string;
  threads?: number;
}

export class Encoding extends AbstractFFmpegOutputParameters {
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
  #output: FFmpegOutputParameters = new FFmpegOutputParameters();
  #eventListeners: Array<EncodingEventListenerItem> = [];

  constructor(options: EncodingOptions = {}) {
    super();
    Object.assign(this.#options, options);
  }

  protected get opts(): FFmpegOutputOptions {
    return this.#output.options;
  }

  protected set opts(options: FFmpegOutputOptions) {
    this.#output.options = options;
  }

  get options(): EncodingOptions {
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
