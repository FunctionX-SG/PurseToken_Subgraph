import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
export const LIQUIDITY_ADDR = "0xb59c7c1e2ec8eb460d12093ad1f21d7f7e8e2fef";
export const PURSE_FARM_ADDRESS = Address.fromHexString(
  "0x439ec8159740a9B9a579F286963Ac1C050aF31C8"
);
export const PURSE_BUSD_POOL_ADDRESS = Address.fromHexString(
  "0x081F4B87F223621B4B31cB7A727BB583586eAD98"
);

export const PURSE_STAKING_ADDRESS = Address.fromString(
  "0xFb1D31a3f51Fb9422c187492D8EA14921d6ea6aE"
);

export const ZERO_BD = BigDecimal.fromString("0");
export const ZERO_BI = BigInt.fromI32(0);
export const BI_18: BigInt = BigInt.fromI32(18);

export const PURSE_TOKEN_DECIMALS: BigInt = BI_18;
export const BUSD_TOKEN_DECIMALS: BigInt = BI_18;
