import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseTeamId } from "../src/figma/files.ts";

describe("parseTeamId", () => {
  it("extracts id from /team/:id URL", () => {
    assert.equal(
      parseTeamId("https://www.figma.com/files/team/1234567890/MyTeam"),
      "1234567890",
    );
  });

  it("extracts id from URL with trailing slash", () => {
    assert.equal(
      parseTeamId("https://figma.com/files/team/42/"),
      "42",
    );
  });

  it("accepts bare numeric id", () => {
    assert.equal(parseTeamId("987654321"), "987654321");
  });

  it("trims whitespace", () => {
    assert.equal(parseTeamId("  555  "), "555");
  });

  it("rejects garbage", () => {
    assert.throws(() => parseTeamId("not a url"));
    assert.throws(() => parseTeamId("https://figma.com/file/abc/Foo"));
  });
});
