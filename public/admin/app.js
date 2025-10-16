const navButtons = document.querySelectorAll(".sidebar button[data-nav]");
const pages = document.querySelectorAll(".page");
const pageTitle = document.getElementById("page-title");

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".sidebar li").forEach(li=>li.classList.remove("active"));
    btn.parentElement.classList.add("active");
    const target = btn.dataset.nav;
    pages.forEach(p => p.id === target ? p.classList.remove("hidden") : p.classList.add("hidden"));
    pageTitle.textContent = btn.textContent.trim();
    if (target === "dashboard") loadSummary();
    if (target === "students") loadStudents();
    if (target === "allocate") loadAvailableRooms();
    if (target === "check") loadAllocations();
  });
});

// initial load
loadSummary();

// ---- fetch helpers ----
async function apiGet(path){ const r = await fetch(path); return r.json(); }
async function apiPost(path, body){ const r = await fetch(path, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); return r.json(); }

// ---- Dashboard ----
async function loadSummary(){
  try {
    const s = await apiGet("/api/summary");
    document.getElementById("totalStudents").textContent = s.totalStudents;
    document.getElementById("roomsAllocated").textContent = s.roomsAllocated;
    document.getElementById("checkedInNow").textContent = s.checkedInNow;
    document.getElementById("checkedOut").textContent = s.checkedOut;

    // recent activity: show latest allocations
    const students = await apiGet("/api/students");
    const tbody = document.querySelector("#recentTable tbody");
    tbody.innerHTML = "";
    students.filter(r => r.allocation_id).slice(0,8).forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.room_no || "-")}</td><td>${escapeHtml(r.semester || "-")}</td>`;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error(e);
  }
}

// ---- Students ----
async function loadStudents(){
  const rows = await apiGet("/api/students");
  const tbody = document.querySelector("#studentsTable tbody");
  tbody.innerHTML = "";
  rows.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${s.id}</td>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.student_no)}</td>
      <td>${escapeHtml(s.email || "")}</td>
      <td>${escapeHtml(s.registration_status || "pending")}</td>
      <td>
        ${s.registration_status === "pending" ? `<button data-id="${s.id}" class="approve">Approve</button>` : ""}
      </td>`;
    tbody.appendChild(tr);
  });

  // attach approve handlers
  document.querySelectorAll(".approve").forEach(b => {
    b.addEventListener("click", async () => {
      const id = b.dataset.id;
      await apiPost("/api/students/approve", { student_id: Number(id) });
      loadStudents();
      loadSummary();
    });
  });
}

// ---- Allocate ----
async function loadAvailableRooms(){
  // fill student id suggestions with students without allocation
  const students = await apiGet("/api/students");
  const freeStudents = students.filter(s => !s.allocation_id);
  const allocStudent = document.getElementById("allocStudentId");
  allocStudent.value = "";
  allocStudent.placeholder = freeStudents.length ? `e.g. ${freeStudents[0].id}` : "No free student";

  const rooms = await apiGet("/api/rooms/available");
  const roomSelect = document.getElementById("allocRoom");
  roomSelect.innerHTML = "";
  if (rooms.length === 0){
    const opt = document.createElement("option"); opt.value=""; opt.textContent="No available rooms"; roomSelect.appendChild(opt);
  } else {
    rooms.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = `${r.room_no} (${r.type})`;
      roomSelect.appendChild(opt);
    });
  }
}

document.getElementById("allocateForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const student_id = Number(document.getElementById("allocStudentId").value);
  const room_id = Number(document.getElementById("allocRoom").value);
  const semester = document.getElementById("allocSemester").value.trim();
  try {
    const res = await apiPost("/api/allocate", { student_id, room_id, semester });
    if (res.success){
      document.getElementById("allocMsg").textContent = "Allocated successfully.";
      loadAvailableRooms();
      loadStudents();
      loadSummary();
    } else {
      document.getElementById("allocMsg").textContent = "Error: " + (res.error || "unknown");
    }
  } catch (err) {
    document.getElementById("allocMsg").textContent = "Network error";
  }
});

// ---- Check-ins / Checkouts ----
async function loadAllocations(){
  // get students with allocation
  const students = await apiGet("/api/students");
  // we need allocation id and checkin status -> get checkins by joining via student/allocation in server returns these in students rows
  // For simplicity, call students and fetch checkins via students allocation
  const tbody = document.querySelector("#allocationsTable tbody");
  tbody.innerHTML = "";
  // fetch checkins table
  const rawCheckins = await fetch("/api/checkins").catch(()=>null);
  // but server doesn't provide /api/checkins - so we infer checkin per allocation by requesting allocations via students
  students.filter(s => s.allocation_id).forEach(s => {
    const allocId = s.allocation_id;
    // check checkin by calling /api/allocation-status? (not implemented) -> so we will show buttons to checkin (creates checkin) and show checkout if checkin exists (we'll attempt to create simple checkin flow)
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${allocId}</td>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.room_no || "-")}</td>
      <td>${escapeHtml(s.semester || "-")}</td>
      <td id="ci-${allocId}">-</td>
      <td id="co-${allocId}">-</td>
      <td>
        <button data-action="checkin" data-alloc="${allocId}">Check-In</button>
        <button data-action="checkout" data-alloc="${allocId}">Check-Out</button>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("button[data-action='checkin']").forEach(b=>{
    b.addEventListener("click", async ()=> {
      const alloc = b.dataset.alloc;
      const res = await apiPost("/api/checkin", { allocation_id: Number(alloc) });
      if (res.success){
        document.getElementById(`ci-${alloc}`).textContent = new Date(res.checkin_at).toLocaleString();
        loadSummary();
      } else {
        alert(res.error || "error");
      }
    });
  });

  tbody.querySelectorAll("button[data-action='checkout']").forEach(b=>{
    b.addEventListener("click", async ()=> {
      // naive: we need checkin id; simple approach: ask server to create checkout by allocation -> but server requires checkin_id
      // To keep things simple for this demo, we will attempt to lookup the latest checkin id by calling a small endpoint that isn't implemented.
      // Instead, for demo, prompt for checkin_id (admin can paste) — or you can implement a server endpoint to fetch checkin by allocation.
      const alloc = b.dataset.alloc;
      const checkin_id = prompt("Enter checkin_id to checkout (for demo):");
      if (!checkin_id) return;
      const res = await apiPost("/api/checkout", { checkin_id: Number(checkin_id) });
      if (res.success){
        document.getElementById(`co-${alloc}`).textContent = new Date(res.checkout_at).toLocaleString();
        loadSummary();
      } else {
        alert(res.error || "error");
      }
    });
  });
}

function escapeHtml(s){ if (s==null) return ""; return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

document.getElementById("logout").addEventListener("click",()=>location.reload());

document.querySelector('[data-nav="dashboard"]').click();
