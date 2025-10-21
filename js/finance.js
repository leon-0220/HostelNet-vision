async function fetchData(action) {
  const res = await fetch(`finance_api.php?action=${action}`);
  return res.json();
}

// Payments
if (document.getElementById("paymentTable")) {
  fetchData("payments").then(data => {
    const tbody = document.getElementById("paymentTable");
    data.forEach(p => {
      tbody.innerHTML += `
        <tr>
          <td>${p.student_id}</td>
          <td>${p.name}</td>
          <td>RM ${p.amount}</td>
          <td>${p.payment_date}</td>
          <td><button>Edit</button></td>
        </tr>`;
    });
  });
}

// Outstanding
if (document.getElementById("outstandingTable")) {
  fetchData("outstanding").then(data => {
    const tbody = document.getElementById("outstandingTable");
    data.forEach(o => {
      tbody.innerHTML += `
        <tr>
          <td>${o.student_id}</td>
          <td>${o.name}</td>
          <td>RM ${o.outstanding}</td>
          <td><button>Mark Paid</button></td>
        </tr>`;
    });
  });
}

// Reports
if (document.getElementById("totalPayments")) {
  fetchData("reports").then(r => {
    document.getElementById("totalPayments").textContent = `RM ${r.totalPayments}`;
    document.getElementById("totalOutstanding").textContent = `RM ${r.totalOutstanding}`;
    document.getElementById("studentCount").textContent = r.studentCount;
  });
}