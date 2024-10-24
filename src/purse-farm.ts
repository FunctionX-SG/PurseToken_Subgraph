import { AddNewPool as AddNewPoolEvent } from "../generated/PurseFarm/PurseFarm";
import { LpErc20 } from "../generated/PurseFarm/LpErc20";
import { FarmPool } from "../generated/schema";
import { Pool } from "../generated/templates";
import { BigInt, log } from "@graphprotocol/graph-ts";
import { BI_18, ZERO_BD, ZERO_BI } from "./constants";

export function handleAddPool(event: AddNewPoolEvent): void {
  Pool.create(event.params.lpToken);
  const farmPool = new FarmPool(event.params.lpToken);
  const lpToken = LpErc20.bind(event.params.lpToken);

  const decimalsResult = lpToken.try_decimals();
  if (!decimalsResult.reverted) {
    farmPool.lpDecimals = BigInt.fromI32(decimalsResult.value);
  } else {
    log.error("handleAddPool: try_decimals reverted for farmPool {}", [
      farmPool.id.toHexString(),
    ]);
    farmPool.lpDecimals = BI_18;
  }
  const totalSupplyResult = lpToken.try_totalSupply();
  if (!totalSupplyResult.reverted) {
    farmPool.lpTotalSupply = totalSupplyResult.value;
  } else {
    log.error("handleAddPool: try_totalSupply reverted for farmPool {}", [
      farmPool.id.toHexString(),
    ]);
    farmPool.lpTotalSupply = BigInt.fromI32(1);
  }

  farmPool.lpPriceInUSD = ZERO_BD;
  farmPool.pursePriceInUSD = ZERO_BD;
  farmPool.latestFarmBalanceOf = ZERO_BI;
  farmPool.latestFarmValue = ZERO_BD;
  farmPool.latestAPR = ZERO_BD;

  log.info(
    "farmPoolAdded: farmPool (id/lpToken address: {}) created on block number {}",
    [farmPool.id.toHexString(), event.block.number.toString()]
  );
  farmPool.save();
}
