import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
export const LIQUIDITY_ADDR = "0xb59c7c1e2ec8eb460d12093ad1f21d7f7e8e2fef";

export const PURSE_BUSD_LP_TOKEN_TOTAL_SUPPLY = BigDecimal.fromString(
  "68510731650828592486805"
);

export const PURSE_TOKEN_DECIMALS: i32 = 18;
export const BUSD_TOKEN_DECIMALS: i32 = 18;

export const ZERO_BI = BigInt.fromI32(0);
export const ZERO_BD = BigDecimal.fromString("0");

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

export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (
    let i = ZERO_BI;
    i.lt(BigInt.fromI32(decimals));
    i = i.plus(BigInt.fromI32(1))
  ) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return bd;
}

export function convertTokenToDecimal(
  tokenAmount: BigInt,
  exchangeDecimals: i32
): BigDecimal {
  if (exchangeDecimals == 0) {
    return tokenAmount.toBigDecimal();
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals));
}
