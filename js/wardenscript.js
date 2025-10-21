// Fetch total students
        fetch('../students.php')
        .then(res => res.json())
        .then(students => {
            document.getElementById('totalStudents').innerText = students.length;
        });

        // Fetch complaints
        fetch('../complaints.php')
        .then(res => res.json())
        .then(complaints => {
            const pending = complaints.filter(c => c.status === 'pending').length;
            document.getElementById('pendingComplaints').innerText = pending;
        });

        // Fetch finance
        fetch('../finance.php')
        .then(res => res.json())
        .then(transactions => {
            const total = transactions
                .filter(t => t.type === 'payment')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            document.getElementById('totalIncome').innerText = total.toFixed(2);
        });