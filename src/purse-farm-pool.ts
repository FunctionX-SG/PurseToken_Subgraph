import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  LpErc20 as LpErc20Contract,
  Sync as SyncEvent,
} from "../generated/PurseFarm/LpErc20";
import { PurseFarm as PurseFarmContract } from "../generated/PurseFarm/PurseFarm";
import { FarmPool, FarmTVLUpdate, Store } from "../generated/schema";
import {
  BUSD_TOKEN_DECIMALS,
  PURSE_FARM_ADDRESS,
  PURSE_TOKEN_DECIMALS,
  ZERO_BD,
} from "./constants";
import { updateBalanceOf } from "./purse-staking";
import { convertTokenToDecimal, isSameDate } from "./helpers";

export function handleSync(event: SyncEvent): void {
  const farmPoolAddress = event.address;
  const farmPool = FarmPool.load(farmPoolAddress)!;
  const lpContract = LpErc20Contract.bind(farmPoolAddress);

  farmPool.purseReserves = convertTokenToDecimal(
    event.params.reserve0,
    PURSE_TOKEN_DECIMALS
  );

  farmPool.busdReserves = convertTokenToDecimal(
    event.params.reserve1,
    BUSD_TOKEN_DECIMALS
  );

  const lpTotalSupplyResponse = lpContract.try_totalSupply();
  if (lpTotalSupplyResponse.reverted) {
    log.error(
      "try_totalSupply call reverted. LP Address: {}, PURSE_FARM_ADDRESS: {}",
      [event.address.toHexString(), PURSE_FARM_ADDRESS.toHexString()]
    );
    return;
  }
  farmPool.lpTotalSupply = lpTotalSupplyResponse.value;

  farmPool.pursePriceInUSD = farmPool.purseReserves!.notEqual(ZERO_BD)
    ? farmPool.busdReserves!.div(farmPool.purseReserves!)
    : ZERO_BD;

  const poolTVL = farmPool
    .purseReserves!.times(farmPool.pursePriceInUSD)
    .plus(farmPool.busdReserves!);

  farmPool.lpPriceInUSD = poolTVL.div(
    convertTokenToDecimal(farmPool.lpTotalSupply, farmPool.lpDecimals)
  );

  const farmBalanceOfResponse = lpContract.try_balanceOf(
    Address.fromBytes(PURSE_FARM_ADDRESS)
  );
  if (farmBalanceOfResponse.reverted) {
    log.error(
      "try_balanceOf call reverted. LP Address: {}, PURSE_FARM_ADDRESS: {}",
      [event.address.toHexString(), PURSE_FARM_ADDRESS.toHexString()]
    );
    return;
  }
  const farmBalanceOf = farmBalanceOfResponse.value;
  const farmBalanceDelta = farmBalanceOf.minus(farmPool.latestFarmBalanceOf);

  const newFarmValue = convertTokenToDecimal(
    farmBalanceOf,
    farmPool.lpDecimals
  ).times(farmPool.lpPriceInUSD);
  const farmValueDelta = newFarmValue.minus(farmPool.latestFarmValue);

  farmPool.latestFarmBalanceOf = farmBalanceOf;
  farmPool.latestFarmValue = newFarmValue;
  farmPool.save();

  handleFarmTransfer(event, farmBalanceDelta, farmValueDelta);
  updateBalanceOf(
    event.transaction.hash.concatI32(event.logIndex.toI32()).concatI32(0),
    event.block.timestamp
  );
  updateAPR(farmPoolAddress);
}

function handleFarmTransfer(
  event: ethereum.Event,
  balanceDelta: BigInt,
  valueDelta: BigDecimal
): void {
  let store = Store.load("1");
  const timestamp = event.block.timestamp;

  if (!store) {
    store = new Store("1");
  }

  if (store.prevFarmTVL) {
    const prevFarmTVL = FarmTVLUpdate.load(store.prevFarmTVL!)!;
    if (isSameDate(prevFarmTVL.blockTimestamp, timestamp)) {
      prevFarmTVL.blockTimestamp = timestamp;
      prevFarmTVL.totalAmountLiquidity =
        prevFarmTVL.totalAmountLiquidity.plus(balanceDelta);
      prevFarmTVL.totalLiquidityValueUSD =
        prevFarmTVL.totalLiquidityValueUSD.plus(valueDelta);
      prevFarmTVL.save();
      return;
    } else {
      balanceDelta = prevFarmTVL.totalAmountLiquidity.plus(balanceDelta);
      valueDelta = prevFarmTVL.totalLiquidityValueUSD.plus(valueDelta);
    }
  }

  const entity = new FarmTVLUpdate(
    event.transaction.hash.concatI32(event.logIndex.toI32()).concatI32(1)
  );
  entity.totalAmountLiquidity = balanceDelta;
  entity.totalLiquidityValueUSD = valueDelta;
  entity.blockTimestamp = timestamp;
  entity.save();
  store.prevFarmTVL = entity.id;

  store.save();
}

function updateAPR(farmPoolAddress: Address): void {
  const farmPool = FarmPool.load(farmPoolAddress)!;
  if (farmPool.latestFarmValue.equals(ZERO_BD)) {
    return;
  }

  const farmContract = PurseFarmContract.bind(PURSE_FARM_ADDRESS);
  const poolInfoResponse = farmContract.try_poolInfo(farmPoolAddress);
  if (poolInfoResponse.reverted) {
    log.error(
      "try_poolInfo call reverted. PURSE_FARM_ADDRESS: {}, FARM_POOL_ADDRESS: {}",
      [PURSE_FARM_ADDRESS.toHexString(), farmPoolAddress.toHexString()]
    );
    return;
  }

  const poolInfo = poolInfoResponse.value;
  const bonusMultiplier = poolInfo.getBonusMultiplier().toBigDecimal();
  const pursePerBlock = convertTokenToDecimal(
    poolInfo.getPursePerBlock(),
    PURSE_TOKEN_DECIMALS
  );

  farmPool.latestAPR = BigInt.fromU64(28000 * 365 * 100)
    .toBigDecimal()
    .times(pursePerBlock)
    .times(bonusMultiplier)
    .times(farmPool.pursePriceInUSD)
    .div(farmPool.latestFarmValue);

  farmPool.save();
}
