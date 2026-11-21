const APP_CONFIG = {
    name: "LuckyVault",
    tagline: "Your Luck, Your Fortune.",
const CONTRACT_ADDRESS = "0x4c71c83b9BC22D8ecE2eD903AFb9310583669CDf";

networkId: 11155111,

const CONTRACT_ABI = [
  "function owner() view returns (address)",
  "function ticketPrice() view returns (uint256)",
  "function getPlayerCount() view returns (uint256)",
  "function getMyTickets(address) view returns (uint256)",
  "function getPrizePool() view returns (uint256)",
  "function buyTickets(uint256) payable",
  "function drawWinner()",
  "function roundNumber() view returns (uint256)",
  "function lastWinner() view returns (address)",
  "function lastPrize() view returns (uint256)",
  "event TicketPurchased(address indexed player, uint256 quantity, uint256 roundNumber)",
  "event WinnerSelected(address indexed winner, uint256 prize, uint256 roundNumber)"
];

let provider;
let signer;
let contract;
let userAddress;
let currentTicketPrice = 0n;

const connectBtn = document.getElementById("connectBtn");
const buyBtn = document.getElementById("buyBtn");
const drawBtn = document.getElementById("drawBtn");
const quantityInput = document.getElementById("quantity");
const statusText = document.getElementById("status");

function setStatus(message) {
    statusText.textContent = message;
}

function formatETH(value) {
    return Number(ethers.formatEther(value)).toFixed(5) + " ETH";
}

async function connectWallet() {
    try {
        if (!window.ethereum) {
            setStatus("MetaMask is not installed.");
            return;
        }

        connectBtn.disabled = true;
        setStatus("Connecting wallet...");

        provider = new ethers.BrowserProvider(window.ethereum);

        await provider.send("eth_requestAccounts", []);

        signer = await provider.getSigner();
        userAddress = await signer.getAddress();

        const network = await provider.getNetwork();

        if (Number(network.chainId) !== APP_CONFIG.networkId) {
            setStatus("Please switch to Ethereum Sepolia.");
            return;
        }

        contract = new ethers.Contract(
            APP_CONFIG.contractAddress,
            APP_CONFIG.abi,
            signer
        );

        connectBtn.textContent =
            userAddress.slice(0, 6) + "..." + userAddress.slice(-4);

        setStatus("Wallet connected successfully.");

        await refreshData();

    } catch (error) {
        console.error(error);
        setStatus(error.shortMessage || error.message);
    } finally {
        connectBtn.disabled = false;
    }
}

async function refreshData() {
    if (!contract || !userAddress) return;

    try {
        const [
            prizePool,
            playerCount,
            ticketPrice,
            myTickets,
            owner,
            winner,
            prize,
            round
        ] = await Promise.all([
            contract.getPrizePool(),
            contract.getPlayerCount(),
            contract.ticketPrice(),
            contract.getMyTickets(userAddress),
            contract.owner(),
            contract.lastWinner(),
            contract.lastPrize(),
            contract.roundNumber()
        ]);

        currentTicketPrice = ticketPrice;

        document.getElementById("prizePool").textContent =
            formatETH(prizePool);

        document.getElementById("playerCount").textContent =
            playerCount.toString();

        document.getElementById("ticketPrice").textContent =
            formatETH(ticketPrice);

        document.getElementById("myTickets").textContent =
            myTickets.toString();

        document.getElementById("lastWinner").textContent =
            winner === ethers.ZeroAddress ? "No winner yet" : winner;

        document.getElementById("lastPrize").textContent =
            formatETH(prize);

        document.getElementById("roundNumber").textContent =
            round.toString();

        const isOwner =
            owner.toLowerCase() === userAddress.toLowerCase();

        document.getElementById("ownerPanel").classList.toggle(
            "hidden",
            !isOwner
        );

        updateTotalPrice();

    } catch (error) {
        console.error(error);
        setStatus("Unable to load contract information.");
    }
}

function updateTotalPrice() {
    const quantity = Number(quantityInput.value);

    if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 20
    ) {
        document.getElementById("totalPrice").textContent =
            "Invalid quantity";
        return;
    }

    const total = currentTicketPrice * BigInt(quantity);

    document.getElementById("totalPrice").textContent =
        formatETH(total);
}

async function buyTickets() {
    try {
        if (!contract) {
            setStatus("Please connect your wallet first.");
            return;
        }

        const quantity = Number(quantityInput.value);

        if (
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > 20
        ) {
            setStatus("Select between 1 and 20 tickets.");
            return;
        }

        const totalPrice =
            currentTicketPrice * BigInt(quantity);

        buyBtn.disabled = true;

        setStatus("Waiting for transaction confirmation...");

        const transaction = await contract.buyTickets(quantity, {
            value: totalPrice
        });

        setStatus("Transaction submitted. Please wait...");

        await transaction.wait();

        setStatus("Tickets purchased successfully!");

        await refreshData();

    } catch (error) {
        console.error(error);
        setStatus(error.shortMessage || error.message);
    } finally {
        buyBtn.disabled = false;
    }
}

async function drawWinner() {
    try {
        if (!contract) {
            setStatus("Please connect your wallet first.");
            return;
        }

        const owner = await contract.owner();
        const playerCount = await contract.getPlayerCount();

        if (owner.toLowerCase() !== userAddress.toLowerCase()) {
            setStatus("Only the owner can draw a winner.");
            return;
        }

        if (playerCount === 0n) {
            setStatus("There are no tickets in this round.");
            return;
        }

        const confirmed = confirm(
            "Are you sure you want to draw a winner?"
        );

        if (!confirmed) {
            setStatus("Winner draw cancelled.");
            return;
        }

        drawBtn.disabled = true;

        setStatus("Drawing winner. Please wait...");

        const transaction = await contract.drawWinner();

        setStatus("Transaction submitted. Please wait...");

        await transaction.wait();

        setStatus("Winner selected successfully!");

        await refreshData();

    } catch (error) {
        console.error(error);
        setStatus(error.shortMessage || error.message);
    } finally {
        drawBtn.disabled = false;
    }
}

// Event Listeners

connectBtn.addEventListener("click", connectWallet);

buyBtn.addEventListener("click", buyTickets);

drawBtn.addEventListener("click", drawWinner);

quantityInput.addEventListener("input", updateTotalPrice);

// MetaMask Account Changes

if (window.ethereum) {
    window.ethereum.on("accountsChanged", function() {
        window.location.reload();
    });

    window.ethereum.on("chainChanged", function() {
        window.location.reload();
    });
}

// Initial Setup

updateTotalPrice();
