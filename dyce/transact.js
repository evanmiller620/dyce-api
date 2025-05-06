import { ethers } from "ethers";
const window = globalThis;

const ERC20_ABI = [
    "function decimals() view returns (uint8)",
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address recipient, uint256 amount) returns (bool)",
    "function name() view returns (string)",
    "function version() view returns (string)"
];

const ERC2612_ABI = [
    "function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s) external",
    "function nonces(address owner) external view returns (uint)",
    "function DOMAIN_SEPARATOR() external view returns (bytes32)"
]

const ERC3009_ABI = [
    "function receiveWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external"
]

var provider;

export const connectWallet = () => {
    if (!window.ethereum) throw new Error("No wallet found!");
    provider = new ethers.BrowserProvider(window.ethereum);
}

export const getWalletAddress = async () => {
    if (!provider) throw new Error("Must connect to wallet first!");
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    return address;
}

export const approveLimit = async (address, amount, contractAddress) => {
    if (!provider) throw new Error("Must connect to wallet first!");
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, ERC20_ABI, signer);
    const decimals = await contract.decimals();
    const approveAmount = ethers.parseUnits(amount.toString(), decimals);
    const tx = await contract.approve(address, approveAmount);
    await tx.wait();
    return tx.hash;
}

export const permitLimit = async (address, amount, contractAddress) => {
    if (!provider) throw new Error("Must connect to wallet first!");
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, [...ERC20_ABI, ...ERC2612_ABI], signer);
    const decimals = await contract.decimals();
    const permitAmount = ethers.parseUnits(amount.toString(), decimals);

    const owner = await signer.getAddress();
    const nonces = await contract.nonces(owner);
    const chainId = (await provider.getNetwork()).chainId;

    const domain = {
        name: await contract.name(),
        version: await contract.version(),
        chainId: chainId,
        verifyingContract: contractAddress
    };

    const types = {
        Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ]
    };

    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const values = {
        owner: owner,
        spender: address,
        value: permitAmount,
        nonce: nonces,
        deadline: deadline,
    };

    const signature = await signer.signTypedData(domain, types, values);
    const { v, r, s } = ethers.Signature.from(signature);
    return { v, r, s, owner, spender: address, value: permitAmount.toString(), deadline: deadline.toString(), nonce: nonces.toString() };
}

export const receivePayment = async (address, amount, contractAddress) => {
    if (!provider) throw new Error("Must connect to wallet first!");
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, [...ERC20_ABI, ...ERC2612_ABI, ...ERC3009_ABI], signer);
    const decimals = await contract.decimals();
    const sendAmount = ethers.parseUnits(amount.toString(), decimals);

    const owner = await signer.getAddress();
    const nonce = ethers.hexlify(ethers.randomBytes(32));
    const chainId = (await provider.getNetwork()).chainId;

    const domain = {
        name: await contract.name(),
        version: await contract.version(),
        chainId: chainId,
        verifyingContract: contractAddress
    };

    const types = {
        ReceiveWithAuthorization: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "validAfter", type: "uint256" },
            { name: "validBefore", type: "uint256" },
            { name: "nonce", type: "bytes32" },
        ]
    };

    const validBefore = Math.floor(Date.now() / 1000) + 3600;
    const values = {
        from: owner,
        to: address,
        value: sendAmount,
        validAfter: 0,
        validBefore: validBefore,
        nonce: nonce,
    };

    const signature = await signer.signTypedData(domain, types, values);
    const { v, r, s } = ethers.Signature.from(signature);
    return { v, r, s, from: owner, to: address, value: sendAmount.toString(), validAfter: 0, validBefore: validBefore.toString(), nonce: nonce.toString() };
}

export const transferTokens = async (recipient, amount, contractAddress) => {
    if (!provider) throw new Error("Must connect to wallet first!");
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, ERC20_ABI, signer);
    const decimals = await contract.decimals();
    const transferAmount = ethers.parseUnits(amount.toString(), decimals);
    const tx = await contract.transfer(recipient, transferAmount);
    await tx.wait();
    return tx.hash;
};
