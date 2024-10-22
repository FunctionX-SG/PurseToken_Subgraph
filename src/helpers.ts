import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { ZERO_BI } from "./constants";

export function isSameDate(
  firstTimestamp: BigInt,
  secondTimestamp: BigInt
): bool {
  var firstDate = firstTimestamp.div(BigInt.fromI32(86400));
  var secondDate = secondTimestamp.div(BigInt.fromI32(86400));
  return firstDate == secondDate;
}

export function getDateString(timestamp: BigInt): string {
  return new Date(timestamp.toI64() * 1000).toDateString();
}

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (let i = ZERO_BI; i.lt(decimals); i = i.plus(BigInt.fromI32(1))) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return bd;
}

export function convertTokenToDecimal(
  tokenAmount: BigInt,
  exchangeDecimals: BigInt
): BigDecimal {
  if (exchangeDecimals.equals(ZERO_BI)) {
    return tokenAmount.toBigDecimal();
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals));
}
