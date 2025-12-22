// public/js/adopt.js
function getQueryId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function fetchAnimal(id){
  const res = await fetch('/api/animals/' + id);
  if(!res.ok) throw new Error('Not found');
  return res.json();
}

document.addEventListener('DOMContentLoaded', async ()=>{
  const id = getQueryId();
  if(!id) { document.getElementById('pet-container').innerHTML = '<p>No pet specified.</p>'; return; }
  try {
    const pet = await fetchAnimal(id);
    document.getElementById('pet-name').textContent = pet.name;
    document.getElementById('pet-meta').textContent = `${pet.type} • ${pet.breed || ''} • ${pet.age || ''} • ${pet.size || ''}`;
    document.getElementById('pet-desc').textContent = pet.description || '';
    document.getElementById('pet-photo').src = pet.photo || 'https://via.placeholder.com/600x400?text=Pet';

    const adoptionSection = document.getElementById('adoption-section');
    const applyForm = document.getElementById('apply-form');
    
    // Check if pet is already adopted
    if (pet.adopted) {
      if (adoptionSection) {
        adoptionSection.innerHTML = `
          <h3>Adoption Status</h3>
          <p class="adopted-message">Already adopted by someone else</p>
        `;
      }
    }

    document.getElementById('apply-form').onsubmit = async (e) => {
      // Prevent submission if already adopted
      if (pet.adopted) {
        e.preventDefault();
        alert('This pet has already been adopted by someone else.');
        return;
      }
      e.preventDefault();

      let user = null;
      try {
        const stored = window.localStorage.getItem('petRescueUser');
        if (stored) {
          user = JSON.parse(stored);
        }
      } catch (_) {
        user = null;
      }

      // If not logged in, send to login page
      if (!user) {
        window.location.href = 'login.html';
        return;
      }

      const optionalMessage = window.prompt('Add a note for your adoption application (optional):', '');
      const message = optionalMessage ? optionalMessage.trim() : '';

      const data = {
        animalId: id,
        userId: user.id,
        name: user.name,
        email: user.email,
        message
      };

      const r = await fetch('/api/apply', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });
      const json = await r.json();
      alert(json.message || 'Application submitted');
    };
  } catch(err){
    document.getElementById('pet-container').innerHTML = '<p>Pet not found.</p>';
  }
});
