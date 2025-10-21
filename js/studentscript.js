function toggleSidebar() {
  let sidebar = document.querySelector(".bg-dark");
  sidebar.classList.toggle("d-none");
}

document.addEventListener("DOMContentLoaded", function() {
  let notices = document.querySelectorAll(".card-body ul li");
  notices.forEach(item => {
    item.addEventListener("click", () => {
      alert("You clicked on: " + item.textContent);
    });
  });

  const currentPage = window.location.pathname.split("/").pop();
  document.querySelectorAll(".nav-link").forEach(link => {
  link.classList.remove("active"); // clear semua dulu

  if (link.getAttribute("href") === currentPage) {
    link.classList.add("active"); // ikut CSS yang Ayra define
  }
});

  loadStudents();
});

document.getElementById("add-student-form").addEventListener("submit", function(e){
  e.preventDefault();

  let formData = new FormData(this);

  fetch("php/student_add.php", {
    method: "POST",
    body: formData
  })
    .then(res => res.text())
    .then(data => {
      if(data === "success"){
        alert("Student added!");
        loadStudents();
      } else {          
        alert("Error: " + data);
      }
    });
});

function loadStudents(){
  fetch("php/student_get.php")
    .then(res => res.json())
    .then(data => {
        let tbody = document.querySelector("#students-table tbody");
        if(!tbody) return;

        tbody.innerHTML = "";
        data.forEach(s => {
          tbody.innerHTML += `
            <tr>
              <td>${s.id}</td>
              <td>${s.name}</td>
              <td>${s.room}</td>
              <td>${s.phone}</td>
              <td>${s.gender}</td>
              <td>
                <button class="btn btn-sm btn-warning">Edit</button> 
                <button class="btn btn-sm btn-danger">Delete</button>
              </td>
            </tr>
          `;
        });
      });
}