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

    document.getElementById('apply-form').onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        animalId: id,
        name: e.target.name.value,
        email: e.target.email.value,
        message: e.target.message.value
      };
      const r = await fetch('/api/apply', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
      const json = await r.json();
      alert(json.message || 'Application submitted');
      e.target.reset();
    };
  } catch(err){
    document.getElementById('pet-container').innerHTML = '<p>Pet not found.</p>';
  }
});
