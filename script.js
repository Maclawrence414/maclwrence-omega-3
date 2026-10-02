const menu = document.querySelector('.menu');
const links = document.querySelector('.links');
menu.addEventListener('click', () => links.classList.toggle('open'));
document.querySelectorAll('.links a').forEach((a) => a.addEventListener('click', () => links.classList.remove('open')));

const DB_NAME = 'maciboi-photo-db';
const DB_VERSION = 1;
const STORE_NAME = 'photos';
const photoKeys = ['profile', 'school', 'food', 'sport'];

function openPhotoDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePhoto(key, blob) {
  const db = await openPhotoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(blob, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function loadPhoto(key) {
  const db = await openPhotoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => { const blob = request.result || null; db.close(); resolve(blob); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

function showPhoto(key, blob) {
  const slot = document.querySelector(`[data-photo="${key}"]`);
  if (!slot || !blob) return;
  if (slot.dataset.objectUrl) URL.revokeObjectURL(slot.dataset.objectUrl);
  const objectUrl = URL.createObjectURL(blob);
  slot.dataset.objectUrl = objectUrl;
  slot.classList.add('has-photo');
  slot.innerHTML = '';
  const image = document.createElement('img');
  image.className = 'uploaded';
  image.src = objectUrl;
  image.alt = `${key} photo`;
  slot.appendChild(image);
}

function setupPhotoUpload(key) {
  const input = document.getElementById(`${key}-input`);
  if (!input) return;
  document.querySelectorAll(`[data-upload="${key}"]`).forEach((button) => {
    button.addEventListener('click', () => input.click());
  });
  input.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) { event.target.value = ''; return; }
    try {
      await savePhoto(key, file);
      showPhoto(key, file);
    } catch (error) {
      console.error('Could not save photo:', error);
      alert('The photo could not be saved in this browser.');
    }
    event.target.value = '';
  });
  loadPhoto(key).then((blob) => { if (blob) showPhoto(key, blob); }).catch((error) => console.error(`Could not load ${key} photo:`, error));
}

photoKeys.forEach(setupPhotoUpload);
window.addEventListener('beforeunload', () => {
  photoKeys.forEach((key) => {
    const slot = document.querySelector(`[data-photo="${key}"]`);
    if (slot?.dataset.objectUrl) URL.revokeObjectURL(slot.dataset.objectUrl);
  });
});

document.getElementById('contact-form').addEventListener('submit', (event) => {
  event.preventDefault();
  document.getElementById('status').textContent = 'Thanks for your message! This practice form is ready to connect to a real email service.';
  event.target.reset();
});
