import { describe, expect, it } from "vitest";

import { deviceLayoutFromHeaders } from "./device";

describe("deviceLayoutFromHeaders", () => {
    it("prefers the mobile client hint", () => {
        const headers = new Headers({
            "sec-ch-ua-mobile": "?1",
            "user-agent": "Mozilla/5.0 (X11; Linux x86_64)",
        });

        expect(deviceLayoutFromHeaders(headers)).toBe("mobile");
    });

    it("prefers the desktop client hint", () => {
        const headers = new Headers({
            "sec-ch-ua-mobile": "?0",
            "user-agent": "Mozilla/5.0 (Linux; Android 15; Mobile)",
        });

        expect(deviceLayoutFromHeaders(headers)).toBe("desktop");
    });

    it("falls back to mobile user-agent detection", () => {
        const headers = new Headers({ "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" });

        expect(deviceLayoutFromHeaders(headers)).toBe("mobile");
    });

    it("defaults unknown clients to desktop", () => {
        expect(deviceLayoutFromHeaders(new Headers())).toBe("desktop");
    });
});
