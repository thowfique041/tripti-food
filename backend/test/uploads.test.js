import test from "node:test";
import assert from "node:assert/strict";
import { verifiedImageExtension } from "../src/services/cloudinary.js";

test("validates image content instead of trusting the browser MIME type", () => {
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(verifiedImageExtension(png, "image/png"), "png");
  assert.throws(() => verifiedImageExtension(Buffer.from("not an image"), "image/png"), /বৈধ/);
});
