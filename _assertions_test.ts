import { assertExpectError, assertInstanceOf } from "./_assertions.ts";
import { AssertionError, assertThrows } from "./dev_deps.ts";

class CustomError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "CustomError";
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

Deno.test({
  name: "assertInstanceOf",
  fn() {
    assertInstanceOf(new Date(), Date);
    assertInstanceOf(new Error(), Error);
    assertThrows(() => assertInstanceOf(null, Date), AssertionError);
    assertThrows(() => assertInstanceOf(undefined, Date), AssertionError);
    assertThrows(() => assertInstanceOf(Date, Date), AssertionError);
    assertThrows(() => assertInstanceOf(Error, Error), AssertionError);
    assertThrows(() => assertInstanceOf(new Date(), Error), AssertionError);
  },
});

Deno.test({
  name: "assertExpectError",
  fn() {
    assertExpectError(new Error());
    assertExpectError(new Error(), Error);
    assertExpectError(new CustomError(), Error);
    assertExpectError(new CustomError(), CustomError);
    assertThrows(() => assertExpectError(null, Date), AssertionError);
    assertThrows(() => assertExpectError(undefined, Date), AssertionError);
    assertThrows(() => assertExpectError(Date, Date), AssertionError);
    assertThrows(() => assertExpectError(Error, Error), AssertionError);
    assertThrows(() => assertExpectError(new Date(), Error), AssertionError);
    assertThrows(() => assertExpectError(new Error(), Date), AssertionError);
  },
});
