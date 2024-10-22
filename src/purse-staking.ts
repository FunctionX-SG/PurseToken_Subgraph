import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import { PurseStaking as PurseStakingContract } from "../generated/templates/FarmPoolContract/PurseStaking";
import { FarmPool, StakingTVLUpdate, Store } from "../generated/schema";
import { convertTokenToDecimal, isSameDate } from "./helpers";
import {
  PURSE_BUSD_POOL_ADDRESS,
  PURSE_STAKING_ADDRESS,
  PURSE_TOKEN_DECIMALS,
  ZERO_BD,
} from "./constants";

export function updateBalanceOf(eventId: Bytes, eventTimestamp: BigInt): void {
  const stakingContract = PurseStakingContract.bind(PURSE_STAKING_ADDRESS);

  const availablePurseSupplyResponse =
    stakingContract.try_availablePurseSupply();
  if (availablePurseSupplyResponse.reverted) {
    log.error(
      "try_availablePurseSupply call reverted. PURSE_STAKING_ADDRESS Address: {}",
      [PURSE_STAKING_ADDRESS.toHexString()]
    );
    return;
  }
  const availablePurseSupply = availablePurseSupplyResponse.value;
  handleStakingChange(eventId, eventTimestamp, availablePurseSupply);
}

export function handleStakingChange(
  eventId: Bytes,
  eventTimestamp: BigInt,
  newPurseAmount: BigInt
): void {
  const farmPool = FarmPool.load(PURSE_BUSD_POOL_ADDRESS);
  const pursePrice = farmPool ? farmPool.pursePriceInUSD : ZERO_BD;

  let store = Store.load("1");

  if (!store) {
    store = new Store("1");
  }

  if (store.prevStakingTVL) {
    const prevStakingTVL = StakingTVLUpdate.load(store.prevStakingTVL!)!;
    if (isSameDate(prevStakingTVL.blockTimestamp, eventTimestamp)) {
      prevStakingTVL.blockTimestamp = eventTimestamp;
      prevStakingTVL.totalAmountLiquidity = newPurseAmount;
      prevStakingTVL.totalLiquidityValueUSD = convertTokenToDecimal(
        prevStakingTVL.totalAmountLiquidity,
        PURSE_TOKEN_DECIMALS
      ).times(pursePrice);
      return;
    }
  }

  const entity = new StakingTVLUpdate(eventId);
  entity.blockTimestamp = eventTimestamp;
  entity.totalAmountLiquidity = newPurseAmount;
  entity.totalLiquidityValueUSD = convertTokenToDecimal(
    entity.totalAmountLiquidity,
    PURSE_TOKEN_DECIMALS
  ).times(pursePrice);
  entity.save();
  store.prevStakingTVL = entity.id;

  store.save();
}
