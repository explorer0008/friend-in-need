function login(event) {
  event.preventDefault();
  window.location.href = "home.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const helpForm = document.getElementById('helpForm');
  const helpRequests = document.getElementById('helpRequests');

  if(helpForm) {
    helpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const type = document.getElementById('problemType').value;
      const location = document.getElementById('location').value;

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">Problem: ${type}</h5>
          <p class="card-text">Location: ${location}</p>
        </div>`;
      helpRequests.appendChild(card);
      helpForm.reset();
    });
  }
});
