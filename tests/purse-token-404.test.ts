import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
} from "matchstick-as/assembly/index";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { handleBurn, handleTransfer } from "../src/purse-token-404";
import { createTransferEvent } from "./purse-token-404-utils";
import { ADDRESS_ZERO, LIQUIDITY_ADDR } from "../src/helpers";

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Transfer events", () => {
  beforeAll(() => {
    let from = Address.fromString("0x0000000000000000000000000000000000000001");
    let to = Address.fromString("0x0000000000000000000000000000000000000001");
    let value = BigInt.fromI32(234);
    let newTransferEvent = createTransferEvent(from, to, value);
    handleTransfer(newTransferEvent);
  });

  afterAll(() => {
    clearStore();
  });

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("Liquidity created and stored only if to zero address", () => {
    assert.entityCount("Liquidity", 0);

    let from = Address.fromString("0x0000000000000000000000000000000000000002");
    let to = Address.fromString(LIQUIDITY_ADDR);
    let value = BigInt.fromI32(345);
    let newTransferEvent = createTransferEvent(from, to, value);
    handleTransfer(newTransferEvent);

    assert.entityCount("Liquidity", 1);
    let id = newTransferEvent.transaction.hash.concatI32(
      newTransferEvent.logIndex.toI32()
    );
    assert.fieldEquals(
      "Liquidity",
      id.toString(),
      "totalAmountLiquidity",
      "345"
    );

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  });
});
