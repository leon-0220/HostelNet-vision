fetch('../students.php')
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector("#studentsTable tbody");
            data.forEach(s => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${s.id}</td>
                    <td>${s.name}</td>
                    <td>${s.room_no}</td>
                    <td>${s.course}</td>
                `;
                tbody.appendChild(row);
            });
        });