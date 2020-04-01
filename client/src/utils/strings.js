import { concat, toUpper, head, tail } from "ramda";

export const capitalize = string => concat(toUpper(head(string)), tail(string));
export const placeholder = () => {};
