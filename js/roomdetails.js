// Dummy data student
const studentsData = {
  "101": [
    { id: "S001", name: "Ali Ahmad", program: "Computer Science", year: "Year 1" },
    { id: "S002", name: "Nur Siti", program: "Business Admin", year: "Year 2" }
  ],
  "102": [
    { id: "S003", name: "Amirul Hakim", program: "Engineering", year: "Year 1" }
  ],
  "201": [
    { id: "S004", name: "Farah Lee", program: "Law", year: "Year 3" },
    { id: "S005", name: "Ravi Kumar", program: "Medicine", year: "Year 2" }
  ]
};

// Ambil room number dari URL
const urlParams = new URLSearchParams(window.location.search);
const roomNumber = urlParams.get("room");

// Tunjuk room title
document.getElementById("roomTitle").innerText = "Students in Room " + roomNumber;

// Cari student dalam bilik tu
const students = studentsData[roomNumber] || [];

// Masukkan ke dalam table
const tbody = document.querySelector("#studentsTable tbody");
if (students.length > 0) {
  students.forEach(student => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${student.id}</td>
      <td>${student.name}</td>
      <td>${student.program}</td>
      <td>${student.year}</td>
    `;
    tbody.appendChild(row);
  });
} else {
  // Kalau tak ada student
  const row = document.createElement("tr");
  row.innerHTML = `<td colspan="4">No students found in this room.</td>`;
  tbody.appendChild(row);
}