import { Encoding } from "./encoding.ts";
import {
  FFmpegBaseOptions,
  FFmpegBaseParameters,
} from "./encoding_base_parameters.ts";
import { FFmpegInputParameters } from "./encoding_input_parameters.ts";
import { FFmpegOutputParameters } from "./encoding_output_parameters.ts";

export class FFmpegCommand {
  #args: Array<string> = [];
  constructor(encoding: Encoding, silent?: boolean) {
    this.#setOptions(encoding, silent);
  }

  toArray(): Array<string> {
    return this.#args;
  }

  #setOptions = (encoding: Encoding, silent?: boolean) => {
    this.#args.push(encoding.binary, "-hide_banner");
    this.#setInputOptions(encoding.inputOptions);
    this.#args.push("-i", encoding.input);
    if (!silent) {
      !silent && this.#args.push("-progress", "-", "-nostats");
    }
    if (encoding.threads) {
      this.#args.push("-threads", encoding.threads.toString());
    }
    if (encoding.logLevel) {
      this.#args.push("-loglevel", encoding.logLevel);
    }
    this.#setOutputOptions(encoding.outputOptions);
    if (encoding.output) {
      this.#args.push(encoding.output);
    }
  };

  #setInputOptions = (options: FFmpegInputParameters) => {
    this.#setBaseOptions(options);
  };

  #setOutputOptions = (options: FFmpegOutputParameters) => {
    // this.#args.push("-map_metadata", "0");
    // this.#args.push("-movflags", "use_metadata_tags");
    this.#args.push(options.override ? "-y" : "-n");
    if (options.audioBitrate) {
      let audioBitrate: string = options.audioBitrate.toString();
      if (!isNaN(Number(audioBitrate))) {
        audioBitrate += "k";
      }
      this.#args.push("-b:a", audioBitrate);
    }
    if (options.videoBitrate) {
      let videoBitrate: string = options.videoBitrate.toString();
      if (!isNaN(Number(videoBitrate))) {
        videoBitrate += "k";
      }
      this.#args.push("-b:v", videoBitrate);
    }
    if (options.minVideoBitrate) {
      this.#args.push("-minrate", options.minVideoBitrate.toString());
    }
    if (options.maxVideoBitrate) {
      this.#args.push("-maxrate", options.maxVideoBitrate.toString());
    }
    if (options.videoBufSize) {
      this.#args.push("-bufsize", options.videoBufSize.toString());
    }
    if (options.frames) {
      this.#args.push("-vframes", options.frames.toString());
    }
    if (options.audioQuality) {
      this.#args.push("-q:a", options.audioQuality.toString());
    }
    if (options.loop) {
      this.#args.push("-loop", options.loop.toString());
    }
    if (options.width || options.height) {
      const width: string | number = options.width ?? -1;
      const height: string | number = options.height ?? -1;
      this.#args.push("-vf", `scale=${width}:${height}`);
    }
    // if (options.rotate) {
    //   this.#args.push("-metadata:s:v", `rotate=${options.rotate.toString()}`);
    // }
    this.#setBaseOptions(options);
  };

  #setBaseOptions = (options: FFmpegBaseParameters<FFmpegBaseOptions>) => {
    if (options.audioChannels) {
      this.#args.push("-ac", options.audioChannels.toString());
    }
    if (options.audioCodec) {
      this.#args.push("-acodec", options.audioCodec);
    }
    if (options.codec) {
      this.#args.push("-codec", options.codec);
    }
    if (options.duration) {
      this.#args.push("-t", options.duration.toString());
    }
    if (options.format) {
      this.#args.push("-f", options.format);
    }
    if (options.frameRate) {
      this.#args.push("-r", options.frameRate.toString());
    }
    if (options.noAudio) {
      this.#args.push("-an");
    }
    if (options.noVideo) {
      this.#args.push("-vn");
    }
    if (options.sampleRate) {
      this.#args.push("-ar", options.sampleRate.toString());
    }
    if (options.videoCodec) {
      this.#args.push("-vcodec", options.videoCodec);
    }
    if (options.args) {
      this.#args.push(...options.args);
    }
  };
}
