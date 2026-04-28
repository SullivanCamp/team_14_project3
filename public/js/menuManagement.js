let currentEditingMenuId = null;

// From W3 Schools
function SearchFunction() {
  // Declare variables
  var input, filter, table, tr, td, i, txtValue;
  input = document.getElementById("Search");
  filter = input.value.toUpperCase();
  table = document.getElementById("menu-table");
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
    const name = button.getAttribute('data-name');
    const price = button.getAttribute('data-price');
    const category = button.getAttribute('data-category')
    const description = button.getAttribute('data-description');

    document.getElementById('edit-header').innerText = "Edit Entry for Item " + id;
    document.getElementById('edit-name').value = name;
    document.getElementById('edit-price').value = price;
    document.getElementById('edit-category').value = category;
    document.getElementById('edit-description').value = description;
}

function openAddForm() {
    const addForm = document.querySelector('.add');
    addForm.style.display = 'block';
}


function hideEditForm() {
    document.querySelector('.edit').style.display = 'none';
    document.getElementById('edit-header').innerText = "Edit Entry for Item ";
    document.getElementById('edit-name').value = "";
    document.getElementById('edit-price').value = "";
    document.getElementById('edit-category').value = "";
    document.getElementById('edit-description').value = "";
}

function hideAddForm() {
    document.querySelector('.add').style.display = 'none';
    document.getElementById('add-name').value = "";
    document.getElementById('add-price').value = "";
    document.getElementById('add-category').value = "";
    document.getElementById('add-description').value = "";
}

function submitAdd() {
    const name = document.getElementById('add-name').value;
    const price = document.getElementById('add-price').value;
    const category = document.getElementById('add-category').value;
    const description = document.getElementById('add-description').value;



    const entry = {
        submissionType: "Add",
        item: {
            name: name,
            price: price,
            category: category,
            description: description
        }
    };

    fetch('/api/menuMgmt', {
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
    const price = document.getElementById('edit-price').value;
    const category = document.getElementById('edit-category').value;
    const description = document.getElementById('edit-description').value;


    const entry = {
        submissionType: "Edit",
        item: {
            itemId: id,
            name: name,
            price: price,
            category: category,
            description: description
        }
    };

    fetch('/api/menuMgmt', {
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

    fetch('/api/menuMgmt', {
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
            alert('Delete failed item '+ id);
        }
    })
    .catch(() => alert('Delete failed'));
}

function showRecipeForm() {
    const recipeform = document.querySelector('.recipe');
    recipeform.style.display = 'block';
    const id = document.getElementById('edit-header').innerText.split(" ")[4];
    currentEditingMenuId = id;
    filterRecipeTable(id);
}

function filterRecipeTable(id) {
    const rows = document.querySelectorAll('#ingredient-list tbody tr');
    
    // same as search function
    for (i = 0; i < rows.length; i++) {
        rowId = rows[i].getAttribute('data-menu-id');
        if (id == rowId) {
            rows[i].style.visibility = "visible"; 
        } else {
            rows[i].style.visibility = "collapse";
        }
    }
}

function hideRecipeForm() {
    document.querySelector('.recipe').style.display = 'none';
    const rows = document.querySelectorAll('#ingredient-list tbody tr');
    for (i = 0; i < rows.length; i++) {
        rows[i].style.visibility = "visible"; 
    }
    document.getElementById('ingredient-id').value = "";
    document.getElementById('ingredient-quantity').value = "";
}

function addIngredient() {
    const menuId = currentEditingMenuId;
    const inventoryId = document.getElementById('ingredient-id').value;
    const quantity = document.getElementById('ingredient-quantity').value;

    const entry = {
        submissionType: "AddIngredient",
        item: {
            menu_item_id: menuId,
            inventory_item_id: inventoryId,
            quantity_used: quantity
        }
    };

    fetch('/api/menuMgmt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            sessionStorage.setItem('reopenRecipe', menuId); // save before reload
            location.reload();
        } else {
            alert('Add ingredient failed');
        }
    })
    .catch(() => alert('Add ingredient failed'));
}

function deleteIngredient(button) {
    const inventoryId = button.getAttribute('data-id');
    const menuId = currentEditingMenuId;

    const entry = {
        submissionType: "DeleteIngredient",
        item: {
            menu_item_id: menuId,
            inventory_item_id: inventoryId
        }
    };

    fetch('/api/menuMgmt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            sessionStorage.setItem('reopenRecipe', menuId); // save before reload
            location.reload();
        } else {
            alert('Delete ingredient failed');
        }
    })
    .catch(() => alert('Delete ingredient failed'));
}

// to keep recipe form open on reload after adding/deleting ingredient
document.addEventListener('DOMContentLoaded', () => {
    const reopenId = sessionStorage.getItem('reopenRecipe');
    if (reopenId) {
        sessionStorage.removeItem('reopenRecipe');
        // Find the edit button for that menu item and open the forms
        const editButton = document.querySelector(`button[data-id="${reopenId}"]`);
        if (editButton) {
            openEditForm(editButton);
            currentEditingMenuId = reopenId;
            showRecipeForm();
        }
    }
});