import { assertEquals } from "./dev_deps.ts";
import { Encoding } from "./encoding.ts";
import { FFmpegCommand } from "./ffmpeg_command.ts";

Deno.test({
  name: "ffmpeg command default options",
  fn() {
    const cmd: Array<string> = new FFmpegCommand(new Encoding()).toArray();
    assertEquals(cmd, [
      "ffmpeg",
      "-hide_banner",
      "-i",
      "pipe:0",
      "-progress",
      "-",
      "-nostats",
      "-n",
      "pipe:1",
    ]);
  },
});

Deno.test({
  name: "ffmpeg command options",
  fn() {
    const encoding = new Encoding();
    encoding.input = "input.mp4";
    encoding.output = "output.mp4";
    encoding.cwd = Deno.cwd();
    encoding.threads = 4;
    encoding.binary = "my-ffmpeg";
    encoding.override = true;
    encoding.format = "mp4";
    encoding.audioBitrate = "192k";
    encoding.videoBitrate = "1M";
    encoding.minVideoBitrate = "1M";
    encoding.maxVideoBitrate = "1M";
    encoding.videoBufSize = "3M";
    encoding.codec = "copy";
    encoding.audioCodec = "copy";
    encoding.videoCodec = "copy";
    encoding.width = 200;
    encoding.height = -1;
    encoding.frameRate = 24;
    encoding.sampleRate = 44100;
    encoding.frames = 100;
    encoding.audioQuality = 2;
    encoding.audioChannels = 2;
    encoding.duration = 4;
    encoding.loop = 0;
    // encoding.rotate = -180;
    encoding.noAudio = true;
    encoding.noVideo = true;
    encoding.logLevel = "repeat+level+verbose";
    encoding.args = ["-custom"];

    const cmd: Array<string> = new FFmpegCommand(encoding).toArray();
    assertEquals(cmd, [
      "my-ffmpeg",
      "-hide_banner",
      "-i",
      "input.mp4",
      "-progress",
      "-",
      "-nostats",
      "-threads",
      "4",
      "-loglevel",
      "repeat+level+verbose",
      "-y",
      "-b:a",
      "192k",
      "-b:v",
      "1M",
      "-minrate",
      "1M",
      "-maxrate",
      "1M",
      "-bufsize",
      "3M",
      "-vframes",
      "100",
      "-q:a",
      "2",
      "-vf",
      "scale=200:-1",
      // "-metadata:s:v", "rotate=-180",
      "-ac",
      "2",
      "-acodec",
      "copy",
      "-codec",
      "copy",
      "-t",
      "4",
      "-f",
      "mp4",
      "-r",
      "24",
      "-an",
      "-vn",
      "-ar",
      "44100",
      "-vcodec",
      "copy",
      "-custom",
      "output.mp4",
    ]);
  },
});
