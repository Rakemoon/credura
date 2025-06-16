import ERC20_ABI_JSON from "./ERC20_ABI.json";

export const ERC20_ABI = ERC20_ABI_JSON;
export const ERC20_CONTRACT_ADDRESS = "0x0334b9eb70B0De8f1e5F9a98B47CDDF6dA775E3B";

export const erc20Contract = {
  address: ERC20_CONTRACT_ADDRESS as `0x${string}`,
  abi: ERC20_ABI,
};
