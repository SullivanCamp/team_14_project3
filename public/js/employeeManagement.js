// From W3 Schools
function SearchFunction() {
  // Declare variables
  var input, filter, table, tr, td, i, txtValue;
  input = document.getElementById("Search");
  filter = input.value.toUpperCase();
  table = document.getElementById("employee-table");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[1];
    if (td) {
      txtValue = td.textContent;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.visibility = "visible"; // same as below
      } else {
        tr[i].style.visibility = "collapse"; // changed from display none to collapse to keep table layout
      }
    }
  }
}

function openEditForm(button) {
    const editForm = document.querySelector('.edit');
    editForm.style.display = 'block';

    const id = button.getAttribute('data-id');
    const firstName = button.getAttribute('data-first-name');
    const lastName = button.getAttribute('data-last-name');
    const position = button.getAttribute('data-position');
    const salary = button.getAttribute('data-salary');
    const password = button.getAttribute('data-password');

    document.getElementById('edit-header').innerText = "Edit Entry for Employee " + id;
    document.getElementById('edit-first-name').value = firstName;
    document.getElementById('edit-last-name').value = lastName;
    document.getElementById('edit-position').value = position;
    document.getElementById('edit-salary').value = salary;
    document.getElementById('edit-password').value = password;
}

function openAddForm() {
    const addForm = document.querySelector('.add');
    addForm.style.display = 'block';
}


function hideEditForm() {
    document.querySelector('.edit').style.display = 'none';
    document.getElementById('edit-header').innerText = "Edit Entry for Employee ";
    document.getElementById('edit-first-name').value = "";
    document.getElementById('edit-last-name').value = "";
    document.getElementById('edit-position').value = "";
    document.getElementById('edit-salary').value = "";
    document.getElementById('edit-password').value = "";
}

function hideAddForm() {
    document.querySelector('.add').style.display = 'none';
    document.getElementById('add-first-name').value = "";
    document.getElementById('add-last-name').value = "";
    document.getElementById('add-position').value = "Manager";
    document.getElementById('add-salary').value = "";
    document.getElementById('add-password').value = "";
}

function submitAdd() {
    const firstName = document.getElementById('add-first-name').value;
    const lastName = document.getElementById('add-last-name').value;
    const position = document.getElementById('add-position').value;
    const salary = document.getElementById('add-salary').value;
    const password = document.getElementById('add-password').value;



    const entry = {
        submissionType: "Add",
        employee: {
            first_name: firstName,
            last_name: lastName,
            access_level: position,
            pay_rate: salary,
            password: password
        }
    };

    fetch('/api/employees', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            hideAddForm();
            location.reload();
        } else {
            alert('Add failed');
        }
    })
    .catch(() => alert('Add failed'));
}


function submitEdits() {
    const id = document.getElementById('edit-header').innerText.split(" ")[4];
    const firstName = document.getElementById('edit-first-name').value;
    const lastName = document.getElementById('edit-last-name').value;
    const position = document.getElementById('edit-position').value;
    const salary = document.getElementById('edit-salary').value;
    const password = document.getElementById('edit-password').value;


    const entry = {
        submissionType: "Edit",
        employee: {
            employee_id: id,
            first_name: firstName,
            last_name: lastName,
            access_level: position,
            pay_rate: salary,
            password: password
        }
    };

    fetch('/api/employees', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            hideEditForm();
            location.reload();
        } else {
            alert('Update failed');
        }
    })
    .catch(() => alert('Update failed'));
}

function deleteEntry() {
    const id = document.getElementById('edit-header').innerText.split(" ")[4];

    const entry = {
        submissionType: "Delete",
        employee: {
            employee_id: id
        }
    };

    fetch('/api/employees', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            hideEditForm();
            location.reload();
        } else {
            alert('Delete failed');
        }
    })
    .catch(() => alert('Delete failed'));
}


