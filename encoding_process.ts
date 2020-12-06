import { blue } from "./deps.ts";
import type { Encoding } from "./encoding.ts";
import { EncodingEventStream } from "./encoding_event_stream.ts";
import {
  EncodingProcessAlreadyStarted,
  EncodingProcessNotStarted,
  FFmpegBinaryNotFound,
  FFmpegBinaryPermissionDenied,
  FFmpegCommandFailed,
  FFmpegCommandStatusFailed,
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

export type EncodingStatus = Deno.ProcessStatus;

export class EncodingProcess {
  #encoding: Encoding;
  #process?: Deno.Process;
  #info?: MediaInfo;
  #statusPromise?: Promise<EncodingStatus>;
  #outputPromise?: Promise<Uint8Array>;
  #stderrOutputPromise?: Promise<Uint8Array>;
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

  run = (): this => {
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
    void this.#initEvents();
    return this;
  };

  status = async (): Promise<EncodingStatus> => {
    if (!this.#statusPromise) {
      this.#statusPromise = new Promise((resolve, reject) => {
        try {
          this.process.status()
            .then(resolve)
            .catch(reject);
        } catch (e) {
          reject(e);
        }
      });
    }
    return this.#statusPromise;
  };

  output = async (): Promise<Uint8Array> => {
    if (!this.#outputPromise) {
      this.#outputPromise = new Promise((resolve, reject) => {
        try {
          this.process.output()
            .then(resolve)
            .catch(reject);
        } catch (e) {
          reject(e);
        }
      });
    }
    return this.#outputPromise;
  };

  stderrOutput = async (): Promise<Uint8Array> => {
    if (!this.#stderrOutputPromise) {
      this.#stderrOutputPromise = new Promise((resolve, reject) => {
        try {
          this.process.stderrOutput()
            .then(resolve)
            .catch(reject);
        } catch (e) {
          reject(e);
        }
      });
    }
    return this.#stderrOutputPromise;
  };

  kill = async (signo: number): Promise<void> => {
    await this.process.kill(signo);
  };

  close() {
    try {
      this.process.stdin?.close();
      // deno-lint-ignore no-empty
    } catch {}
    try {
      this.process.stdout?.close();
      // deno-lint-ignore no-empty
    } catch {}
    try {
      this.process.stderr?.close();
      // deno-lint-ignore no-empty
    } catch {}
    try {
      this.process.close();
      // deno-lint-ignore no-empty
    } catch {}
  }

  #initEvents = async (): Promise<void> => {
    this.#encoding.emit("start", new EncodingStartEvent(this.#encoding));

    if (!this.#encoding.input) {
      // info and progress events not available for input streams.
      return;
    }

    this.#info = await ffprobe(this.#encoding.input, {
      cwd: this.#encoding.cwd,
    });
    this.#encoding.emit(
      "info",
      new EncodingInfoEvent(this.#encoding, this.#info),
    );

    this.status()
      .then(async (status) => {
        if (!status.success) {
          const error = new FFmpegCommandFailed({
            encoding: this.#encoding,
            status,
            stderrOutput: this.#process && await this.stderrOutput(),
            cmd: this.#cmd,
          });
          const errorEvent = new EncodingErrorEvent(this.#encoding, error);
          this.#encoding.emit("error", errorEvent);
        }
      })
      .catch(async (err) => {
        const error = new FFmpegCommandStatusFailed({
          encoding: this.#encoding,
          stderrOutput: this.#process && await this.stderrOutput(),
          cmd: this.#cmd,
          previous: err,
        });
        const errorEvent = new EncodingErrorEvent(this.#encoding, error);
        this.#encoding.emit("error", errorEvent);
      });

    // progress events not available for output streams.
    if (this.#isOutputStream()) {
      return;
    }

    if (this.process.stdout) {
      const videoStream: VideoStream = this.#info.streams
        .find((stream: MediaStream) =>
          stream.codec_type === "video"
        ) as VideoStream;

      const totalFrames: number = parseInt(videoStream.nb_frames);

      for await (const chunk of Deno.iter(this.process.stdout)) {
        const progressInfo: ProgressInfo = parseProgressOutput(chunk);
        const frames: number = parseInt(progressInfo.frame);
        const progress: number = Math.trunc(100 / (totalFrames / frames));
        const event = new EncodingProgressEvent(
          this.#encoding,
          progress,
          progressInfo,
        );
        this.#encoding.emit("progress", event);
      }
    }

    const status = await this.status();
    if (status.success) {
      this.#encoding.emit("end", new EncodingEndEvent(this.#encoding));
    }
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
