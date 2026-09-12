import { customAlphabet } from "nanoid";

// 10 chars, URL-safe, easy to read, impossible to guess sequentially
const nanoidPublic = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 10);

export function generatePublicId(): string {
  return nanoidPublic();
}

const nanoidOrder = customAlphabet("0123456789", 6);

export function generateOrderNumber(): string {
  return `VC-${nanoidOrder()}`;
}
