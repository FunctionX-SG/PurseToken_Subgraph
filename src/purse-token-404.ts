import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import {
  Burn as BurnEvent,
  Transfer as TransferEvent,
} from "../generated/PurseToken404/PurseToken404";
import { Burn, Liquidity, Store } from "../generated/schema";
import { ADDRESS_ZERO, isSameDate, LIQUIDITY_ADDR } from "./helpers";

export function handleBurn(event: BurnEvent): void {
  if (event.params._value.equals(BigInt.fromI32(0))) {
    return;
  }

  let store = Store.load("1");
  let accBurn = event.params._value;
  if (!store) {
    store = new Store("1");
  } else if (store.accBurned) {
    accBurn = accBurn.plus(store.accBurned!);
  }
  store.accBurned = accBurn;

  if (
    !store.prevBurnDate ||
    isSameDate(store.prevBurnDate!, event.block.timestamp)
  ) {
    store.prevBurnDate = event.block.timestamp;
    store.save();
    return;
  }

  let entity = new Burn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.totalAmountBurned = accBurn;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = store.prevBurnDate!;
  entity.transactionHash = event.transaction.hash;
  entity.save();

  store.prevBurnDate = event.block.timestamp;
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
  let accLiquidity = event.params._value;
  if (!store) {
    store = new Store("1");
  } else if (store.accLiquidity) {
    accLiquidity = accLiquidity.plus(store.accLiquidity!);
  }
  store.accLiquidity = accLiquidity;

  if (
    !store.prevLiquidityDate ||
    isSameDate(store.prevLiquidityDate!, event.block.timestamp)
  ) {
    store.prevLiquidityDate = event.block.timestamp;
    store.save();
    return;
  }

  let entity = new Liquidity(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.totalAmountLiquidity = accLiquidity;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = store.prevLiquidityDate!;
  entity.transactionHash = event.transaction.hash;
  entity.save();

  store.prevLiquidityDate = event.block.timestamp;
  store.save();
}
