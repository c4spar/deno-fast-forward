import type { Encoding } from "./encoding.ts";
import { EncodingEventStream } from "./encoding_event_stream.ts";
import {
  EncodingProcessAlreadyStarted,
  EncodingProcessNotStarted,
  FFmpegBinaryNotFound,
  FFmpegBinaryPermissionDenied,
  FFmpegCommandFailed,
} from "./errors.ts";
import {
  EncodingEndEvent,
  EncodingErrorEvent,
  EncodingInfoEvent,
  EncodingProgressEvent,
  EncodingStartEvent,
  ProgressInfo,
} from "./events.ts";
import { FFmpegCommand } from "./ffmpeg_command.ts";
import { ffprobe } from "./ffprobe.ts";
import type { MediaInfo, MediaStream, VideoStream } from "./media_info.ts";
import { Deferred, deferred } from "./deps.ts";

export type EncodingStatus = Deno.ProcessStatus;

export class EncodingProcess {
  #encoding: Encoding;
  #process?: Deno.Process;
  #infoPromise?: Promise<MediaInfo | void>;
  #statusPromise?: Promise<EncodingStatus>;
  #outputPromise?: Promise<Uint8Array>;
  #stderrOutputPromise?: Promise<Uint8Array>;
  #progressPromise?: Deferred<void>;
  #eventIterator: EncodingEventStream;
  #cmd?: Array<string>;

  constructor(encoding: Encoding) {
    this.#encoding = encoding;
    this.#eventIterator = new EncodingEventStream(this);
  }

  [Symbol.asyncIterator](): EncodingEventStream {
    return this.#eventIterator;
  }

  get encoding(): Encoding {
    return this.#encoding;
  }

  get pid(): number | undefined {
    return this.#process?.pid;
  }

  get rid(): number | undefined {
    return this.#process?.rid;
  }

  get stdin(): (Deno.Writer & Deno.Closer) | undefined {
    return this.#process?.stdin ?? undefined;
  }

  get stdout(): Deno.Reader & Deno.Closer | undefined {
    return this.#process?.stdout ?? undefined;
  }

  get stderr(): (Deno.Reader & Deno.Closer) | undefined {
    return this.#process?.stderr ?? undefined;
  }

  private get process(): Deno.Process {
    if (!this.#process) {
      throw new EncodingProcessNotStarted({
        encoding: this.#encoding,
      });
    }
    return this.#process;
  }

  run(): this {
    if (this.#process) {
      throw new EncodingProcessAlreadyStarted({
        encoding: this.#encoding,
        cmd: this.#cmd,
      });
    }
    this.#cmd = new FFmpegCommand(
      this.#encoding,
      this.#isOutputStream(),
    ).toArray();
    const opts: Deno.RunOptions = {
      cmd: this.#cmd,
      cwd: this.#encoding.cwd,
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    };
    // console.log("$ %s", blue(opts.cmd.join(" ")));
    try {
      this.#process = Deno.run(opts);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new FFmpegBinaryNotFound({
          encoding: this.#encoding,
          cmd: this.#cmd,
          previous: error,
        });
      } else if (error instanceof Deno.errors.PermissionDenied) {
        throw new FFmpegBinaryPermissionDenied({
          encoding: this.#encoding,
          cmd: this.#cmd,
          previous: error,
        });
      }
      throw error;
    }
    void this.#handleEvents();
    return this;
  }

  status(): Promise<EncodingStatus> {
    if (!this.#statusPromise) {
      this.#statusPromise = new Promise((resolve, reject) => {
        (async () => {
          try {
            await this.#progressPromise;
            await Promise.all([
              this.output(),
              this.stderrOutput(),
            ]);
            const status = await this.process.status();
            resolve(status);
          } catch (error) {
            reject(error);
          }
        })();
      });
    }
    return this.#statusPromise;
  }

  output(): Promise<Uint8Array> {
    if (!this.#outputPromise) {
      this.#outputPromise = new Promise((resolve, reject) => {
        (async () => {
          try {
            const output = await this.process.output();
            resolve(output);
          } catch (e) {
            reject(e);
          }
        })();
      });
    }
    return this.#outputPromise;
  }

  stderrOutput(): Promise<Uint8Array> {
    if (!this.#stderrOutputPromise) {
      this.#stderrOutputPromise = new Promise((resolve, reject) => {
        (async () => {
          try {
            const stderrOutput = await this.process.stderrOutput();
            resolve(stderrOutput);
          } catch (error) {
            reject(error);
          }
        })();
      });
    }
    return this.#stderrOutputPromise;
  }

  kill = async (signo: number): Promise<void> => {
    await this.process.kill(signo);
  };

  close() {
    this.stdin?.close();
    this.process.close();
  }

  #handleEvents = async (): Promise<void> => {
    try {
      await Promise.all([
        this.#handleStartEvent(),
        this.#handleInfoEvent(),
        this.#handleProgressEvent(),
        this.#handleEndEvent(),
      ]);
    } catch (error) {
      await this.#handleErrorEvent({ error });
    }
  };

  #handleStartEvent = (): void => {
    this.#encoding.emit("start", new EncodingStartEvent(this.#encoding));
  };

  #handleInfoEvent = async (): Promise<void> => {
    const info = await this.#info();
    if (info) {
      const infoEvent = new EncodingInfoEvent(this.#encoding, info);
      this.#encoding.emit("info", infoEvent);
    }
  };

  #handleProgressEvent = async (): Promise<void> => {
    this.#progressPromise = deferred();
    // progress events not available for output streams.
    if (this.#isOutputStream() || !this.process.stdout) {
      this.#progressPromise.resolve();
      return;
    }
    const info = await this.#info();
    if (!info) {
      this.#progressPromise.resolve();
      return;
    }
    const videoStream: VideoStream = info.streams
      .find((stream: MediaStream) =>
        stream.codec_type === "video"
      ) as VideoStream;
    const totalFrames = Number(videoStream.nb_frames);

    for await (const chunk of Deno.iter(this.process.stdout)) {
      const progressInfo: ProgressInfo = parseProgressOutput(chunk);
      const frames = Number(progressInfo.frame);
      const progress: number = Math.trunc(100 / (totalFrames / frames));
      const progressEvent = new EncodingProgressEvent(
        this.#encoding,
        progress,
        progressInfo,
      );
      this.#encoding.emit("progress", progressEvent);
      if (progressInfo.progress === "end") {
        this.#progressPromise.resolve();
      }
    }
    this.#progressPromise.resolve();
  };

  #handleEndEvent = async (): Promise<void> => {
    const status = await this.status();
    if (status.success) {
      this.#encoding.emit("end", new EncodingEndEvent(this.#encoding));
    } else {
      await this.#handleErrorEvent({ status });
    }
  };

  #handleErrorEvent = (
    { error, status }: { error?: Error; status?: EncodingStatus },
  ): Promise<void> => {
    return this.stderrOutput()
      .catch((error) => new TextEncoder().encode(error.toString()))
      .then((stderrOutput: Uint8Array) => {
        const ffmpegError = new FFmpegCommandFailed({
          encoding: this.#encoding,
          status,
          stderrOutput,
          cmd: this.#cmd,
          previous: error,
        });
        const errorEvent = new EncodingErrorEvent(this.#encoding, ffmpegError);
        this.#encoding.emit("error", errorEvent);
      });
  };

  #info = (): Promise<MediaInfo | void> => {
    if (!this.#infoPromise) {
      this.#infoPromise = new Promise((resolve, reject) => {
        (async () => {
          try {
            if (this.#encoding.input) {
              const info = await ffprobe(this.#encoding.input, {
                cwd: this.#encoding.cwd,
              });
              resolve(info);
            } else {
              resolve();
            }
          } catch (error) {
            reject(error);
          }
        })();
      });
    }
    return this.#infoPromise;
  };

  #isOutputStream = (): boolean => {
    return !this.#encoding.output ||
      this.#encoding.output === "-" ||
      this.#encoding.output.startsWith("pipe:");
  };
}

function parseProgressOutput(chunk: Uint8Array): ProgressInfo {
  return new TextDecoder()
    .decode(chunk)
    .trim()
    .split("\n")
    .map((line: string) => line.split("="))
    .reduce((previous: Record<string, string>, current: string[]) => {
      previous[current[0]] = current[1];
      return previous;
      // deno-lint-ignore no-explicit-any
    }, {}) as any;
}
