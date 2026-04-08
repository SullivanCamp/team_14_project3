function openEditForm(button) {
    const editForm = document.querySelector('.edit');
    editForm.style.display = 'block';

    const id = button.getAttribute('data-id');
    const name = button.getAttribute('data-name');
    const current = button.getAttribute('data-current');
    const max = button.getAttribute('data-max');
    const units = button.getAttribute('data-units');
    const cost = button.getAttribute('data-cost');

    document.getElementById('edit-header').innerText = "Edit Entry for Item " + id;
    document.getElementById('edit-name').value = name;
    document.getElementById('edit-current').value = current;
    document.getElementById('edit-max').value = max;
    document.getElementById('edit-units').value = units;
    document.getElementById('edit-cost').value = cost;
}

function hideEditForm() {
    document.querySelector('.edit').style.display = 'none';
}