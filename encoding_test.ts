import {
  assertEquals,
  dirname,
  ensureDir,
  exists,
  fromFileUrl,
} from "./dev_deps.ts";
import { Encoding } from "./encoding.ts";
import { EncodingProcess } from "./encoding_process.ts";

const rootDir: string = dirname(fromFileUrl(import.meta.url));
const inputPath = `${rootDir}/fixtures/sample.mp4`;

Deno.test({
  name: "encoding options",
  async fn() {
    const outputPath = `${rootDir}/.tmp/encoding options.mp4`;
    await ensureDir(`${rootDir}/.tmp`);

    const encoding = new Encoding();
    encoding.input = inputPath;
    encoding.output = outputPath;
    encoding.override = true;
    encoding.width = 200;

    const encodingProcess = new EncodingProcess(encoding);

    encodingProcess.run();
    await encodingProcess.status();
    encodingProcess.close();

    const outputFileExists: boolean = await exists(outputPath);
    assertEquals(outputFileExists, true);
  },
});
