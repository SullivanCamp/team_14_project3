function openEditForm(button) {
    const editForm = document.querySelector('.edit');
    editForm.style.display = 'block';

    const id = button.getAttribute('data-id');
    const name = button.getAttribute('data-name');
    const current = button.getAttribute('data-current');
    const max = button.getAttribute('data-max');
    const units = button.getAttribute('data-units');
    const cost = button.getAttribute('data-cost');
    const category = button.getAttribute('data-category');

    document.getElementById('edit-header').innerText = "Edit Entry for Item " + id;
    document.getElementById('edit-name').value = name;
    document.getElementById('edit-current').value = current;
    document.getElementById('edit-max').value = max;
    document.getElementById('edit-units').value = units;
    document.getElementById('edit-cost').value = cost;
    document.getElementById('edit-category').value = category;
}

function openAddForm() {
    const addForm = document.querySelector('.add');
    addForm.style.display = 'block';
}


function hideEditForm() {
    document.querySelector('.edit').style.display = 'none';
    document.getElementById('edit-header').innerText = "Edit Entry for Item ";
    document.getElementById('edit-name').value = "";
    document.getElementById('edit-current').value = "";
    document.getElementById('edit-max').value = "";
    document.getElementById('edit-units').value = "";
    document.getElementById('edit-cost').value = "";
    document.getElementById('edit-category').value = "";
}

function hideAddForm() {
    document.querySelector('.add').style.display = 'none';
    document.getElementById('add-name').value = "";
    document.getElementById('add-current').value = "";
    document.getElementById('add-max').value = "";
    document.getElementById('add-units').value = "";
    document.getElementById('add-cost').value = "";
    document.getElementById('add-category').value = "";
}

function submitAdd() {
    const name = document.getElementById('add-name').value;
    const current = document.getElementById('add-current').value;
    const max = document.getElementById('add-max').value;
    const units = document.getElementById('add-units').value;
    const cost = document.getElementById('add-cost').value;
    const category = document.getElementById('add-category').value;



    const entry = {
        submissionType: "Add",
        item: {
            name: name,
            current: current,
            max: max,
            units: units,
            cost: cost,
            category: category
        }
    };

    fetch('/api/inventory', {
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
    const name = document.getElementById('edit-name').value;
    const current = document.getElementById('edit-current').value;
    const max = document.getElementById('edit-max').value;
    const units = document.getElementById('edit-units').value;
    const cost = document.getElementById('edit-cost').value;
    const category = document.getElementById('edit-category').value;


    const entry = {
        submissionType: "Edit",
        item: {
            itemId: id,
            name: name,
            current: current,
            max: max,
            units: units,
            cost: cost,
            category: category
        }
    };

    fetch('/api/inventory', {
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
        item: {
            itemId: id
        }
    };

    fetch('/api/inventory', {
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


