# Petal: grow ideas, not data trails

A lightweight, privacy-focused social media prototype. Built with only **HTML, CSS and vanilla JavaScript**. No backend, database, or API.

**Author:** Karylle Lynn L. Dellosa, 3rd year BS Data Science, USTP

## The idea
AI systems can read and collect almost everything we post. Petal asks: what if a social platform simply collected nothing? Everything stays on the user's own device, and the user can see, download, or delete it at any time.

### What makes Petal different
- **Fading posts.** Every post has a lifespan (1 hour, 24 hours, or never). Expired posts are deleted automatically.
- **Data transparency page.** Settings shows the exact data stored about you, with one-click download and delete.
- **Session that forgets.** Login lives in `sessionStorage`, so closing the tab logs you out.
- **Zero outside requests.** No CDN, fonts, analytics, or cookies.
- **Explore page.** Random writing prompts that open the feed with the prompt ready to finish, plus privacy tips and a list of people on the device.
- **Petal design.** Pink theme with petal-shaped cards and avatars, a layered petal illustration (`flower.svg`) framing the creator's photo, a soft blossom background, and a small flower after every main heading.

## Pages
| Page | File | Purpose |
|---|---|---|
| Home | `index.html` | Landing page |
| Sign up | `pages/signup.html` | Create an account (no email or phone) |
| Log in | `pages/login.html` | Start a session |
| Feed | `pages/feed.html` | Write, like, and delete posts |
| Profile | `pages/profile.html` | View and edit name and bio |
| Settings | `pages/settings.html` | View, download, or delete your data |
| Explore | `pages/explore.html` | Writing prompts, privacy tips, and people on this device (login required) |
| About us | `pages/about.html` | Mission, how it works, maker, AI honesty note |
| About the Creator | `pages/creator.html` | Photo and story of the creator |
| Privacy | `pages/privacy.html` | Promises, what is stored, honest limits |

## Folder structure
```
.
├── index.html
├── README.md
├── pages/
│   ├── login.html
│   ├── signup.html
│   ├── feed.html
│   ├── profile.html
│   ├── settings.html
│   ├── explore.html
│   ├── creator.html
│   ├── about.html
│   └── privacy.html
├── src/
│   ├── css/style.css
│   └── js/main.js
└── assets/img/
    ├── logo.svg
    ├── creator.jpg         (photo of the creator)
    ├── flower.svg          (layered petal illustration)
    └── background.jpg   (soft background tile)
```

## How to run
1. Download or clone the repository.
2. Open `index.html` in any browser (double-click it). No installation needed.
3. If your browser blocks password hashing on `file://`, open the folder with the VS Code "Live Server" extension instead.

## How it works
**Data storage** (all in the browser):
| Key | Storage | Contents |
|---|---|---|
| `petal_users` | localStorage | `{ username, name, bio, passHash }` for each account |
| `petal_posts` | localStorage | `{ id, author, text, likes[], expires }` for each post |
| `petal_user` | sessionStorage | Username of the logged-in person |

**`main.js` sections**
1. Helpers: shortcuts for reading and writing storage, `esc()` and `hash()`.
2. Page guard: private pages redirect to login; login and signup redirect to the feed if already logged in.
3. Log out.
4. Sign up: checks for duplicate usernames, hashes the password, saves the account.
5. Log in: hashes the typed password and compares it to the saved hash.
6. Feed: create, like, delete, and auto-remove expired posts.
7. Profile: show and edit name and bio.
8. Settings: view, download (JSON), and delete all of the user's data.
9. Explore: random prompts (sent to the feed through the URL) and the list of members.

## Privacy and security choices
- **Password hashing (SHA-256)** with the browser's built-in `crypto.subtle`. Passwords are never stored as typed.
- **Output escaping** with `esc()` so a post containing `<script>` is shown as text, not run (prevents XSS).
- **Input rules:** username pattern, minimum password length, post length limit.
- **Data minimization:** only a username, display name, and password hash are required.

## Honest limitations
This is a prototype, not a secure product.
- Without a server, anyone using the same browser profile can read localStorage in developer tools.
- SHA-256 without a salt is weaker than the methods a real backend would use (bcrypt or Argon2).
- Posts are not shared between devices; each browser has its own feed.
- A real version needs a secure backend and end-to-end encryption.

## How to test (checklist)
1. Sign up with a short password: the browser should block it (8+ characters).
2. Sign up properly: you land on the feed.
3. Post with "1 hour" and "Never": both appear with their fade times.
4. Like and unlike a post; delete your own post.
5. Edit your profile and refresh: changes remain.
6. Open Settings: your data is visible; download works.
7. Log out, then try opening `pages/feed.html` directly: you are sent to login.
8. Sign up again with the same username: "That username is taken."
9. Delete your account in Settings: you return to the home page and cannot log in.


