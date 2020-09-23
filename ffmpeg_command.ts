import type { Encoding } from "./encoding.ts";

export class FFmpegCommand extends Array<string> {
  constructor(encoding: Encoding, silent?: boolean) {
    super();
    this.#init(encoding, silent);
  }

  #init = (encoding: Encoding, silent?: boolean) => {
    this.push(
      encoding.binary,
      "-hide_banner",
    );

    // if (!encoding.input) {
    //   throw new Error("Missing input for encoding.");
    // }

    // Input options...

    // if (encoding.input) {
    this.push("-i", encoding.input);
    // }

    // Output options...

    // this.push("-map_metadata", "0");
    // this.push("-movflags", "use_metadata_tags");

    this.push(encoding.override ? "-y" : "-n");

    if (!silent) {
      this.push("-progress", "-", "-nostats");
    }

    if (encoding.threads) {
      this.push("-threads", encoding.threads.toString());
    }

    if (encoding.format) {
      this.push("-f", encoding.format);
    }

    if (encoding.codec) {
      this.push("-codec", encoding.codec);
    }
    if (encoding.audioCodec) {
      this.push("-acodec", encoding.audioCodec);
    }
    if (encoding.videoCodec) {
      this.push("-vcodec", encoding.videoCodec);
    }

    if (encoding.audioBitrate) {
      let audioBitrate: string = encoding.audioBitrate.toString();
      if (!isNaN(Number(audioBitrate))) {
        audioBitrate += "k";
      }
      this.push("-b:a", audioBitrate);
    }
    if (encoding.videoBitrate) {
      let videoBitrate: string = encoding.videoBitrate.toString();
      if (!isNaN(Number(videoBitrate))) {
        videoBitrate += "k";
      }
      this.push("-b:v", videoBitrate);
    }
    if (encoding.minVideoBitrate) {
      this.push("-minrate", encoding.minVideoBitrate.toString());
    }
    if (encoding.maxVideoBitrate) {
      this.push("-maxrate", encoding.maxVideoBitrate.toString());
    }
    if (encoding.videoBufSize) {
      this.push("-bufsize", encoding.videoBufSize.toString());
    }

    if (encoding.frameRate) {
      this.push("-r", encoding.frameRate.toString());
    }

    if (encoding.sampleRate) {
      this.push("-ar", encoding.sampleRate.toString());
    }

    if (encoding.frames) {
      this.push("-vframes", encoding.frames.toString());
    }

    if (encoding.audioQuality) {
      this.push("-q:a", encoding.audioQuality.toString());
    }

    if (encoding.audioChannels) {
      this.push("-ac", encoding.audioChannels.toString());
    }

    if (encoding.duration) {
      this.push("-t", encoding.duration.toString());
    }

    if (encoding.loop) {
      this.push("-loop", encoding.loop.toString());
    }

    if (encoding.noAudio) {
      this.push("-an");
    }
    if (encoding.noVideo) {
      this.push("-vn");
    }

    if (encoding.width || encoding.height) {
      const width: string | number = encoding.width ?? -1;
      const height: string | number = encoding.height ?? -1;
      this.push("-vf", `scale=${width}:${height}`);
    }

    // if (encoding.rotate) {
    //   this.push("-metadata:s:v", `rotate=${encoding.rotate.toString()}`);
    // }

    if (encoding.logLevel) {
      this.push("-loglevel", encoding.logLevel);
    }

    if (encoding.args) {
      this.push(...encoding.args);
    }

    if (encoding.output) {
      this.push(encoding.output);
    }
  };
}
