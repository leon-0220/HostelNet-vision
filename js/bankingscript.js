let balance = 5000.0;

// Handle login
document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (username === "user" && password === "1234") {
    document.getElementById("loginPage").classList.remove("active");
    document.getElementById("dashboardPage").classList.add("active");
    document.getElementById("userDisplay").innerText = username;
  } else {
    alert("Invalid username or password!");
  }
});

// Show payment page
function showPaymentPage() {
  document.getElementById("dashboardPage").classList.remove("active");
  document.getElementById("paymentPage").classList.add("active");
}

// Back to dashboard
function backToDashboard() {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById("dashboardPage").classList.add("active");
}

// Logout
function logout() {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById("loginPage").classList.add("active");
}

// Handle payment
document.getElementById("paymentForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const accountNo = document.getElementById("accountNo").value;
  const amount = parseFloat(document.getElementById("amount").value);

  if (amount > balance) {
    alert("Insufficient balance!");
    return;
  }

  balance -= amount;
  document.getElementById("balance").innerText = balance.toFixed(2);

  // Add to history
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${accountNo}</td>
    <td>${amount.toFixed(2)}</td>
    <td>Successful</td>
  `;
  document.getElementById("historyTableBody").appendChild(row);

  alert("Payment successful!");
  document.getElementById("paymentForm").reset();
  backToDashboard();
});