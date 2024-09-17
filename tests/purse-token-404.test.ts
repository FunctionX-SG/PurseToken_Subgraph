import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
} from "matchstick-as/assembly/index";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { handleTransfer20 } from "../src/purse-token-404";
import { createTransfer1Event } from "./purse-token-404-utils";
import { ADDRESS_ZERO } from "../src/helpers";

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Burn events", () => {
  beforeAll(() => {
    let from = Address.fromString("0x0000000000000000000000000000000000000001");
    let to = Address.fromString("0x0000000000000000000000000000000000000001");
    let value = BigInt.fromI32(234);
    let newTransferEvent = createTransfer1Event(from, to, value);
    handleTransfer20(newTransferEvent);
  });

  afterAll(() => {
    clearStore();
  });

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("Burn created and stored only if to zero address", () => {
    assert.entityCount("Burn", 0);

    let from = Address.fromString("0x0000000000000000000000000000000000000002");
    let to = Address.fromString(ADDRESS_ZERO);
    let value = BigInt.fromI32(345);
    let newTransferEvent = createTransfer1Event(from, to, value);
    handleTransfer20(newTransferEvent);

    assert.entityCount("Burn", 1);
    let id = newTransferEvent.transaction.hash.concatI32(
      newTransferEvent.logIndex.toI32()
    );
    assert.fieldEquals("Burn", id.toString(), "totalAmountBurned", "value");

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  });
});
