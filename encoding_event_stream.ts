import type { Encoding } from "./encoding.ts";
import type { EncodingProcess } from "./encoding_process.ts";
import {
  EncodingEventStreamAlreadyDisposed,
  EncodingProcessNotStarted,
} from "./errors.ts";
import type { EncodingEvent } from "./events.ts";

type Resolver<T> = (value: T | PromiseLike<T>) => void;
type Reject = (error: Error) => void;

interface PullQueueItem {
  resolve: Resolver<EncodingEvent | null>;
  reject: Reject;
}

export class EncodingEventStream
  implements AsyncIterableIterator<EncodingEvent> {
  #disposed = false;
  #pullQueue: PullQueueItem[] = [];
  #pushQueue: (EncodingEvent | null)[] = [];
  #encodingProcess: EncodingProcess;
  #encoding: Encoding;
  #done = false;

  constructor(process: EncodingProcess) {
    this.#encodingProcess = process;
    this.#encoding = process.encoding;
    this.#encoding.addEventListener("start", this.#pushEvent);
    this.#encoding.addEventListener("info", this.#pushEvent);
    this.#encoding.addEventListener("progress", this.#pushEvent);
    this.#encoding.addEventListener("end", this.#pushEvent);
    this.#encoding.addEventListener("error", this.#pushEvent);
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<EncodingEvent> {
    return this;
  }

  dispose = () => {
    if (this.#disposed) {
      throw new EncodingEventStreamAlreadyDisposed({
        encoding: this.#encoding,
      });
    }
    this.#encoding.removeEventListener("start", this.#pushEvent);
    this.#encoding.removeEventListener("info", this.#pushEvent);
    this.#encoding.removeEventListener("progress", this.#pushEvent);
    this.#encoding.removeEventListener("end", this.#pushEvent);
    this.#encoding.removeEventListener("error", this.#pushEvent);
    this.#disposed = true;
    if (this.#pullQueue.length > 0) {
      const { resolve } = this.#pullQueue[0];
      this.#pullQueue.shift();
      resolve(null);
    }
  };

  async next(): Promise<IteratorResult<EncodingEvent>> {
    if (!this.#encodingProcess.pid) {
      throw new EncodingProcessNotStarted({
        encoding: this.#encoding,
      });
    }
    if (this.#done) {
      this.dispose();
      return {
        done: true,
        value: undefined,
      };
    }

    const event: EncodingEvent | null = await this.#pullEvent();
    if (!event) {
      return {
        done: true,
        value: undefined,
      };
    }

    if (event.type === "end" || event.type === "error") {
      this.#done = true;
    }

    return {
      done: false,
      value: event,
    };
  }

  #pushEvent = (event: EncodingEvent): void => {
    if (this.#pullQueue.length > 0) {
      const { resolve } = this.#pullQueue.shift() as PullQueueItem;
      resolve(event);
    } else {
      this.#pushQueue.push(event);
    }
  };

  #pullEvent = (): Promise<EncodingEvent | null> => {
    return new Promise<EncodingEvent | null>(
      (resolve: Resolver<EncodingEvent | null>, reject: Reject) => {
        if (this.#pushQueue.length > 0) {
          const event: EncodingEvent | null = this.#pushQueue[0];
          this.#pushQueue.shift();
          resolve(event);
        } else {
          this.#pullQueue.push({ resolve, reject });
        }
      },
    );
  };
}
