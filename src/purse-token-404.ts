import {
  Burn as BurnEvent,
  Transfer as TransferEvent,
} from "../generated/PurseToken404/PurseToken404";
import { Burn, Liquidity, Store } from "../generated/schema";
import { isSameDate, LIQUIDITY_ADDR, ZERO_BI } from "./helpers";

export function handleBurn(event: BurnEvent): void {
  if (event.params._value.equals(ZERO_BI)) {
    return;
  }

  let store = Store.load("1");
  let timestamp = event.block.timestamp;
  let currBurn = event.params._value;

  if (!store) {
    store = new Store("1");
  }

  if (store.prevBurn) {
    let prevBurn = Burn.load(store.prevBurn!)!;
    if (isSameDate(prevBurn.blocktimestamp, timestamp)) {
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
  entity.blocktimestamp = timestamp;
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
  if (event.params._value.equals(ZERO_BI)) {
    return;
  }

  let store = Store.load("1");
  let timestamp = event.block.timestamp;
  let liquidityDelta = event.params._value;

  if (!store) {
    store = new Store("1");
  }

  if (store.prevLiquidity) {
    let prevLiquidity = Liquidity.load(store.prevLiquidity!)!;
    if (isSameDate(prevLiquidity.blocktimestamp, timestamp)) {
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
  entity.blocktimestamp = timestamp;
  entity.save();
  store.prevLiquidity = entity.id;

  store.save();
}
