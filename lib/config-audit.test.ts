import { describe, expect, it } from "vitest";

import { auditBuildConfig, STRICT_CONFIG_FLAG } from "@/lib/config-audit";

/**
 * The audit is the one place that decides whether a build may ship, so what is
 * asserted here is the decision — configured, running on placeholders, or
 * refused — and not the wording around it.
 */

const MANIFEST = [
  "# A comment, and a blank line follow.",
  "",
  "NEXT_PUBLIC_SHOP_WHATSAPP_NUMBER=584121234567",
  "NEXT_PUBLIC_PAY_ZELLE_EMAIL=pagos@example.com",
  "NEXT_PUBLIC_PAY_ZELLE_ENABLED=true",
  "# Not a shop variable, so not part of the manifest:",
  "AZAHAR_STRICT_CONFIG=1",
].join("\n");

const CONFIGURED = {
  NEXT_PUBLIC_SHOP_WHATSAPP_NUMBER: "584129998888",
  NEXT_PUBLIC_PAY_ZELLE_EMAIL: "shop@azahar.test",
  NEXT_PUBLIC_PAY_ZELLE_ENABLED: "true",
};

describe("auditBuildConfig", () => {
  it("reads the manifest's NEXT_PUBLIC_ variables and ignores everything else", () => {
    const audit = auditBuildConfig(MANIFEST, CONFIGURED);

    expect(audit.documented).toEqual([
      "NEXT_PUBLIC_SHOP_WHATSAPP_NUMBER",
      "NEXT_PUBLIC_PAY_ZELLE_EMAIL",
      "NEXT_PUBLIC_PAY_ZELLE_ENABLED",
    ]);
  });

  it("passes a fully configured build", () => {
    expect(auditBuildConfig(MANIFEST, CONFIGURED).kind).toBe("configured");
  });

  it("reports the variables a build did not find", () => {
    const audit = auditBuildConfig(MANIFEST, {
      NEXT_PUBLIC_PAY_ZELLE_ENABLED: "true",
    });

    expect(audit.kind).toBe("placeholders");
    expect(audit.absent).toEqual([
      "NEXT_PUBLIC_SHOP_WHATSAPP_NUMBER",
      "NEXT_PUBLIC_PAY_ZELLE_EMAIL",
    ]);
  });

  // The distinction `lib/env` is built around: a shop with a Pay ID and no
  // wallet says so with an empty variable, and the audit must not call that
  // missing or a strict deploy could never ship one.
  it("treats a present-but-empty variable as answered", () => {
    const audit = auditBuildConfig(MANIFEST, {
      ...CONFIGURED,
      NEXT_PUBLIC_PAY_ZELLE_EMAIL: "",
    });

    expect(audit.kind).toBe("configured");
  });

  describe("strict mode", () => {
    it("refuses a build that would ship a placeholder", () => {
      const audit = auditBuildConfig(MANIFEST, {
        NEXT_PUBLIC_PAY_ZELLE_ENABLED: "true",
        [STRICT_CONFIG_FLAG]: "1",
      });

      expect(audit.kind).toBe("refused");
      expect(audit.absent).toEqual([
        "NEXT_PUBLIC_SHOP_WHATSAPP_NUMBER",
        "NEXT_PUBLIC_PAY_ZELLE_EMAIL",
      ]);
    });

    it("names every missing variable, so one build fixes them all", () => {
      const audit = auditBuildConfig(MANIFEST, { [STRICT_CONFIG_FLAG]: "1" });

      expect(audit.kind).toBe("refused");
      for (const name of audit.documented) {
        expect(audit.message).toContain(name);
      }
    });

    it("passes a fully configured build", () => {
      const audit = auditBuildConfig(MANIFEST, {
        ...CONFIGURED,
        [STRICT_CONFIG_FLAG]: "1",
      });

      expect(audit.kind).toBe("configured");
    });

    // Off is the default precisely so that a clone builds the demo shop, and
    // `npm run build` on a laptop must not start failing.
    it("is off when the flag is absent", () => {
      expect(auditBuildConfig(MANIFEST, {}).kind).toBe("placeholders");
    });

    it("accepts the same yes/no vocabulary as every other flag", () => {
      for (const on of ["1", "true", "yes", "si", "sí", "on"]) {
        expect(
          auditBuildConfig(MANIFEST, { [STRICT_CONFIG_FLAG]: on }).kind,
        ).toBe("refused");
      }
      for (const off of ["0", "false", "no", "off"]) {
        expect(
          auditBuildConfig(MANIFEST, { [STRICT_CONFIG_FLAG]: off }).kind,
        ).toBe("placeholders");
      }
    });

    // A flag nobody can read must not silently pick the permissive side: that
    // is the one reading that ships the bank account the gate exists to catch.
    it("refuses to guess at an unreadable flag", () => {
      expect(() =>
        auditBuildConfig(MANIFEST, { [STRICT_CONFIG_FLAG]: "maybe" }),
      ).toThrow(/AZAHAR_STRICT_CONFIG/);
    });
  });

  it("passes a build with nothing to check", () => {
    expect(auditBuildConfig("# no variables here\n", {}).kind).toBe(
      "configured",
    );
  });
});
