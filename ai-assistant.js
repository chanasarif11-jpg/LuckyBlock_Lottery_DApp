
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const windowBox = document.getElementById("chatWindow");

  function addMessage(message, type) {
    const bubble = document.createElement("div");

    bubble.className = `chat-bubble ${type}`;
    bubble.textContent = message;

    windowBox.appendChild(bubble);
    windowBox.scrollTop = windowBox.scrollHeight;
  }

  function answer(question) {
    const q = question.toLowerCase();

    if (
      q.includes("wallet") ||
      q.includes("metamask") ||
      q.includes("connect")
    ) {
      return "Install and unlock MetaMask, click Connect Wallet, then approve the connection request in the wallet popup.";
    }

    if (
      q.includes("ticket") ||
      q.includes("buy") ||
      q.includes("purchase")
    ) {
      return "Connect your wallet, choose 1–20 tickets, review the total cost, and click Buy tickets. Confirm the transaction in MetaMask.";
    }

    if (q.includes("price") || q.includes("cost")) {
      return "The ticket price is read from the deployed smart contract. The total cost changes with the number of tickets you select.";
    }

    if (q.includes("winner") || q.includes("draw")) {
      return "In this educational contract, the contract owner triggers drawWinner(). The demonstration randomness is not secure enough for real-money use.";
    }

    if (q.includes("blockchain") || q.includes("transparent")) {
      return "The smart contract stores ticket entries on-chain. You can inspect confirmed transactions using the relevant network's block explorer.";
    }

    if (q.includes("address") || q.includes("contract")) {
      return "Paste your deployed Lottery contract address into CONTRACT_ADDRESS in app.js. Ensure the ABI matches the deployed contract.";
    }

    return "I can help with connecting MetaMask, buying tickets, ticket price, contract setup, and how the demo draw works.";
  }

  form.addEventListener("submit", event => {
    event.preventDefault();

    const question = input.value.trim();

    if (!question) return;

    addMessage(question, "user");
    input.value = "";

    window.setTimeout(() => {
      addMessage(answer(question), "bot");
    }, 250);
  });
});
