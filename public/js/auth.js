(() => {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  const showMessage = (el, msg, isError = false) => {
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('error', isError);
    el.classList.toggle('success', !isError);
  };

  const getCurrentUser = () => {
    try {
      const raw = window.localStorage.getItem('petRescueUser');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  };

  const setCurrentUser = (user) => {
    if (!user) {
      window.localStorage.removeItem('petRescueUser');
      return;
    }
    window.localStorage.setItem('petRescueUser', JSON.stringify(user));
  };

  const buildNav = () => {
    const nav = document.querySelector('.site-header nav');
    if (!nav) return;

    const user = getCurrentUser();
    const items = [];

    items.push('<a href="index.html">Home</a>');
    items.push('<a href="adopt.html">Adopt</a>');

    if (user) {
      items.push('<a href="profile.html">Profile</a>');
      items.push('<a href="#" id="logout-link">Logout</a>');
    } else {
      items.push('<a href="login.html">Login</a>');
      items.push('<a href="signup.html">Sign up</a>');
    }

    // Donate link if the donate section exists (index)
    if (document.getElementById('donate')) {
      items.push('<a href="#donate" class="donate">Donate</a>');
    }

    nav.innerHTML = items.join('');

    const logout = document.getElementById('logout-link');
    if (logout) {
      logout.addEventListener('click', (e) => {
        e.preventDefault();
        setCurrentUser(null);
        window.location.href = 'index.html';
      });
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    buildNav();
  });

  if (signupForm) {
    const messageEl = document.getElementById('signup-message');

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(signupForm);
      const email = formData.get('email')?.trim();
      const mobile = formData.get('mobile')?.trim();
      
      // Validate email
      if (email && typeof validateEmail === 'function') {
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
          showMessage(messageEl, emailValidation.message, true);
          return;
        }
      }
      
      // Validate mobile if provided
      if (mobile && typeof validateMobile === 'function') {
        const mobileValidation = validateMobile(mobile);
        if (!mobileValidation.valid) {
          showMessage(messageEl, mobileValidation.message, true);
          return;
        }
      }
      
      const payload = {
        name: formData.get('name')?.trim(),
        email: email,
        password: formData.get('password'),
        mobile: mobile,
        address: formData.get('address')?.trim(),
      };

      showMessage(messageEl, 'Creating your account...', false);

      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Unable to sign up');
        }

        showMessage(messageEl, 'Account created! Redirecting to login...', false);
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1200);
      } catch (err) {
        showMessage(messageEl, err.message || 'Something went wrong', true);
      }
    });
  }

  if (loginForm) {
    const messageEl = document.getElementById('login-message');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const email = formData.get('email')?.trim();
      
      // Validate email
      if (email && typeof validateEmail === 'function') {
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
          showMessage(messageEl, emailValidation.message, true);
          return;
        }
      }
      
      const payload = {
        email: email,
        password: formData.get('password'),
      };

      showMessage(messageEl, 'Checking your details...', false);

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Unable to login');
        }

        // Store user data including mobile and address
        setCurrentUser({ 
          id: data.user.id, 
          name: data.user.name, 
          email: data.user.email,
          mobile: data.user.mobile || null,
          address: data.user.address || null,
        });

        showMessage(messageEl, `Welcome back, ${data.user.name}!`, false);

        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } catch (err) {
        showMessage(messageEl, err.message || 'Something went wrong', true);
      }
    });
  }

  // Profile page: load applications
  const profileApplicationsEl = document.getElementById('profile-applications');
  if (profileApplicationsEl) {
    const user = getCurrentUser();
    const nameEl = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    const mobileEl = document.getElementById('profile-mobile');
    const addressEl = document.getElementById('profile-address');

    if (!user) {
      profileApplicationsEl.innerHTML = '<p>You are not logged in. <a href="login.html">Login</a> to view your profile.</p>';
      if (nameEl) nameEl.textContent = '-';
      if (emailEl) emailEl.textContent = '-';
      if (mobileEl) mobileEl.textContent = '-';
      if (addressEl) addressEl.textContent = '-';
      return;
    }

    if (nameEl) nameEl.textContent = user.name || '-';
    if (emailEl) emailEl.textContent = user.email || '-';
    if (mobileEl) mobileEl.textContent = user.mobile || 'Not provided';
    if (addressEl) addressEl.textContent = user.address || 'Not provided';

    (async () => {
      try {
        const res = await fetch(`/api/users/${user.id}/applications`);
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Unable to load applications');
        }

        // Update user data from server (in case mobile/address were updated)
        if (data.user) {
          setCurrentUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            mobile: data.user.mobile || null,
            address: data.user.address || null,
          });
          // Update displayed values
          updateProfileDisplay(data.user);
        }

        const list = data.applications;
        if (!list || list.length === 0) {
          profileApplicationsEl.innerHTML = '<p>You have not applied to adopt any pets yet.</p>';
          return;
        }

        const html = list
          .map((app) => {
            const a = app.animal;
            const created = app.createdAt ? new Date(app.createdAt) : null;
            const dateStr = created ? created.toLocaleDateString() : '';
            return `
              <div class="card">
                <h3>${a ? a.name : 'Unknown pet'}</h3>
                <p>${a ? `${a.type || ''} ${a.breed || ''}` : ''}</p>
                <p><strong>Applied on:</strong> ${dateStr}</p>
                ${app.message ? `<p><strong>Your message:</strong> ${app.message}</p>` : ''}
                ${
                  a
                    ? `<a class="btn" href="pet.html?id=${a.id}">View pet</a>`
                    : ''
                }
              </div>
            `;
          })
          .join('');

        profileApplicationsEl.innerHTML = html;
      } catch (err) {
        profileApplicationsEl.innerHTML = `<p>Could not load your applications.</p>`;
      }
    })();
  }

  // Edit profile functionality
  const editProfileBtn = document.getElementById('edit-profile-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const editProfileForm = document.getElementById('edit-profile-form');
  const profileView = document.getElementById('profile-view');
  const profileEdit = document.getElementById('profile-edit');
  const editMessageEl = document.getElementById('edit-message');
  const editNameEl = document.getElementById('edit-name');
  const editMobileEl = document.getElementById('edit-mobile');
  const editAddressEl = document.getElementById('edit-address');

  const updateProfileDisplay = (userData) => {
    const nameEl = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    const mobileEl = document.getElementById('profile-mobile');
    const addressEl = document.getElementById('profile-address');
    
    if (nameEl) nameEl.textContent = userData.name || '-';
    if (emailEl) emailEl.textContent = userData.email || '-';
    if (mobileEl) mobileEl.textContent = userData.mobile || 'Not provided';
    if (addressEl) addressEl.textContent = userData.address || 'Not provided';
  };

  if (editProfileBtn && profileView && profileEdit) {
    editProfileBtn.addEventListener('click', () => {
      const user = getCurrentUser();
      if (!user) return;

      // Populate edit form with current values
      if (editNameEl) editNameEl.value = user.name || '';
      if (editMobileEl) editMobileEl.value = user.mobile || '';
      if (editAddressEl) editAddressEl.value = user.address || '';

      // Show edit form, hide view
      profileView.style.display = 'none';
      profileEdit.style.display = 'block';
      if (editMessageEl) editMessageEl.textContent = '';
    });
  }

  if (cancelEditBtn && profileView && profileEdit) {
    cancelEditBtn.addEventListener('click', () => {
      profileView.style.display = 'block';
      profileEdit.style.display = 'none';
      if (editMessageEl) editMessageEl.textContent = '';
    });
  }

  if (editProfileForm) {
    editProfileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = getCurrentUser();
      if (!user || !user.id) {
        showMessage(editMessageEl, 'You must be logged in to edit your profile', true);
        return;
      }

      const formData = new FormData(editProfileForm);
      const mobile = formData.get('mobile')?.trim();
      
      // Validate mobile if provided
      if (mobile && typeof validateMobile === 'function') {
        const mobileValidation = validateMobile(mobile);
        if (!mobileValidation.valid) {
          showMessage(editMessageEl, mobileValidation.message, true);
          return;
        }
      }
      
      const payload = {
        name: formData.get('name')?.trim(),
        mobile: mobile,
        address: formData.get('address')?.trim(),
      };

      if (!payload.name || payload.name.length < 2) {
        showMessage(editMessageEl, 'Name is required and must be at least 2 characters', true);
        return;
      }

      showMessage(editMessageEl, 'Updating profile...', false);

      try {
        const url = `/api/users/${user.id}`;
        console.log('Updating profile:', url, payload);
        
        const res = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        // Check if response is JSON before parsing
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          console.error('Non-JSON response:', text.substring(0, 200));
          throw new Error('Server returned an invalid response. Please try again.');
        }

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Unable to update profile');
        }

        // Update localStorage with new data
        setCurrentUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          mobile: data.user.mobile || null,
          address: data.user.address || null,
        });

        // Update displayed values
        updateProfileDisplay(data.user);

        showMessage(editMessageEl, 'Profile updated successfully!', false);

        // Switch back to view mode after a short delay
        setTimeout(() => {
          if (profileView) profileView.style.display = 'block';
          if (profileEdit) profileEdit.style.display = 'none';
          if (editMessageEl) editMessageEl.textContent = '';
        }, 1500);
      } catch (err) {
        showMessage(editMessageEl, err.message || 'Something went wrong', true);
      }
    });
  }
})();


