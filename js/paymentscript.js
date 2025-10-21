// Payment form handling
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("paymentForm");
  const tableBody = document.getElementById("paymentTableBody");

  form.addEventListener("submit", function (e) {
    e.preventDefault(); // elak page reload

    // Ambil nilai input
    const studentName = document.getElementById("studentName").value;
    const roomNo = document.getElementById("roomNo").value;
    const amount = document.getElementById("amount").value;
    const method = document.getElementById("paymentMethod").value;

    // Buat row baru
    const newRow = document.createElement("tr");

    newRow.innerHTML = `
      <td>${studentName}</td>
      <td>${roomNo}</td>
      <td>${amount}</td>
      <td>${method}</td>
      <td>Paid</td>
    `;

    // Masukkan dalam table
    tableBody.appendChild(newRow);

    // Reset form
    form.reset();

    alert("Payment submitted successfully!");
  });
});