// public/js/admin.js
const ADMIN_SECRET = 'supersecret'; // demo only — change or supply via prompt/header in real use

async function listAnimals(){
  const res = await fetch('/api/animals');
  const items = await res.json();
  const container = document.getElementById('admin-list');
  container.innerHTML = '';
  items.forEach(a=>{
    const card = document.createElement('div');
    card.className = 'card';
    const photo = a.photo || 'https://via.placeholder.com/400x300?text=Pet';
    card.innerHTML = `
      <img src="${photo}" alt="${a.name}">
      <h4>${a.name} ${a.adopted ? '(Adopted)' : ''}</h4>
      <p>${a.breed || ''} • ${a.age || ''}</p>
      <div>
        <button class="btn adopt-btn" data-id="${a._id}">${a.adopted ? 'Mark Available' : 'Mark Adopted'}</button>
      </div>
    `;
    container.appendChild(card);
  });

  document.querySelectorAll('.adopt-btn').forEach(btn=>{
    btn.onclick = async () => {
      const id = btn.dataset.id;
      // Toggle adopted state via server (here we only mark true)
      const r = await fetch(`/api/admin/animals/${id}/adopt`, {
        method:'POST',
        headers: {'Content-Type':'application/json', 'x-admin-secret': ADMIN_SECRET}
      });
      const j = await r.json();
      alert('Updated');
      listAnimals();
    }
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  listAnimals();

  const form = document.getElementById('create-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const res = await fetch('/api/admin/animals', {
      method:'POST',
      headers: { 'x-admin-secret': ADMIN_SECRET },
      body: fd
    });
    const json = await res.json();
    alert('Created: ' + (json.name || 'ok'));
    form.reset();
    listAnimals();
  };
});
