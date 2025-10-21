script.js
document.addEventListener("DOMContentLoaded", () => {
  // Load rooms
  const roomTable = document.getElementById("roomTable");
  if (roomTable) {
    fetch("php/get_rooms.php")
      .then(response => response.json())
      .then(data => {
        data.forEach(room => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${room.room_number}</td>
            <td>${room.type}</td>
            <td>${room.status}</td>
          `;
          roomTable.appendChild(row);
        });
      });
  }

  // Check-in Form
  const checkinForm = document.getElementById("checkinForm");
  if (checkinForm) {
    checkinForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(checkinForm);

      fetch("php/checkin.php", {
        method: "POST",
        body: formData
      }).then(res => res.text())
        .then(msg => {
          alert(msg);
          checkinForm.reset();
        });
    });
  }

  // Check-out Form
  const checkoutForm = document.getElementById("checkoutForm");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(checkoutForm);

      fetch("php/checkout.php", {
        method: "POST",
        body: formData
      }).then(res => res.text())
        .then(msg => {
          alert(msg);
          checkoutForm.reset();
        });
    });
  }
});

/* script for login */
document.getElementById("loginForm").onsubmit = function (e) {
                e.preventDefault();
                alert("Login checked (simulate backend)");
            };