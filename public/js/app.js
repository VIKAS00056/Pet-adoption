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
      const adoptedBadge = a.adopted ? '<span class="adopted-badge">Already Adopted</span>' : '';
      card.innerHTML = `
        <img src="${photo}" alt="${a.name}">
        <h4>${a.name} <small>(${a.type})</small></h4>
        ${adoptedBadge}
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

  // Feedback form handling
  const feedbackForm = document.getElementById('feedback-form');
  if (feedbackForm) {
    const feedbackMessage = document.getElementById('feedback-message');
    
    feedbackForm.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(feedbackForm);
      const email = formData.get('email')?.trim();
      
      // Validate email
      if (email && typeof validateEmail === 'function') {
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
          feedbackMessage.textContent = emailValidation.message;
          feedbackMessage.className = 'form-message error';
          return;
        }
      }
      
      const data = {
        name: formData.get('name'),
        email: email,
        message: formData.get('message'),
      };

      // Disable submit button
      const submitBtn = feedbackForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await res.json();

        if (res.ok) {
          feedbackMessage.textContent = result.message || 'Thank you for your feedback!';
          feedbackMessage.className = 'form-message success';
          feedbackForm.reset();
        } else {
          feedbackMessage.textContent = result.error || 'Failed to submit feedback. Please try again.';
          feedbackMessage.className = 'form-message error';
        }
      } catch (err) {
        console.error('Feedback submission error:', err);
        feedbackMessage.textContent = 'An error occurred. Please try again later.';
        feedbackMessage.className = 'form-message error';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Feedback';
      }
    };
  }
});
