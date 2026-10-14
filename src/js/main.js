/* Petal - main.js
   One file for every page. All data stays in the browser (no backend).
   - localStorage   -> accounts and posts (kept until deleted)
   - sessionStorage -> who is logged in (cleared when the tab closes) */

// ---------- 1. Helpers ----------
const $ = (id) => document.getElementById(id);
const read = (key) => JSON.parse(localStorage.getItem(key)) || [];
const write = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const user = sessionStorage.getItem("petal_user");   // null if logged out
const page = document.body.dataset.page;

function message(text) {
  $("message").textContent = text;
}

// Turns <script> into harmless text, so nobody can inject code through a post
function esc(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Passwords are saved as a SHA-256 hash, never as typed
async function hash(text) {
  const bytes = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------- 2. Page guard ----------
if (document.body.dataset.private && !user) location.href = "login.html";
if (document.body.dataset.guest && user) location.href = "feed.html";

// ---------- 3. Log out (button in the nav of private pages) ----------
if ($("logoutBtn")) {
  $("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("petal_user");
    location.href = "login.html";
  });
}

// ---------- 4. Sign up ----------
if ($("signupForm")) {
  $("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("name").value.trim();
    const username = $("username").value.trim().toLowerCase();
    const password = $("password").value;
    const users = read("petal_users");

    if (users.some((u) => u.username === username)) {
      return message("That username is taken. Try another one.");
    }

    users.push({ username, name, bio: "", passHash: await hash(password) });
    write("petal_users", users);
    sessionStorage.setItem("petal_user", username);
    location.href = "feed.html";
  });
}

// ---------- 5. Log in ----------
if ($("loginForm")) {
  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = $("username").value.trim().toLowerCase();
    const passHash = await hash($("password").value);
    const found = read("petal_users").find((u) => u.username === username && u.passHash === passHash);

    if (!found) return message("Wrong username or password.");
    sessionStorage.setItem("petal_user", username);
    location.href = "feed.html";
  });
}

// ---------- 6. Feed ----------
// Posts have an "expires" time. Expired posts are removed every time we load them.
function getPosts() {
  const alive = read("petal_posts").filter((p) => !p.expires || p.expires > Date.now());
  write("petal_posts", alive);
  return alive;
}

function timeLeft(post) {
  if (!post.expires) return "stays until deleted";
  const minutes = Math.ceil((post.expires - Date.now()) / 60000);
  return minutes >= 60 ? "fades in " + Math.ceil(minutes / 60) + " h" : "fades in " + minutes + " min";
}

function showFeed() {
  const posts = getPosts().reverse();            // newest first
  const users = read("petal_users");
  $("feed").innerHTML = posts.length ? "" : "<div class='card'>No petals yet. Plant the first one above.</div>";

  posts.forEach((p) => {
    const author = users.find((u) => u.username === p.author) || { name: p.author };
    const liked = p.likes.includes(user);
    $("feed").innerHTML += `
      <article class="card">
        <div class="post-head">
          <div class="avatar">${esc(author.name[0].toUpperCase())}</div>
          <div>
            <strong>${esc(author.name)}</strong> <span class="small">@${esc(p.author)}</span><br>
            <span class="small">${timeLeft(p)}</span>
          </div>
        </div>
        <p>${esc(p.text)}</p>
        <button class="btn btn-light" data-id="${p.id}" data-action="like">${liked ? "&#128151;" : "&#129293;"} ${p.likes.length}</button>
        ${p.author === user ? `<button class="btn btn-light" data-id="${p.id}" data-action="delete">Delete</button>` : ""}
      </article>`;
  });
}

if (page === "feed" && user) {
  showFeed();

  // Coming from Explore? Start the post with the chosen prompt.
  const prompt = new URLSearchParams(location.search).get("prompt");
  if (prompt) $("postText").value = prompt + " ";

  $("postForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const hours = Number($("postLife").value);   // 0 means "never fades"
    const posts = getPosts();
    posts.push({
      id: Date.now(),
      author: user,
      text: $("postText").value.trim(),
      likes: [],
      expires: hours ? Date.now() + hours * 3600000 : null,
    });
    write("petal_posts", posts);
    $("postText").value = "";
    showFeed();
  });

  // One listener handles every Like and Delete button
  $("feed").addEventListener("click", (e) => {
    const id = Number(e.target.dataset.id);
    if (!id) return;
    let posts = getPosts();

    if (e.target.dataset.action === "delete") {
      posts = posts.filter((p) => p.id !== id);
    } else {
      const post = posts.find((p) => p.id === id);
      post.likes = post.likes.includes(user) ? post.likes.filter((n) => n !== user) : [...post.likes, user];
    }
    write("petal_posts", posts);
    showFeed();
  });
}

// ---------- 7. Profile ----------
if (page === "profile" && user) {
  const users = read("petal_users");
  const me = users.find((u) => u.username === user);

  function showProfile() {
    $("avatar").textContent = me.name[0].toUpperCase();
    $("profileName").textContent = me.name;
    $("profileUser").textContent = "@" + me.username;
    $("profileBio").textContent = me.bio || "No bio yet.";
    $("postCount").textContent = getPosts().filter((p) => p.author === user).length;
    $("editName").value = me.name;
    $("editBio").value = me.bio;
  }
  showProfile();

  $("editForm").addEventListener("submit", (e) => {
    e.preventDefault();
    me.name = $("editName").value.trim();
    me.bio = $("editBio").value.trim();
    write("petal_users", users);
    showProfile();
    message("Saved!");
  });
}

// ---------- 8. Settings: see, download, delete my data ----------
function myData() {
  return {
    account: read("petal_users").find((u) => u.username === user),
    posts: read("petal_posts").filter((p) => p.author === user),
  };
}

if (page === "settings" && user) {
  $("dataView").textContent = JSON.stringify(myData(), null, 2);

  $("downloadBtn").addEventListener("click", () => {
    const file = new Blob([JSON.stringify(myData(), null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "my-petal-data.json";
    link.click();
  });

  $("deleteBtn").addEventListener("click", () => {
    if (!confirm("Delete your account and all your posts? This cannot be undone.")) return;
    write("petal_users", read("petal_users").filter((u) => u.username !== user));
    write("petal_posts", read("petal_posts").filter((p) => p.author !== user));
    sessionStorage.removeItem("petal_user");
    location.href = "../index.html";
  });
}

// ---------- 9. Explore: writing prompts and people on this device ----------
const prompts = [
  "The last movie that stayed in my head was...",
  "A book I think everyone should read is...",
  "Something small that made me smile today:",
  "A skill I want to learn this year is...",
  "One thing I would tell my younger self:",
  "My favorite way to be creative is...",
  "A perspective that changed my mind:",
];

function newPrompt() {
  const text = prompts[Math.floor(Math.random() * prompts.length)];
  $("promptText").textContent = text;
  $("promptLink").href = "feed.html?prompt=" + encodeURIComponent(text);
}

if (page === "explore" && user) {
  newPrompt();
  $("newPromptBtn").addEventListener("click", newPrompt);

  $("members").innerHTML = read("petal_users").map((u) => `
    <div class="post-head">
      <div class="avatar">${esc(u.name[0].toUpperCase())}</div>
      <div><strong>${esc(u.name)}</strong> <span class="small">@${esc(u.username)}</span><br>
      <span class="small">${esc(u.bio || "No bio yet.")}</span></div>
    </div>`).join("");
}
