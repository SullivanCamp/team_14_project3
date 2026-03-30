const cards = document.querySelectorAll(".drink-card");
const plusButtons = document.querySelectorAll(".plus-btn");
const modal = document.getElementById("drinkModal");
const closeModal = document.getElementById("closeModal");

const modalTitle = document.getElementById("modalTitle");
const modalPrice = document.getElementById("modalPrice");
const modalDescription = document.getElementById("modalDescription");
const modalImage = document.getElementById("modalImage");

const tabButtons = document.querySelectorAll(".tab-btn");
const popularSection = document.getElementById("popularSection");
const newSection = document.getElementById("newSection");

function openDrinkModal(card)
{
  const name = card.dataset.name;
  const price = card.dataset.price;
  const description = card.dataset.description;
  const image = card.dataset.image;

  modalTitle.textContent = name;
  modalPrice.textContent = `$${Number(price).toFixed(2)}`;
  modalDescription.textContent = description;
  modalImage.textContent = image;

  modal.classList.remove("hidden");
}

cards.forEach((card) => 
    {
  card.addEventListener("click", () => {
    openDrinkModal(card);
  });
});

plusButtons.forEach((button) => 
{
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const card = button.closest(".drink-card");
    openDrinkModal(card);
  });
});

closeModal.addEventListener("click", () => 
{
  modal.classList.add("hidden");
});

modal.addEventListener("click", (event) =>
{
  if (event.target === modal) {
    modal.classList.add("hidden");
  }
});

document.addEventListener("keydown", (event) => 
{
  if (event.key === "Escape") {
    modal.classList.add("hidden");
  }
});

tabButtons.forEach((button) => 
{
  button.addEventListener("click", () => 
{
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    const category = button.dataset.category;

    if (category === "popular") 
    {
      popularSection.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (category === "new") 
    {
      newSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});