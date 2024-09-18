import { Address, log } from "@graphprotocol/graph-ts";
import {
  Burn as BurnEvent,
  Transfer as TransferEvent,
} from "../generated/PurseToken404/PurseToken404";
import { Burn, Liquidity, Store } from "../generated/schema";
import { ADDRESS_ZERO, LIQUIDITY_ADDR } from "./helpers";

export function handleBurn(event: BurnEvent): void {
  let entity = new Burn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );

  let store = Store.load("1");
  let accBurn = event.params._value;
  if (!store) {
    store = new Store("1");
  } else if (store.lastBurn) {
    let prevEvent = Burn.load(store.lastBurn!);
    if (prevEvent) {
      accBurn = accBurn.plus(prevEvent.totalAmountBurned);
    }
  }

  entity.totalAmountBurned = accBurn;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  store.lastBurn = entity.id;
  store.save();
  entity.save();
}

export function handleTransfer(event: TransferEvent): void {
  if (event.params._to.toHexString() == LIQUIDITY_ADDR.toLowerCase()) {
    handleLiquidityEvent(event);
  }
}

function handleLiquidityEvent(event: TransferEvent): void {
  let entity = new Liquidity(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );

  let store = Store.load("1");
  let accLiquidity = event.params._value;
  if (!store) {
    store = new Store("1");
  } else if (store.lastLiquidity) {
    let prevEvent = Liquidity.load(store.lastLiquidity!);
    if (prevEvent) {
      accLiquidity = accLiquidity.plus(prevEvent.totalAmountLiquidity);
    }
  }

  entity.totalAmountLiquidity = accLiquidity;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  store.lastLiquidity = entity.id;
  store.save();
  entity.save();
}
