function showDashboard(role){
  document.querySelectorAll('.role-dashboard').forEach(d => d.style.display='none');
  switch(role){
    case 'student': document.getElementById('studentDashboard').style.display='block'; break;
    case 'warden': document.getElementById('wardenDashboard').style.display='block'; break;
    case 'finance': document.getElementById('financeDashboard').style.display='block'; break;
    case 'maintenance': document.getElementById('maintenanceDashboard').style.display='block'; break;
    case 'admin': document.getElementById('adminDashboard').style.display='block'; break;
  }
}

function setupSidebar(role){
  document.querySelectorAll('.sidebar li').forEach(li=>{
    const roles = li.getAttribute('data-role');
    if(roles && !roles.split(',').includes(role)) li.style.display='none';
    else li.style.display='block';
  });
}

fetch('/api/getUserRole')
  .then(res => res.json())
  .then(data => {
    const userRole = data.role; // role dari backend
    showDashboard(userRole);
    setupSidebar(userRole);
    populateTables(userRole);
  });

function populateTables(){
  if(userRole==='warden' || userRole==='admin'){
    const tbody = document.querySelector(userRole==='warden' ? '#warden-students-table tbody':'#admin-students-table tbody');
    tbody.innerHTML = `<tr><td>1</td><td>Ali</td><td>101</td></tr><tr><td>2</td><td>Siti</td><td>102</td></tr>`;
  }
  if(userRole==='finance' || userRole==='admin'){
    const tbody = document.querySelector(userRole==='finance'?'#finance-payments-table tbody':'#admin-payments-table tbody');
    tbody.innerHTML = `<tr><td>R001</td><td>Ali</td><td>200</td><td>Pending</td></tr>`;
  }
  if(userRole==='maintenance' || userRole==='admin'){
    const tbody = document.querySelector(userRole==='maintenance'?'#maintenance-complaints-table tbody':'#admin-complaints-table tbody');
    tbody.innerHTML = `<tr><td>C001</td><td>Ali</td><td>Leakage</td><td>Pending</td></tr>`;
  }
}

// Initialize
showDashboard(userRole);
setupSidebar(userRole);
populateTables();