document.addEventListener("DOMContentLoaded", function() {
  fetch("php/room_get.php")
    .then(response => response.json())
    .then(data => {
      let tableBody = document.querySelector("#roomsTable tbody");
      tableBody.innerHTML = "";

      data.forEach(room => {
        let row = document.createElement("tr");

        row.innerHTML = `
          <td>${room.block}</td>
          <td>${room.room_no}</td>
          <td>${room.status}</td>
          <td>
            ${room.status === "Available" 
              ? `<a href="checkin.php?room_id=${room.id}" class="btn">Check-In</a>` 
              : `<span style="color: gray;">Not Available</span>`}
          </td>
        `;
        tableBody.appendChild(row);
      });
    })
    .catch(error => console.error("Error fetching rooms:", error));
});