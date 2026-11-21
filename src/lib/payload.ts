import config from "@payload-config";
import { getPayload } from "payload";

/** The Payload local API for server components, actions and route handlers. */
export const getPayloadClient = () => getPayload({ config });
