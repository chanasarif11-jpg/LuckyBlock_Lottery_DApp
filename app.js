
const CONTRACT_ADDRESS = "0x4c71c83b9BC22D8ecE2eD903AFb9310583669CDf";

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
let account;
let contractOwner;

const $ = id => document.getElementById(id);

function setMessage(message, error = false) {
  $("lotteryMessage").textContent = message;
  $("lotteryMessage").style.color = error ? "#ef8888" : "var(--muted)";
}

function validContractAddress() {
  return ethers.isAddress(CONTRACT_ADDRESS);
}

async function connectWallet() {
  if (!window.ethereum) {
    setMessage("MetaMask was not detected. Please install MetaMask.", true);
    return;
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);

    await provider.send("eth_requestAccounts", []);

    signer = await provider.getSigner();
    account = await signer.getAddress();

    $("connectWallet").textContent =
      `${account.slice(0, 6)}...${account.slice(-4)}`;

    const network = await provider.getNetwork();

    $("networkLabel").textContent =
      `Chain ID: ${network.chainId.toString()}`;

    if (!validContractAddress()) {
      setMessage("Invalid contract address.", true);
      return;
    }

    contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );

    await refreshData();

    setMessage("Wallet connected successfully.");
  } catch (error) {
    setMessage(
      error.shortMessage || error.message || "Wallet connection failed.",
      true
    );
  }
}

async function refreshData() {
  if (!contract || !account) return;

  try {
    const [
      pool,
      count,
      price,
      tickets,
      owner,
      winner,
      prize,
      round
    ] = await Promise.all([
      contract.getPrizePool(),
      contract.getPlayerCount(),
      contract.ticketPrice(),
      contract.getMyTickets(account),
      contract.owner(),
      contract.lastWinner(),
      contract.lastPrize(),
      contract.roundNumber()
    ]);

    contractOwner = owner;

    $("prizePool").textContent =
      `${Number(ethers.formatEther(pool)).toFixed(4)} ETH`;

    $("playerCount").textContent = count.toString();

    $("ticketPrice").textContent =
      `${ethers.formatEther(price)} ETH`;

    $("myTickets").textContent = tickets.toString();

    $("currentRound").textContent = round.toString();

    $("winnerAddress").textContent =
      winner === ethers.ZeroAddress ? "No winner yet" : winner;

    $("winnerPrize").textContent =
      winner === ethers.ZeroAddress
        ? "0 ETH"
        : `${ethers.formatEther(prize)} ETH`;

    const isOwner =
      account.toLowerCase() === owner.toLowerCase();

    $("drawSection").style.display =
      isOwner ? "block" : "none";

    $("drawWinner").disabled =
      !isOwner || count === 0n;

    $("drawWinner").textContent =
      count === 0n ? "No Tickets to Draw" : "Draw Winner";

    updateTotal();

  } catch (error) {
    setMessage(
      error.shortMessage || error.message ||
      "Could not load lottery information.",
      true
    );
  }
}

function quantity() {
  const value = Number($("ticketQuantity").value);

  return Number.isInteger(value)
    ? Math.min(20, Math.max(1, value))
    : 1;
}

function updateTotal() {
  const q = quantity();

  $("ticketQuantity").value = q;

  const priceText =
    $("ticketPrice").textContent.split(" ")[0];

  let price = Number(priceText);

  if (!Number.isFinite(price)) price = 0.001;

  $("totalCost").textContent =
    `${(price * q).toFixed(6)} ETH`;
}

async function buyTickets() {
  if (!account || !contract) {
    return setMessage("Connect your wallet first.", true);
  }

  try {
    const q = quantity();
    const price = await contract.ticketPrice();

    const tx = await contract.buyTickets(q, {
      value: price * BigInt(q)
    });

    setMessage("Purchase submitted. Waiting for confirmation...");

    await tx.wait();

    setMessage("Tickets purchased successfully!");

    await refreshData();

  } catch (error) {
    setMessage(
      error.shortMessage || error.reason ||
      error.message || "Ticket purchase failed.",
      true
    );
  }
}

async function drawWinner() {
  if (!account || !contract) {
    return setMessage("Connect your wallet first.", true);
  }

  try {
    const owner = await contract.owner();

    if (account.toLowerCase() !== owner.toLowerCase()) {
      return setMessage(
        "Only the contract owner can draw the winner.",
        true
      );
    }

    const count = await contract.getPlayerCount();

    if (count === 0n) {
      return setMessage("No tickets have been purchased yet.", true);
    }

    $("drawWinner").disabled = true;
    $("drawWinner").textContent = "Drawing winner...";

    setMessage("Drawing winner. Confirm the transaction in MetaMask...");

    const tx = await contract.drawWinner();

    setMessage("Transaction submitted. Waiting for confirmation...");

    await tx.wait();

    await refreshData();

    setMessage("Winner successfully selected!");

  } catch (error) {
    setMessage(
      error.shortMessage || error.reason ||
      error.message || "Winner selection failed.",
      true
    );

    await refreshData();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("connectWallet").addEventListener("click", connectWallet);

  $("buyTickets").addEventListener("click", buyTickets);

  $("drawWinner").addEventListener("click", drawWinner);

  $("refreshData").addEventListener("click", refreshData);

  $("minusTicket").addEventListener("click", () => {
    $("ticketQuantity").value = quantity() - 1;
    updateTotal();
  });

  $("plusTicket").addEventListener("click", () => {
    $("ticketQuantity").value = quantity() + 1;
    updateTotal();
  });

  $("ticketQuantity").addEventListener("input", updateTotal);

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", () => {
      window.location.reload();
    });

    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });
  }

  updateTotal();
});
