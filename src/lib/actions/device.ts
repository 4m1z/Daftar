import { query } from "@solidjs/router";
import { getRequestEvent } from "@solidjs/web";

import { deviceLayoutFromHeaders } from "~/lib/utils/device";

export const getDeviceLayout = query(() => {
    "use server";
    const headers = getRequestEvent()?.request.headers ?? new Headers();
    return deviceLayoutFromHeaders(headers);
}, "device-layout");
