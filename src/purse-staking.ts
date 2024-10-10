import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  Deposit as DepositEvent,
  WithdrawLockedStake as WithdrawLockedStakeEvent,
  WithdrawUnlockedStake as WithdrawUnlockedStakeEvent,
} from "../generated/PurseStaking/PurseStaking";
import { FarmPool, StakingTVLUpdate, Store } from "../generated/schema";
import {
  convertTokenToDecimal,
  isSameDate,
  PURSE_BUSD_POOL_ADDRESS,
  PURSE_TOKEN_DECIMALS,
  ZERO_BD,
  ZERO_BI,
} from "./helpers";

export function handleDeposit(event: DepositEvent): void {
  handleStakingChange(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
    event.block.timestamp,
    event.params._value
  );
}

export function handleWithdrawLocked(event: WithdrawLockedStakeEvent): void {
  handleStakingChange(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
    event.block.timestamp,
    event.params._value.neg()
  );
}

export function handleWithdrawUnlocked(
  event: WithdrawUnlockedStakeEvent
): void {
  handleStakingChange(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
    event.block.timestamp,
    event.params._value.neg()
  );
}

function handleStakingChange(
  eventId: Bytes,
  timestamp: BigInt,
  delta: BigInt
): void {
  if (delta.equals(ZERO_BI)) {
    return;
  }

  const farmPool = FarmPool.load(PURSE_BUSD_POOL_ADDRESS);
  const pursePrice = farmPool ? farmPool.pursePriceInUSD : ZERO_BD;

  let store = Store.load("1");

  if (!store) {
    store = new Store("1");
  }

  if (store.prevStakingTVL) {
    const prevStakingTVL = StakingTVLUpdate.load(store.prevStakingTVL!)!;
    if (isSameDate(prevStakingTVL.blockTimestamp, timestamp)) {
      prevStakingTVL.totalAmountLiquidity =
        prevStakingTVL.totalAmountLiquidity.plus(delta);
      prevStakingTVL.totalLiquidityValueUSD = convertTokenToDecimal(
        prevStakingTVL.totalAmountLiquidity,
        PURSE_TOKEN_DECIMALS
      ).times(pursePrice);
      return;
    } else {
      delta = prevStakingTVL.totalAmountLiquidity.plus(delta);
    }
  }

  const entity = new StakingTVLUpdate(eventId);
  entity.totalAmountLiquidity = delta;
  entity.totalLiquidityValueUSD = convertTokenToDecimal(
    entity.totalAmountLiquidity,
    PURSE_TOKEN_DECIMALS
  ).times(pursePrice);
  entity.blockTimestamp = timestamp;
  entity.save();
  store.prevStakingTVL = entity.id;

  store.save();
}
