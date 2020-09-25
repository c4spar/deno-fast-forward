import {
  FFprobeBinaryNotFound,
  FFprobeBinaryPermissionDenied,
  FFprobeCommandFailed,
} from "./errors.ts";
import type { MediaInfo } from "./media_info.ts";

export interface FFprobeOptions {
  cwd?: string;
  binary?: string;
  args?: Array<string>;
}

export async function ffprobe(
  input: string,
  { cwd, binary, args }: FFprobeOptions,
): Promise<MediaInfo> {
  if (!binary) {
    binary = "ffprobe";
  }
  if (!args) {
    args = [];
  }
  const cmd = [
    binary,
    "-hide_banner",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    ...args,
    input,
  ];

  let process: Deno.Process;
  try {
    process = Deno.run({
      cmd,
      cwd,
      stdout: "piped",
      stderr: "piped",
    });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new FFprobeBinaryNotFound({
        binary,
        cwd,
        inputFile: input,
        cmd,
        previous: error,
      });
    } else if (error instanceof Deno.errors.PermissionDenied) {
      throw new FFprobeBinaryPermissionDenied({
        binary,
        cwd,
        inputFile: input,
        cmd,
        previous: error,
      });
    }
    throw error;
  }

  const status = await process.status();
  if (!status.success) {
    process.stdout?.close();
    process.close();
    throw new FFprobeCommandFailed({
      binary,
      cwd,
      inputFile: input,
      cmd,
      status,
      stderrOutput: await process.stderrOutput(),
    });
  }

  const output = await process.output();

  process.stderr?.close();
  process.close();

  return JSON.parse(
    new TextDecoder().decode(output),
  );
}
