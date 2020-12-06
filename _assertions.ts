import { AssertionError, stripColor } from "./dev_deps.ts";

interface Constructor {
  // deno-lint-ignore no-explicit-any
  new (...args: any[]): any;
}

export function assertInstanceOf<T = unknown>(
  instance: T,
  expectedClass: Constructor,
  msg?: string,
): T {
  if (instance instanceof expectedClass) {
    return instance;
  }
  throw new AssertionError(
    `Expected instance to be instance of "${expectedClass.name}", but was "${(typeof instance ===
        "function"
      ? instance.constructor.name
      : typeof instance)}"${msg ? `: ${msg}` : "."}`,
  );
}

export function assertExpectError<T = unknown>(
  error: T,
  expectedErrorClass?: Constructor,
  msgIncludes = "",
  msg?: string,
): T {
  if (!(error instanceof Error)) {
    throw new AssertionError("A non-Error object was thrown.");
  }
  if (expectedErrorClass && !(error instanceof expectedErrorClass)) {
    throw new AssertionError(
      `Expected error to be instance of "${expectedErrorClass.name}", but was "${error.constructor.name}"${
        msg ? `: ${msg}` : "."
      }`,
    );
  }
  if (
    msgIncludes &&
    !stripColor(error.message).includes(stripColor(msgIncludes))
  ) {
    throw new AssertionError(
      `Expected error message to include "${msgIncludes}", but got "${error.message}"${
        msg ? `: ${msg}` : "."
      }`,
    );
  }

  return error;
}
