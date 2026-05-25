<template>
  <nav class="navbar no-print">
    <router-link to="/" class="logo">Thread <span>&</span> Fate</router-link>
    <span style="color:var(--muted);font-size:0.8rem;font-family:var(--font-body)">Character Vault</span>
    <div class="nav-actions">
      <router-link to="/new" class="btn btn-primary btn-sm">+ New Character</router-link>
    </div>
  </nav>
  <router-view />
</template>
