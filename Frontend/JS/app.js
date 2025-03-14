console.clear()
// Base URL for API
const API_URL = 'http://localhost:3001';

// Retrieve for data 
function getFormData(form) {
  console.log('Getting form data');
  const formData = new FormData(form);
  console.log("forms key value are : ", formData.keys());
  return Object.fromEntries(formData.entries());
}

// Handle Registration
const registerForm = document.getElementById('register-form');
if (registerForm) {
  console.log('Registration section initialized');
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Register form submitted');
    const data = getFormData(registerForm);

    data.isAdmin = data.isAdmin === 'on';
    const messageEl = document.getElementById('register-message');

    try {
      console.log('Sending register request:', data);
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      console.log('Register response received:', response.status);
      const result = await response.json();

      if (response.ok) {
        console.log('Registration successful:', result);
        messageEl.style.color = '#5cb85c'; // Green for success
        messageEl.textContent = result.message;
        setTimeout(() => {
          console.log('Redirecting to index.html');
          window.location.href = './index.html';
        }, 1000); // Redirect after 1s
      } else {
        console.log('Registration failed:', result);
        messageEl.textContent = result.message || 'Registration failed';
      }
    } catch (error) {
      console.error('Register error:', error);
      messageEl.textContent = 'Error connecting to server';
    }
  });
}

// Handle Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
  console.log('Login section initialized');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Login form submitted');
    const data = getFormData(loginForm);
    const messageEl = document.getElementById('login-message');

    try {
      console.log('Sending login request:', data);
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      console.log('Login response received:', response.status);
      const result = await response.json();

      if (response.ok) {
        console.log('Login successful, token:', result.token);
        localStorage.setItem('token', result.token); 
        messageEl.style.color = '#5cb85c';
        messageEl.textContent = 'Login successful';

        const payload = JSON.parse(atob(result.token.split('.')[1]));
        console.log('Decoded JWT payload:', payload);

        const redirectUrl = payload.isAdmin ? './dashboard.html' : './profile.html';
        setTimeout(() => {
          console.log('Redirecting to profile.html');
          window.location.href = redirectUrl;
        }, 10000);
      } else {
        console.log('Login failed:', result);
        messageEl.textContent = result.message || 'Login failed';
      }
    } catch (error) {
      console.error('Login error:', error);
      messageEl.textContent = 'Error connecting to server';
    }
  });
}

// Handle Profile
if (document.getElementById('profile-username')) {
  console.log('Profile section initialized');
  const token = localStorage.getItem('token');
  const messageEl = document.getElementById('profile-message');
  const usernameEl = document.getElementById('profile-username');
  const idEl = document.getElementById('profile-id');

  if (!token) {
    console.log('No token found, redirecting to login');
    messageEl.textContent = 'Please log in first';
    setTimeout(() => {
      console.log('Redirecting to index.html due to no token');
      window.location.href = 'index.html';
    }, 100000);
    console.warn('no token')
  }

  console.log('Token found, fetching profile data');
  fetch(`${API_URL}/users/4`, {  // Hardcoded
    headers: { 'Authorization': `Bearer ${token}` },
  })
    .then(response => {
      console.log('Profile fetch response:', response.status);
      if (!response.ok) throw new Error('Unauthorized or user not found');
      return response.json();
    })
    .then(user => {
      console.log('Profile data received:', user);
      usernameEl.textContent = user.username;
      idEl.textContent = user.id;
    })
    .catch(error => {
      console.error('Profile fetch error:', error);
      messageEl.textContent = error.message;
      setTimeout(() => {
        console.log('Redirecting to index.html due to profile error');
        window.location.href = 'index.html';
      }, 100000);
    });
}

// Handle Logout
const logoutLink = document.getElementById('logout-link');
if (logoutLink) {
  console.log('Logout section initialized');
  logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Logout clicked');
    localStorage.removeItem('token');
    console.log('Token removed, redirecting to index.html');
    window.location.href = 'index.html';
  });
}

// Handle Posts
if (document.getElementById('posts-list')) {
    console.log('Posts section initialized');
    const token = localStorage.getItem('token');
    const messageEl = document.getElementById('posts-message');
    const postsListEl = document.getElementById('posts-list');
  
    if (!token) {
      console.log('No token found, redirecting to login');
      messageEl.textContent = 'Please log in first';
      setTimeout(() => {
        console.log('Redirecting to index.html due to no token');
        window.location.href = 'index.html';
      }, 1000);
      console.warn("no token")
    }
  
    console.log('Token found, fetching posts');
    fetch(`${API_URL}/posts`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(response => {
        console.log('Posts fetch response:', response.status);
        if (!response.ok) throw new Error('Unauthorized or no posts found');
        return response.json();
      })
      .then(posts => {
        console.log('Posts data received:', posts);
        if (posts.length === 0) {
          postsListEl.innerHTML = '<p>No posts available.</p>';
        } else {
          posts.forEach(post => {
            const postEl = document.createElement('div');
            postEl.className = 'post-item';
            postEl.innerHTML = `
              <div class="post-content">${post.content}</div>
              <div class="post-meta">Posted on: ${new Date(post.created_at).toLocaleString()}</div>
            `;
            postsListEl.appendChild(postEl);
          });
        }
      })
      .catch(error => {
        console.error('Posts fetch error:', error);
        messageEl.textContent = error.message;
        setTimeout(() => {
          console.log('Redirecting to index.html due to posts error');
          window.location.href = 'index.html';
        }, 1000);
      });
  }

  // Handle Dashboard
if (document.getElementById('user-initial')) {
    console.log('Dashboard section initialized');
    const token = localStorage.getItem('token');
    const messageEl = document.createElement('p'); //
    messageEl.className = 'form-message';
    document.querySelector('.dashboard-container').appendChild(messageEl);
  
    const initialEl = document.getElementById('user-initial');
    const drawerEl = document.getElementById('user-drawer');
    const usernameEl = document.getElementById('drawer-username');
    const adminStatusEl = document.getElementById('drawer-admin-status');
    const logoutBtn = document.getElementById('logout-btn');
  
    if (!token) {
      console.log('No token found, redirecting to login');
      messageEl.textContent = 'Please log in first';
      setTimeout(() => window.location.href = 'index.html', 1000);
        console.warn("no token")
    }
  
    // Decode JWT for initial and admin status
    const payload = JSON.parse(atob(token.split('.')[1])); //Don't quite understand
    console.log('Dashboard JWT payload:', payload);
    initialEl.textContent = payload.username.slice(0, 1).toUpperCase() + '.N'; // e.g., "B.N"
    usernameEl.textContent = `Username: ${payload.username}`;
    adminStatusEl.textContent = `Role: ${payload.isAdmin ? 'Admin' : 'User'}`;
  
    // Fetch user data for consistency
    fetch(`${API_URL}/users/${payload.userId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(response => {
        if (!response.ok) throw new Error('Unauthorized');
        return response.json();
      })
      .then(user => {
        console.log('Dashboard user data:', user);
      })
      .catch(error => {
        console.error('Dashboard fetch error:', error);
        messageEl.textContent = error.message;
        setTimeout(() => window.location.href = 'index.html', 1000);
      });
  
    // Drawer toggle
    initialEl.addEventListener('click', () => {
      console.log('Toggling drawer');
      drawerEl.classList.toggle('open');
    });
  
    // Logout
    logoutBtn.addEventListener('click', () => {
      console.log('Logout clicked');
      localStorage.removeItem('token');
      window.location.href = 'index.html';
    });
  }