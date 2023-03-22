/* eslint-env node, mocha */

import { Contract } from "@ethersproject/contracts";

export const createStrain = (contract: Contract, times: number) =>
  contract.createStrain(times);

export const setOperator = (
  contract: Contract,
  strainOwner: string,
  operator: string,
  isApproved = true
) => contract.setApprovalForAll(operator, isApproved, { from: strainOwner });

export const getEventFromResult = (result: any, eventName: string) => {
  const event = result.logs.find((log: any) => log.event === eventName);
  return event.args;
};

export const zeroAddress = "0x0000000000000000000000000000000000000000";
