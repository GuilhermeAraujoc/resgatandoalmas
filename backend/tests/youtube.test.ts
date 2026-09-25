import { test } from "node:test";
import assert from "node:assert/strict";
import { youtubeVideoSchema } from "../src/validation/youtube.js";

test("YouTube links normalize to the video ID before storage", () => {
  const id = "dQw4w9WgXcQ";
  for (const value of [id, ` https://www.youtube.com/watch?v=${id}&t=42s `,
    `https://youtu.be/${id}?si=share`, `youtu.be/${id}`,
    `https://youtube.com/shorts/${id}?feature=share`,
    `https://m.youtube.com/watch?v=${id}`, `https://music.youtube.com/watch?v=${id}`,
    `https://www.youtube.com/embed/${id}`, `https://youtube.com/live/${id}`]) {
    assert.equal(youtubeVideoSchema.parse(value), id, value);
  }
  assert.equal(youtubeVideoSchema.parse("  "), "");
});

test("Rejects non-video links, invalid IDs and misleading hosts", () => {
  for (const value of ["https://youtube.com/playlist?list=abc", "https://youtube.com/@channel",
    "https://youtu.be/short", "https://youtube.com/watch?v=abcdefghijk123",
    "https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ",
    "https://evil.test/watch?v=dQw4w9WgXcQ", "https://youtube.com@evil.test/watch?v=dQw4w9WgXcQ",
    "javascript:alert(1)", "https://youtu.be/dQw4w9WgXcQ/extra"]) {
    assert.equal(youtubeVideoSchema.safeParse(value).success, false, value);
  }
});
