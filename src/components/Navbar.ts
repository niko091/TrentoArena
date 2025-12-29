export const Navbar = () => {
  return `
    <nav class="navbar navbar-expand-lg navbar-dark mb-4 rounded-bottom shadow" style="background-color: var(--accent-primary);">
      <div class="container-fluid">
        <a class="navbar-brand fw-bold" href="#">TrentoArena</a>
        <div class="d-flex gap-3">
            <a class="nav-link text-white" href="#profile">Profile</a>
            <a class="nav-link text-white" href="#map">Map</a>
        </div>
      </div>
    </nav>
  `
}
