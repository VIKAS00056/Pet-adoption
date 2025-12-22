// public/js/app.js
async function fetchAnimals(){
  try{
    const res = await fetch('/api/animals');
    const data = await res.json();
    return data;
  } catch(e){ console.error(e); return []; }
}

function renderGrid(items){
  const grid = document.querySelectorAll('#animal-grid');
  if(!grid.length) return;
  grid.forEach(g => {
    g.innerHTML = '';
    items.forEach(a=>{
      const card = document.createElement('div');
      card.className = 'card';
      const photo = a.photo || 'https://via.placeholder.com/400x300?text=Pet';
      card.innerHTML = `
        <img src="${photo}" alt="${a.name}">
        <h4>${a.name} <small>(${a.type})</small></h4>
        <p>${a.breed || ''}</p>
        <p>${a.age || ''} • ${a.size || ''}</p>
        <a class="btn" href="/pet.html?id=${a._id}">View profile</a>
      `;
      g.appendChild(card);
    });
  });
}

document.addEventListener('DOMContentLoaded', async ()=>{
  const animals = await fetchAnimals();
  // show featured on home (first 6)
  renderGrid(animals.slice(0,6));

  // adopt page filters:
  const buttons = document.querySelectorAll('.filters button');
  if(buttons.length){
    const full = animals;
    buttons.forEach(b=>{
      b.onclick = ()=> {
        const type = b.dataset.type;
        if(type === 'all') renderGrid(full);
        else renderGrid(full.filter(x=> x.type === type));
      }
    });
    renderGrid(full);
  }
});
