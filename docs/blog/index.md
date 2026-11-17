<script setup>
import { data as posts } from './posts.data'
</script>

# Blog

<h3 class="lede">Notes on building with KosmoJS.</h3>

<div class="post-grid">
  <a v-for="post of posts" :key="post.url" :href="post.url" class="post-card">
    <div>
    <time :datetime="post.date.iso">{{ post.date.string }}</time>
    <template v-if="post.readingTime">
      <span> &middot; </span>
      <span class="reading-time">{{ post.readingTime }} min read</span>
    </template>
    </div>
    <h3>{{ post.title }}</h3>
    <p v-if="post.description">{{ post.description }}</p>
  </a>
</div>

<style scoped>
.lede {
  color: var(--vp-c-text-2);
  margin-bottom: 0;
}

.post-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 32px;
}

.post-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 22px 22px 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--kx-radius);
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  transition:
    border-color 0.2s,
    box-shadow 0.25s var(--kx-ease),
    transform 0.25s var(--kx-ease);
}

.post-card:hover {
  border-color: var(--kx-accent-line);
  box-shadow: var(--kx-shadow-pop);
  transform: translateY(-2px);
}

.post-card:hover h3 {
  color: var(--kx-accent);
}

.post-card time {
  font-family: var(--kx-font-mono);
  font-size: 11.5px;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.post-card h3 {
  margin: 0;
  font-size: 18px;
  color: var(--vp-c-text-1);
  transition: color 0.15s;
}

.post-card p {
  margin: 0;
  font-size: 14px;
  color: var(--vp-c-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.reading-time {
  font-family: var(--kx-font-mono);
  font-size: 11.5px;
  color: var(--kx-accent);
}
</style>
