import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
} from "../generated/PurseFarm/PurseFarm";
import { Bundle, FarmTVLUpdate, Store } from "../generated/schema";
import { isSameDate, ZERO_BD, ZERO_BI } from "./helpers";

export function handleDeposit(event: DepositEvent): void {
  if (event.params.amount.equals(ZERO_BI)) {
    return;
  }

  let bundle = Bundle.load("1");
  let lpPrice = bundle ? bundle.lpPriceInUSD : ZERO_BD;

  let store = Store.load("1");
  let timestamp = event.block.timestamp;
  let currDeposit = event.params.amount;

  if (!store) {
    store = new Store("1");
  }

  if (store.prevFarmTVL) {
    let prevFarmTVL = FarmTVLUpdate.load(store.prevFarmTVL!)!;
    if (isSameDate(prevFarmTVL.blocktimestamp, timestamp)) {
      prevFarmTVL.totalAmountLiquidity =
        prevFarmTVL.totalAmountLiquidity.plus(currDeposit);
      prevFarmTVL.totalLiquidityValueUSD = prevFarmTVL.totalAmountLiquidity
        .toBigDecimal()
        .times(lpPrice);
      return;
    } else {
      currDeposit = currDeposit.plus(prevFarmTVL.totalAmountLiquidity);
    }
  }

  let entity = new FarmTVLUpdate(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.totalAmountLiquidity = currDeposit;
  entity.totalLiquidityValueUSD = entity.totalAmountLiquidity
    .toBigDecimal()
    .times(lpPrice);
  entity.blocktimestamp = timestamp;
  entity.save();
  store.prevFarmTVL = entity.id;

  store.save();
}

export function handleWithdraw(event: WithdrawEvent): void {
  if (event.params.amount.equals(ZERO_BI)) {
    return;
  }

  let bundle = Bundle.load("1");
  let lpPrice = bundle ? bundle.lpPriceInUSD : ZERO_BD;

  let store = Store.load("1");
  let timestamp = event.block.timestamp;
  let currDeposit = event.params.amount;

  if (!store) {
    store = new Store("1");
  }

  if (store.prevFarmTVL) {
    let prevFarmTVL = FarmTVLUpdate.load(store.prevFarmTVL!)!;
    if (isSameDate(prevFarmTVL.blocktimestamp, timestamp)) {
      prevFarmTVL.totalAmountLiquidity =
        prevFarmTVL.totalAmountLiquidity.minus(currDeposit);
      prevFarmTVL.totalLiquidityValueUSD = prevFarmTVL.totalAmountLiquidity
        .toBigDecimal()
        .times(lpPrice);
      prevFarmTVL.save();
      return;
    } else {
      currDeposit = prevFarmTVL.totalAmountLiquidity.minus(currDeposit);
    }
  }

  let entity = new FarmTVLUpdate(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.totalAmountLiquidity = currDeposit;
  entity.totalLiquidityValueUSD = entity.totalAmountLiquidity
    .toBigDecimal()
    .times(lpPrice);
  entity.blocktimestamp = timestamp;
  entity.save();
  store.prevFarmTVL = entity.id;

  store.save();
}
