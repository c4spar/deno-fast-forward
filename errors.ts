import { bold, red } from "./deps.ts";
import type { Encoding } from "./encoding.ts";
import type { EncodingStatus } from "./encoding_process.ts";

interface FFmpegErrorOptions {
  encoding: Encoding;
  message?: string;
  status?: EncodingStatus;
  stderrOutput?: ArrayBuffer;
  cmd?: string[];
  previous?: Error;
}

interface FFprobeErrorOptions {
  inputFile: string;
  status?: EncodingStatus;
  stderrOutput?: ArrayBuffer;
  cmd?: string[];
  binary: string;
  cwd?: string;
  previous?: Error;
}

abstract class FFprobeError extends Error {
  protected constructor(message: string, options: FFprobeErrorOptions) {
    super(getFFprobeErrorMessage(message, options));
    this.name = "FFprobeError";
    Object.setPrototypeOf(this, FFprobeError.prototype);
  }
}

export class FFprobeBinaryNotFound extends FFprobeError {
  constructor(options: FFprobeErrorOptions) {
    super("FFprobe binary not found.", options);
    this.name = "FFprobeBinaryNotFound";
    Object.setPrototypeOf(this, FFprobeBinaryNotFound.prototype);
  }
}

export class FFprobeBinaryPermissionDenied extends FFprobeError {
  constructor(options: FFprobeErrorOptions) {
    super("FFprobe binary not executable.", options);
    this.name = "FFprobeBinaryPermissionDenied";
    Object.setPrototypeOf(this, FFprobeBinaryPermissionDenied.prototype);
  }
}

export class FFprobeCommandFailed extends FFprobeError {
  constructor(options: FFprobeErrorOptions) {
    super("FFprobe command failed.", options);
    this.name = "FFprobeCommandFailed";
    Object.setPrototypeOf(this, FFprobeCommandFailed.prototype);
  }
}

abstract class FFmpegError extends Error {
  protected constructor(message: string, options: FFmpegErrorOptions) {
    super(getFFmpegErrorMessage(message, options));
    this.name = "FFmpegError";
    Object.setPrototypeOf(this, FFmpegError.prototype);
  }
}

export class FFmpegBinaryNotFound extends FFmpegError {
  constructor(options: FFmpegErrorOptions) {
    super("FFmpeg binary not found.", options);
    this.name = "FFmpegBinaryNotFound";
    Object.setPrototypeOf(this, FFmpegBinaryNotFound.prototype);
  }
}

export class FFmpegBinaryPermissionDenied extends FFmpegError {
  constructor(options: FFmpegErrorOptions) {
    super("FFmpeg binary not executable.", options);
    this.name = "FFmpegBinaryPermissionDenied";
    Object.setPrototypeOf(this, FFmpegBinaryPermissionDenied.prototype);
  }
}

export class FFmpegCommandFailed extends FFmpegError {
  constructor(options: FFmpegErrorOptions) {
    super("FFmpeg command failed.", options);
    this.name = "FFmpegCommandFailed";
    Object.setPrototypeOf(this, FFmpegCommandFailed.prototype);
  }
}

export class EncodingProcessNotStarted extends FFmpegError {
  constructor(options: FFmpegErrorOptions) {
    super(
      "Encoding process not started. Use 'EncodingProcess.run()' to start the encoding process.",
      options,
    );
    this.name = "EncodingProcessNotStarted";
    Object.setPrototypeOf(this, EncodingProcessNotStarted.prototype);
  }
}

export class EncodingProcessAlreadyStarted extends FFmpegError {
  constructor(options: FFmpegErrorOptions) {
    super("EncodingProcess.run() called multiple times.", options);
    this.name = "EncodingProcessAlreadyStarted";
    Object.setPrototypeOf(this, EncodingProcessAlreadyStarted.prototype);
  }
}

export class EncodingEventStreamAlreadyDisposed extends FFmpegError {
  constructor(options: FFmpegErrorOptions) {
    super("EncodingProcess.dispose() called multiple times.", options);
    this.name = "EncodingProcessAlreadyDisposed";
    Object.setPrototypeOf(this, EncodingEventStreamAlreadyDisposed.prototype);
  }
}

function getFFprobeErrorMessage(message: string, {
  inputFile,
  status,
  stderrOutput,
  cmd,
  previous,
  binary,
  cwd,
}: FFprobeErrorOptions): string {
  message = red(message);
  message += `\n`;
  if (status) {
    message += `\n  ${bold("Exit code:")} ${inspect(status.code)}`;
    if (typeof status?.signal === "number") {
      message += `\n  ${bold("Signal:")} ${inspect(status.signal)}`;
    }
  }
  message += `\n  ${bold("FFprobe binary:")} ${inspect(binary)}`;
  message += `\n  ${bold("Input file:")} ${inspect(inputFile)}`;
  message += `\n  ${bold("Working directory:")} ${inspect(cwd ?? Deno.cwd())}`;
  if (cmd) {
    message += `\n  ${bold("FFprobe command:")} ${inspect(cmd.join(" "))}`;
  }
  if (previous) {
    message += `\n  ${bold("Original error:")} ${previous.stack}`;
  }
  message += `\n`;
  if (stderrOutput) {
    const errorMessage = new TextDecoder().decode(stderrOutput);
    message += `\n${red(errorMessage.trim())}\n`;
  }

  return message;
}

function getFFmpegErrorMessage(message: string, {
  encoding,
  status,
  stderrOutput,
  cmd,
  previous,
}: FFmpegErrorOptions) {
  message = red(message);
  message += `\n`;
  if (status) {
    message += `\n  ${bold("Exit code:")} ${inspect(status.code)}`;
    if (typeof status?.signal === "number") {
      message += `\n  ${bold("Signal:")} ${inspect(status.signal)}`;
    }
  }
  message += `\n  ${bold("FFmpeg binary:")} ${inspect(encoding.binary)}`;
  message += `\n  ${bold("Input file:")} ${inspect(encoding.input)}`;
  message += `\n  ${bold("Output file:")} ${inspect(encoding.output)}`;
  message += `\n  ${bold("Working directory:")} ${
    inspect(encoding.cwd ?? Deno.cwd())
  }`;
  if (cmd) {
    message += `\n  ${bold("FFmpeg command:")} ${inspect(cmd.join(" "))}`;
  }
  if (previous) {
    message += `\n  ${bold("Original error:")} ${previous.stack}`;
  }
  message += `\n`;
  if (stderrOutput) {
    const errorMessage = new TextDecoder().decode(stderrOutput);
    message += `\n${red(errorMessage.trim())}\n`;
  }

  return message;
}

function inspect(value: unknown): string {
  return Deno.inspect(value, { colors: true });
}
