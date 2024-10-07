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
  if (event.params._value.equals(ZERO_BI)) {
    return;
  }

  let farmPool = FarmPool.load(PURSE_BUSD_POOL_ADDRESS);
  let pursePrice = farmPool ? farmPool.pursePriceInUSD : ZERO_BD;

  let store = Store.load("1");
  let timestamp = event.block.timestamp;
  let currDeposit = event.params._value;

  if (!store) {
    store = new Store("1");
  }

  if (store.prevStakingTVL) {
    let prevStakingTVL = StakingTVLUpdate.load(store.prevStakingTVL!)!;
    if (isSameDate(prevStakingTVL.blockTimestamp, timestamp)) {
      prevStakingTVL.totalAmountLiquidity =
        prevStakingTVL.totalAmountLiquidity.plus(currDeposit);
      prevStakingTVL.totalLiquidityValueUSD = convertTokenToDecimal(
        prevStakingTVL.totalAmountLiquidity,
        PURSE_TOKEN_DECIMALS
      ).times(pursePrice);
      prevStakingTVL.save();
      return;
    } else {
      currDeposit = currDeposit.plus(prevStakingTVL.totalAmountLiquidity);
    }
  }

  let entity = new StakingTVLUpdate(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.totalAmountLiquidity = currDeposit;
  entity.totalLiquidityValueUSD = convertTokenToDecimal(
    entity.totalAmountLiquidity,
    PURSE_TOKEN_DECIMALS
  ).times(pursePrice);
  entity.blockTimestamp = timestamp;
  entity.save();
  store.prevStakingTVL = entity.id;

  store.save();
}

export function handleWithdrawLocked(event: WithdrawLockedStakeEvent): void {
  handleAnyWithdraw(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
    event.block.timestamp,
    event.params._value
  );
}

export function handleWithdrawUnlocked(
  event: WithdrawUnlockedStakeEvent
): void {
  handleAnyWithdraw(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
    event.block.timestamp,
    event.params._value
  );
}

function handleAnyWithdraw(
  eventId: Bytes,
  timestamp: BigInt,
  withdrawValue: BigInt
): void {
  if (withdrawValue.equals(ZERO_BI)) {
    return;
  }

  let farmPool = FarmPool.load(PURSE_BUSD_POOL_ADDRESS);
  let pursePrice = farmPool ? farmPool.pursePriceInUSD : ZERO_BD;

  let store = Store.load("1");
  let currDeposit = withdrawValue;

  if (!store) {
    store = new Store("1");
  }

  if (store.prevStakingTVL) {
    let prevStakingTVL = StakingTVLUpdate.load(store.prevStakingTVL!)!;
    if (isSameDate(prevStakingTVL.blockTimestamp, timestamp)) {
      prevStakingTVL.totalAmountLiquidity =
        prevStakingTVL.totalAmountLiquidity.minus(currDeposit);
      prevStakingTVL.totalLiquidityValueUSD = convertTokenToDecimal(
        prevStakingTVL.totalAmountLiquidity,
        PURSE_TOKEN_DECIMALS
      ).times(pursePrice);
      return;
    } else {
      currDeposit = prevStakingTVL.totalAmountLiquidity.minus(currDeposit);
    }
  }

  let entity = new StakingTVLUpdate(eventId);
  entity.totalAmountLiquidity = currDeposit;
  entity.totalLiquidityValueUSD = convertTokenToDecimal(
    entity.totalAmountLiquidity,
    PURSE_TOKEN_DECIMALS
  ).times(pursePrice);
  entity.blockTimestamp = timestamp;
  entity.save();
  store.prevStakingTVL = entity.id;

  store.save();
}
