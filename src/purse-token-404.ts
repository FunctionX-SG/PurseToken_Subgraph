import { BigInt } from "@graphprotocol/graph-ts";
import {
  Burn as BurnEvent,
  Transfer as TransferEvent,
} from "../generated/PurseToken404/PurseToken404";
import { Burn, Liquidity, Store } from "../generated/schema";
import { getDateString, isSameDate, LIQUIDITY_ADDR } from "./helpers";

export function handleBurn(event: BurnEvent): void {
  if (event.params._value.equals(BigInt.fromI32(0))) {
    return;
  }

  let store = Store.load("1");
  let timeStamp = event.block.timestamp;
  let currBurn = event.params._value;

  if (!store) {
    store = new Store("1");
  }

  if (store.prevBurn) {
    let prevBurn = Burn.load(store.prevBurn!)!;
    if (isSameDate(prevBurn.blockTimestamp, timeStamp)) {
      prevBurn.totalAmountBurned = prevBurn.totalAmountBurned.plus(currBurn);
      prevBurn.save();
      return;
    } else {
      currBurn = currBurn.plus(prevBurn.totalAmountBurned);
    }
  }

  let entity = new Burn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.totalAmountBurned = currBurn;
  entity.blockTimestamp = timeStamp;
  entity.save();
  store.prevBurn = entity.id;

  store.save();
}

export function handleTransfer(event: TransferEvent): void {
  if (event.params._to.toHexString() == LIQUIDITY_ADDR.toLowerCase()) {
    handleLiquidity(event);
  }
}

function handleLiquidity(event: TransferEvent): void {
  if (event.params._value.equals(BigInt.fromI32(0))) {
    return;
  }

  let store = Store.load("1");
  let timeStamp = event.block.timestamp;
  let liquidityDelta = event.params._value;

  if (!store) {
    store = new Store("1");
  }

  if (store.prevLiquidity) {
    let prevLiquidity = Liquidity.load(store.prevLiquidity!)!;
    if (isSameDate(prevLiquidity.blockTimestamp, timeStamp)) {
      prevLiquidity.totalAmountLiquidity =
        prevLiquidity.totalAmountLiquidity.plus(liquidityDelta);
      prevLiquidity.save();
      return;
    } else {
      liquidityDelta = liquidityDelta.plus(prevLiquidity.totalAmountLiquidity);
    }
  }

  let entity = new Liquidity(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.totalAmountLiquidity = liquidityDelta;
  entity.blockTimestamp = timeStamp;
  entity.save();
  store.prevLiquidity = entity.id;

  store.save();
}
