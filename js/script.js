document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".sidebar li");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      const target = tab.getAttribute("data-tab");
      document.getElementById(target).classList.add("active");
    });
  });

  // Modal open/close (contoh)
  const overlay = document.getElementById("modal-overlay");
  const modals = document.querySelectorAll(".modal");
  const closeButtons = document.querySelectorAll(".close-modal");

  function openModal(id) {
    document.getElementById(id).style.display = "block";
    overlay.style.display = "block";
  }

  function closeModal() {
    modals.forEach(m => m.style.display = "none");
    overlay.style.display = "none";
  }

  closeButtons.forEach(btn => btn.addEventListener("click", closeModal));
  overlay.addEventListener("click", closeModal);

  // Example: open add student modal
  document.getElementById("add-student-btn")?.addEventListener("click", () => {
    openModal("add-student-modal");
  });
});