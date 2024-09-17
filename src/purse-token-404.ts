import { Transfer1 as Transfer20Event } from "../generated/PurseToken404/PurseToken404";
import { Burn, Store } from "../generated/schema";
import { ADDRESS_ZERO } from "./helpers";

export function handleBurn(event: Transfer20Event): void {
  let entity = new Burn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );

  let store = Store.load("1");
  let accBurn = event.params.amount;
  if (!store) {
    store = new Store("1");
  } else {
    let prevEvent = Burn.load(store.lastBurn);
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

export function handleTransfer20(event: Transfer20Event): void {
  if (event.params.to.toHexString() == ADDRESS_ZERO) {
    handleBurn(event);
  }
}
