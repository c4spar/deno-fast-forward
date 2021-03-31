export interface MediaInfo {
  format: MediaFormat;
  streams: MediaStream[];
}

export interface MediaFormat {
  filename: string;
  nbStreams: number;
  nbPrograms: number;
  formatName: string;
  formatLongName: string;
  startTime: string;
  duration: string;
  size: string;
  bitRate: string;
  probeScore: number;
  tags: MediaFormatTags;
}

export type MediaFormatTags = Record<string, string | number | undefined>;
export type MediaStream = VideoStream | AudioStream | DataStream;
export type MediaStreamType = "video" | "audio" | "data";
export type MediaStreamTags = Record<string, string | number | undefined>;

export interface Stream {
  [name: string]: unknown;

  index: number;
  codecType: MediaStreamType;
  avgFrameRate?: string;
  bitRate?: string;
  codecLongName?: string;
  codecName?: string;
  codecTag?: string;
  codecTagString?: string;
  durationTs?: number;
  duration?: string;
  disposition?: Disposition;
  nbFrames?: string;
  rFrameRate?: string;
  startPts?: number;
  startTime?: string;
  tags?: MediaStreamTags;
  timeBase?: string;
}

export interface VideoStream extends Stream {
  codecType: "video";
  profile?: string;
  codecTimeBase?: string;
  width?: number;
  height?: number;
  codedWidth?: number;
  codedHeight?: number;
  hasBFrames?: number;
  pixFmt?: string;
  level?: number;
  colorRange?: string;
  colorSpace?: string;
  colorTransfer?: string;
  colorPrimaries?: string;
  chromaLocation?: string;
  refs?: number;
  isAvc?: string;
  nalLengthSize?: string;
  bitsPerRawSample?: string;
}

export interface AudioStream extends Stream {
  codecType: "audio";
  profile?: string;
  codecTimeBase?: string;
  sampleFmt?: string;
  sampleRate?: string;
  channels?: number;
  channelLayout?: string;
  bitsPerSample?: number;
  maxBitRate?: string;
}

export interface DataStream extends Stream {
  codecType: "data";
}

interface Disposition {
  default?: number;
  dub?: number;
  original?: number;
  comment?: number;
  lyrics?: number;
  karaoke?: number;
  forced?: number;
  hearingImpaired?: number;
  visualImpaired?: number;
  cleanEffects?: number;
  attachedPic?: number;
  timedThumbnails?: number;
}
