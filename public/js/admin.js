// public/js/admin.js
const ADMIN_SECRET = 'supersecret';

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
      if (!id) {
        alert('Error: Missing animal ID');
        return;
      }
    
      btn.disabled = true;
      btn.textContent = 'Updating...';
      
      try {
        const r = await fetch(`/api/admin/animals/${id}/adopt`, {
          method:'POST',
          headers: {
            'Content-Type':'application/json', 
            'x-admin-secret': ADMIN_SECRET
          }
        });
        
        const responseText = await r.text();
        let j;
        
        try {
          j = JSON.parse(responseText);
        } catch(parseErr) {
          console.error('Response was not JSON:', responseText);
          throw new Error('Server returned invalid response');
        }
        
        if (!r.ok) {
          throw new Error(j.error || 'Failed to update pet status');
        }
        
        const newStatus = j.adopted === true ? 'adopted' : 'available';
        alert(`Pet marked as ${newStatus}`);
        listAnimals();
      } catch(err) {
        alert('Error updating pet status: ' + err.message);
        console.error('Update error:', err);
        btn.disabled = false;
        listAnimals();
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  listAnimals();

  const form = document.getElementById('create-form');
  const toggleBtn = document.getElementById('toggle-animals-btn');
  const adminList = document.getElementById('admin-list');
  const clearBtn = document.getElementById('clear-form-btn');
  const thankYouMessage = document.getElementById('thank-you-message');

  // Clear form button functionality
  clearBtn.onclick = () => {
    form.reset();
    thankYouMessage.textContent = 'Thank you! Form has been cleared.';
    thankYouMessage.className = 'form-message success';
    thankYouMessage.style.display = 'block';
    
    // Hide message after 3 seconds
    setTimeout(() => {
      thankYouMessage.style.display = 'none';
    }, 3000);
  };

  //hide or show button functionality
  toggleBtn.onclick = () => {
    if (adminList.style.display === 'none') {
      adminList.style.display = '';
      toggleBtn.textContent = 'Hide';
    } else {
      adminList.style.display = 'none';
      toggleBtn.textContent = 'Show';
    }
  };

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
