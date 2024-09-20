import { BigInt } from "@graphprotocol/graph-ts";

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
export const LIQUIDITY_ADDR = "0xb59c7c1e2ec8eb460d12093ad1f21d7f7e8e2fef";

export function isSameDate(
  firstTimestamp: BigInt,
  secondTimestamp: BigInt
): bool {
  var firstDate = new Date(firstTimestamp.toI64() * 1000);
  var secondDate = new Date(secondTimestamp.toI64() * 1000);
  return firstDate.toDateString() == secondDate.toDateString();
}
