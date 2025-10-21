document.addEventListener("DOMContentLoaded", () => {
  // Ambil nama file sekarang
  const currentPage = window.location.pathname.split("/").pop();
  console.log("Current Page:", currentPage);

  // Cari semua link dalam sidebar
  document.querySelectorAll(".nav-link").forEach(link => {
    console.log("Checking link:", link.getAttribute("href"));
    if (link.getAttribute("href") === currentPage) {
        console.log("✅ Match found:", link.textContent);
        console.log("✅ Match found:", link.textContent);
      link.classList.add("active");
    }
  });
});