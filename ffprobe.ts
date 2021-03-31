import {
  FFprobeBinaryNotFound,
  FFprobeBinaryPermissionDenied,
  FFprobeCommandFailed,
} from "./errors.ts";
import type { MediaInfo } from "./media_info.ts";

/*******************************************************************************
 * FORMATS *********************************************************************
 *******************************************************************************/

export interface Format {
  description: string;
  canDemux: boolean;
  canMux: boolean;
}

export type Formats = Record<string, Format>;

/*******************************************************************************
 * FILTER **********************************************************************
 *******************************************************************************/

export type FilterType = "video" | "audio" | "none";

export interface Filter {
  description: string;
  input: FilterType;
  multipleInputs: boolean;
  output: FilterType;
  multipleOutputs: boolean;
  // timelineSupport: boolean;
  // sliceThreading: boolean;
  // commandThreading: boolean;
}

export type Filters = Record<string, Filter>;

/*******************************************************************************
 * CODECS **********************************************************************
 *******************************************************************************/

type CodecType = "video" | "audio" | "subtitle";

export interface BaseCodec {
  type: CodecType;
  description: string;
  canDecode: boolean;
  canEncode: boolean;
}

export interface AVCodec extends BaseCodec {
  drawHorizBand: boolean;
  directRendering: boolean;
  weirdFrameTruncation: boolean;
}

export interface FFCodec extends BaseCodec {
  intraFrameOnly: boolean;
  isLossy: boolean;
  isLossless: boolean;
}

export type Codec = AVCodec | FFCodec;

export type Codecs = Record<string, Codec>;

/*******************************************************************************
 * ENCODER *********************************************************************
 *******************************************************************************/

type EncoderType = "video" | "audio" | "subtitle";

export interface Encoder {
  type: EncoderType;
  description: string;
  frameMT: boolean;
  sliceMT: boolean;
  experimental: boolean;
  drawHorizBand: boolean;
  directRendering: boolean;
}

export type Encoders = Record<string, Encoder>;

/*******************************************************************************
 * FFprobe *********************************************************************
 *******************************************************************************/

const avCodecRegexp =
  /^\s*([D ])([E ])([VAS])([S ])([D ])([T ]) ([^ ]+) +(.*)$/;
const ffCodecRegexp =
  /^\s*([D.])([E.])([VAS])([I.])([L.])([S.]) ([^ ]+) +(.*)$/;
const ffEncodersRegexp = /\(encoders:([^)]+)\)/;
const ffDecodersRegexp = /\(decoders:([^)]+)\)/;
const encodersRegexp =
  /^\s*([VAS.])([F.])([S.])([X.])([B.])([D.]) ([^ ]+) +(.*)$/;
const formatRegexp = /^\s*([D ])([E ]) ([^ ]+) +(.*)$/;
const lineBreakRegexp = /\r\n|\r|\n/;
const filterRegexp =
  /^(?: [T.][S.][C.] )?([^ ]+) +(AA?|VV?|\|)->(AA?|VV?|\|) +(.*)$/;

export interface FFprobeOptions {
  cwd?: string;
  binary?: string;
}

export interface FFprobeRunOptions extends FFprobeOptions {
  cmd?: Array<string>;
}

export function ffprobe(
  input: string,
  options?: FFprobeOptions,
): Promise<MediaInfo> {
  return getMediaInfo(input, options);
}

export async function getMediaInfo(
  input: string,
  options: FFprobeOptions = {},
): Promise<MediaInfo> {
  const output: string = await run({
    ...options,
    cmd: [
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      input,
    ],
  });
  return camelizeRecord(JSON.parse(output)) as MediaInfo;
}

export async function getFFprobeVersion(
  options: FFprobeOptions = {},
): Promise<string> {
  const output: string = await run({
    ...options,
    cmd: ["-version"],
  });
  return output.split("\n")[0]?.split(" ")[2] ?? "unknown";
}

export async function getAvailableFormats(
  options: FFprobeOptions = {},
): Promise<Formats> {
  const output: string = await run({
    ...options,
    cmd: ["-formats"],
  });

  const lines: string[] = output.split("\n");
  const formats: Formats = {};

  for (const line of lines) {
    const match: RegExpMatchArray | null = line.match(formatRegexp);
    if (match) {
      const desc: string = match[4];
      for (const format of match[3].split(",")) {
        if (!(format in formats)) {
          formats[format] = {
            description: desc,
            canDemux: false,
            canMux: false,
          };
        }

        if (match[1] === "D") {
          formats[format].canDemux = true;
        }
        if (match[2] === "E") {
          formats[format].canMux = true;
        }
      }
    }
  }

  return formats;
}

export async function getAvailableFilters(
  options: FFprobeOptions = {},
): Promise<Filters> {
  const output: string = await run({
    ...options,
    cmd: ["-filters"],
  });

  const lines: string[] = output.split("\n");
  const filters: Filters = {};
  const types: Record<string, FilterType> = {
    A: "audio",
    V: "video",
    "|": "none",
  };

  for (const line of lines) {
    const match = line.match(filterRegexp);
    if (match) {
      filters[match[1]] = {
        description: match[4],
        input: types[match[2].charAt(0)],
        multipleInputs: match[2].length > 1,
        output: types[match[3].charAt(0)],
        multipleOutputs: match[3].length > 1,
      };
    }
  }

  return filters;
}

export async function getAvailableCodecs(
  options: FFprobeOptions = {},
): Promise<Codecs> {
  const output: string = await run({
    ...options,
    cmd: ["-codecs"],
  });
  const lines: string[] = output.split(lineBreakRegexp);
  const codecs: Codecs = {};
  const types: Record<string, CodecType> = {
    "V": "video",
    "A": "audio",
    "S": "subtitle",
  };
  let match: RegExpMatchArray | null = null;

  for (const line of lines) {
    match = line.match(avCodecRegexp);
    if (match && match[7] !== "=") {
      codecs[match[7]] = {
        type: types[match[3]],
        description: match[8],
        canDecode: match[1] === "D",
        canEncode: match[2] === "E",
        drawHorizBand: match[4] === "S",
        directRendering: match[5] === "D",
        weirdFrameTruncation: match[6] === "T",
      };
    }

    match = line.match(ffCodecRegexp);
    if (match && match[7] !== "=") {
      const codecData: FFCodec = codecs[match[7]] = {
        type: types[match[3]] as CodecType,
        description: match[8],
        canDecode: match[1] === "D",
        canEncode: match[2] === "E",
        intraFrameOnly: match[4] === "I",
        isLossy: match[5] === "L",
        isLossless: match[6] === "S",
      };

      match = codecData.description.match(ffEncodersRegexp);
      const encoders = match ? match[1].trim().split(" ") : [];

      match = codecData.description.match(ffDecodersRegexp);
      const decoders = match ? match[1].trim().split(" ") : [];

      if (encoders.length || decoders.length) {
        const coderData: Partial<Codec> = Object.assign({}, codecData);
        delete coderData.canEncode;
        delete coderData.canDecode;

        for (const name of encoders) {
          codecs[name] = Object.assign({}, codecData as Codec);
          codecs[name].canEncode = true;
        }

        for (const name of decoders) {
          if (name in codecs) {
            codecs[name].canDecode = true;
          } else {
            codecs[name] = Object.assign({}, coderData as Codec);
            codecs[name].canDecode = true;
          }
        }
      }
    }
  }

  return codecs;
}

export async function getAvailableEncoders(
  options: FFprobeOptions = {},
): Promise<Encoders> {
  const output: string = await run({
    ...options,
    cmd: ["-encoders"],
  });

  const lines: string[] = output.split(lineBreakRegexp);
  const encoders: Record<string, Encoder> = {};
  const type: Record<string, EncoderType> = {
    "V": "video",
    "A": "audio",
    "S": "subtitle",
  };

  for (const line of lines) {
    const match = line.match(encodersRegexp);
    if (match && match[7] !== "=") {
      encoders[match[7]] = {
        type: type[match[1]],
        description: match[8],
        frameMT: match[2] === "F",
        sliceMT: match[3] === "S",
        experimental: match[4] === "X",
        drawHorizBand: match[5] === "B",
        directRendering: match[6] === "D",
      };
    }
  }

  return encoders;
}

async function run(
  { cwd, binary = "ffprobe", cmd = [] }: FFprobeRunOptions,
): Promise<string> {
  let process: Deno.Process;
  cmd = [binary, "-hide_banner", ...cmd];
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

  return new TextDecoder().decode(output);
}

function camelizeRecord(
  obj: Record<string, unknown> | Array<unknown>,
  // deno-lint-ignore no-explicit-any
): Record<string, any> | Array<any> {
  return Object.entries(obj)
    // deno-lint-ignore no-explicit-any
    .reduce((record: any, [name, value]: [string | number, unknown]) => {
      if (typeof name === "string") {
        name = snakeCaseToCamelCase(name);
      }
      if (value && typeof value === "object") {
        record[name] = camelizeRecord(value as Record<string, unknown>);
      } else {
        record[name] = value;
      }
      return record;
    }, Array.isArray(obj) ? [] : {});
}

function snakeCaseToCamelCase(str: string): string {
  return str.replace(/_([a-z])/gi, (g) => g[1].toUpperCase());
}
