import {
  FFmpegBaseOptions,
  FFmpegBaseParameters,
} from "./encoding_base_parameters.ts";

export interface FFmpegOutputOptions extends FFmpegBaseOptions {
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

/** output parameters */
export class AbstractFFmpegOutputParameters
  extends FFmpegBaseParameters<FFmpegOutputOptions>
  implements FFmpegOutputOptions {
  constructor(options: FFmpegOutputOptions = {}) {
    super(options);
  }

  get override(): boolean | undefined {
    return this.opts.override;
  }

  set override(enable: boolean | undefined) {
    this.opts.override = enable;
  }

  get audioBitrate(): number | string | undefined {
    return this.opts.audioBitrate;
  }

  set audioBitrate(audioBitrate: number | string | undefined) {
    this.opts.audioBitrate = audioBitrate;
  }

  get videoBitrate(): number | string | undefined {
    return this.opts.videoBitrate;
  }

  set videoBitrate(videoBitrate: number | string | undefined) {
    this.opts.videoBitrate = videoBitrate;
  }

  get minVideoBitrate(): number | string | undefined {
    return this.opts.minVideoBitrate;
  }

  set minVideoBitrate(bitrate: number | string | undefined) {
    this.opts.minVideoBitrate = bitrate;
  }

  get maxVideoBitrate(): number | string | undefined {
    return this.opts.maxVideoBitrate;
  }

  set maxVideoBitrate(bitrate: number | string | undefined) {
    this.opts.maxVideoBitrate = bitrate;
  }

  get videoBufSize(): number | string | undefined {
    return this.opts.videoBufSize;
  }

  set videoBufSize(size: number | string | undefined) {
    this.opts.videoBufSize = size;
  }

  get width(): number | string | undefined {
    return this.opts.width;
  }

  set width(width: number | string | undefined) {
    this.opts.width = width;
  }

  get height(): number | string | undefined {
    return this.opts.height;
  }

  set height(height: number | string | undefined) {
    this.opts.height = height;
  }

  get frames(): number | undefined {
    return this.opts.frames;
  }

  set frames(frames: number | undefined) {
    this.opts.frames = frames;
  }

  get audioQuality(): number | undefined {
    return this.opts.audioQuality;
  }

  set audioQuality(audioQuality: number | undefined) {
    this.opts.audioQuality = audioQuality;
  }

  get loop(): number | string | undefined {
    return this.opts.loop;
  }

  set loop(loop: number | string | undefined) {
    this.opts.loop = loop;
  }

  // get rotate(): number | undefined {
  //   return this.opts.rotate;
  // }
  //
  // set rotate(deg: number | undefined) {
  //   this.opts.rotate = deg;
  // }

  clone(): FFmpegOutputParameters {
    return new FFmpegOutputParameters().merge(this);
  }
}

export class FFmpegOutputParameters extends AbstractFFmpegOutputParameters {
  constructor(options?: FFmpegOutputOptions) {
    super(options);
  }

  get options(): FFmpegOutputOptions {
    return this.opts;
  }

  set options(options: FFmpegOutputOptions) {
    this.opts = options;
  }

  // options(options: FFmpegOutputOptions): void;
  // options(): FFmpegOutputOptions;
  // options(options?: FFmpegOutputOptions): FFmpegOutputOptions | void {
  //   if (options) {
  //     Object.assign(this.opts, options);
  //   } else {
  //     return this.opts;
  //   }
  // }
}
