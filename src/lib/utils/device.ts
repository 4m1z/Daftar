export type DeviceLayout = "mobile" | "desktop";

const MOBILE_USER_AGENT = /Android|iPhone|iPad|iPod|IEMobile|Mobile|Opera Mini/i;

export function deviceLayoutFromHeaders(headers: Headers): DeviceLayout {
    const clientHint = headers.get("sec-ch-ua-mobile");
    if (clientHint === "?1") return "mobile";
    if (clientHint === "?0") return "desktop";

    return MOBILE_USER_AGENT.test(headers.get("user-agent") ?? "") ? "mobile" : "desktop";
}
