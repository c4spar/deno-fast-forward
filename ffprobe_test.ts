import { assertEquals, dirname } from "./dev_deps.ts";
import {
  Codecs,
  Encoders,
  ffprobe,
  Filters,
  Formats,
  getAvailableCodecs,
  getAvailableEncoders,
  getAvailableFilters,
  getAvailableFormats,
} from "./ffprobe.ts";
import { MediaInfo } from "./media_info.ts";

const rootDir: string = dirname(import.meta.url).replace(/^file:\/\//, "");
const inputPath = `${rootDir}/fixtures/sample.mp4`;
const expectedMediaInfo: MediaInfo = {
  format: {
    filename: inputPath,
    nbStreams: 3,
    nbPrograms: 0,
    formatName: "mov,mp4,m4a,3gp,3g2,mj2",
    formatLongName: "QuickTime / MOV",
    startTime: "0.000000",
    duration: "10.027000",
    size: "278314",
    bitRate: "222051",
    probeScore: 100,
    tags: {
      majorBrand: "isom",
      minorVersion: "512",
      compatibleBrands: "isomiso2avc1mp41",
      encoder: "Lavf58.12.100",
    },
  },
  streams: [{
    index: 0,
    codecName: "h264",
    codecLongName: "H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10",
    profile: "High",
    codecType: "video",
    codecTimeBase: "1/50",
    codecTagString: "avc1",
    codecTag: "0x31637661",
    width: 200,
    height: 110,
    codedWidth: 208,
    codedHeight: 112,
    hasBFrames: 2,
    pixFmt: "yuv420p",
    level: 11,
    chromaLocation: "left",
    refs: 1,
    isAvc: "true",
    nalLengthSize: "4",
    rFrameRate: "25/1",
    avgFrameRate: "25/1",
    timeBase: "1/12800",
    startPts: 0,
    startTime: "0.000000",
    durationTs: 128000,
    duration: "10.000000",
    bitRate: "86508",
    bitsPerRawSample: "8",
    nbFrames: "250",
    disposition: {
      default: 1,
      dub: 0,
      original: 0,
      comment: 0,
      lyrics: 0,
      karaoke: 0,
      forced: 0,
      hearingImpaired: 0,
      visualImpaired: 0,
      cleanEffects: 0,
      attachedPic: 0,
      timedThumbnails: 0,
    },
    tags: {
      language: "und",
      handlerName: "VideoHandler",
    },
  }, {
    index: 1,
    codecName: "aac",
    codecLongName: "AAC (Advanced Audio Coding)",
    profile: "LC",
    codecType: "audio",
    codecTimeBase: "1/48000",
    codecTagString: "mp4a",
    codecTag: "0x6134706d",
    sampleFmt: "fltp",
    sampleRate: "48000",
    channels: 2,
    channelLayout: "stereo",
    bitsPerSample: 0,
    rFrameRate: "0/0",
    avgFrameRate: "0/0",
    timeBase: "1/48000",
    startPts: 0,
    startTime: "0.000000",
    durationTs: 481296,
    duration: "10.027000",
    bitRate: "128226",
    maxBitRate: "128226",
    nbFrames: "470",
    disposition: {
      default: 1,
      dub: 0,
      original: 0,
      comment: 0,
      lyrics: 0,
      karaoke: 0,
      forced: 0,
      hearingImpaired: 0,
      visualImpaired: 0,
      cleanEffects: 0,
      attachedPic: 0,
      timedThumbnails: 0,
    },
    tags: {
      language: "und",
      handlerName: "SoundHandler",
    },
  }, {
    index: 2,
    codecName: "bin_data",
    codecLongName: "binary data",
    codecType: "data",
    codecTagString: "text",
    codecTag: "0x74786574",
    rFrameRate: "0/0",
    avgFrameRate: "0/0",
    timeBase: "1/1000",
    startPts: 0,
    startTime: "0.000000",
    durationTs: 10027,
    duration: "10.027000",
    bitRate: "18",
    nbFrames: "1",
    disposition: {
      default: 0,
      dub: 0,
      original: 0,
      comment: 0,
      lyrics: 0,
      karaoke: 0,
      forced: 0,
      hearingImpaired: 0,
      visualImpaired: 0,
      cleanEffects: 0,
      attachedPic: 0,
      timedThumbnails: 0,
    },
    tags: {
      language: "eng",
      handlerName: "SubtitleHandler",
    },
  }],
};

Deno.test({
  name: "ffprobe - getMediaInfo",
  async fn() {
    const mediaInfo: MediaInfo = await ffprobe(inputPath);
    assertEquals(mediaInfo, expectedMediaInfo);
  },
});

Deno.test({
  name: "ffprobe - getAvailableFormats",
  async fn() {
    const formats: Formats = await getAvailableFormats();
    assertEquals(
      formats && typeof formats === "object",
      true,
      "formats is not an object",
    );
    const formatNames: Array<string> = Object.keys(formats);
    assertEquals(
      formatNames.length > 0,
      true,
      "formats.length should be > 0",
    );
    for (const format of formatNames) {
      assertEquals(
        typeof formats[format].description === "string",
        true,
        "format property description is not a string",
      );
      assertEquals(
        typeof formats[format].canDemux === "boolean",
        true,
        "format property canDemux is not a boolean",
      );
      assertEquals(
        typeof formats[format].canMux === "boolean",
        true,
        "format property canMux is not a boolean",
      );
    }
  },
});

Deno.test({
  name: "ffprobe - getAvailableFilters",
  async fn() {
    const filters: Filters = await getAvailableFilters();
    assertEquals(
      filters && typeof filters === "object",
      true,
      "formats is not an object",
    );
    const filterNames: Array<string> = Object.keys(filters);
    assertEquals(
      filterNames.length > 0,
      true,
      "formats.length should be > 0",
    );
    for (const filterName of filterNames) {
      assertEquals(
        typeof filters[filterName].description === "string",
        true,
        "filter property description is not a string",
      );
      assertEquals(
        ["video", "audio", "none"].includes(filters[filterName].input),
        true,
        "unexpected filter input",
      );
      assertEquals(
        ["video", "audio", "none"].includes(filters[filterName].output),
        true,
        "unexpected filter output",
      );
      assertEquals(
        typeof filters[filterName].multipleInputs === "boolean",
        true,
        "filter property multipleInputs is not a boolean",
      );
      assertEquals(
        typeof filters[filterName].multipleOutputs === "boolean",
        true,
        "filter property multipleOutputs is not a boolean",
      );
    }
  },
});

Deno.test({
  name: "ffprobe - getAvailableCodecs",
  async fn() {
    const codecs: Codecs = await getAvailableCodecs();
    assertEquals(
      codecs && typeof codecs === "object",
      true,
      "codecs is not an object",
    );
    const codecNames: Array<string> = Object.keys(codecs);
    assertEquals(
      codecNames.length > 0,
      true,
      "codecs.length should be > 0",
    );
    for (const codecName of codecNames) {
      assertEquals(
        typeof codecs[codecName].description === "string",
        true,
        "codec property description is not a string",
      );
      assertEquals(
        ["video", "audio", "subtitle"].includes(codecs[codecName].type),
        true,
        "unexpected codec type",
      );
      assertEquals(
        typeof codecs[codecName].canDecode === "boolean",
        true,
        "codec property canDecode is not a boolean",
      );
    }
  },
});

Deno.test({
  name: "ffprobe - getAvailableEncoders",
  async fn() {
    const encoders: Encoders = await getAvailableEncoders();
    assertEquals(
      encoders && typeof encoders === "object",
      true,
      "encoders is not an object",
    );
    const encoderNames: Array<string> = Object.keys(encoders);
    assertEquals(
      encoderNames.length > 0,
      true,
      "encoders.length should be > 0",
    );
    for (const encoderName of encoderNames) {
      assertEquals(
        typeof encoders[encoderName].description === "string",
        true,
        "encoder property description is not a string",
      );
      assertEquals(
        ["video", "audio", "subtitle"].includes(encoders[encoderName].type),
        true,
        "unexpected encoder type",
      );
      assertEquals(
        typeof encoders[encoderName].frameMT === "boolean",
        true,
        "encoder property frameMT is not a boolean",
      );
      assertEquals(
        typeof encoders[encoderName].sliceMT === "boolean",
        true,
        "encoder property sliceMT is not a boolean",
      );
      assertEquals(
        typeof encoders[encoderName].sliceMT === "boolean",
        true,
        "encoder property sliceMT is not a boolean",
      );
      assertEquals(
        typeof encoders[encoderName].experimental === "boolean",
        true,
        "encoder property experimental is not a boolean",
      );
      assertEquals(
        typeof encoders[encoderName].drawHorizBand === "boolean",
        true,
        "encoder property drawHorizBand is not a boolean",
      );
      assertEquals(
        typeof encoders[encoderName].directRendering === "boolean",
        true,
        "encoder property directRendering is not a boolean",
      );
    }
  },
});
