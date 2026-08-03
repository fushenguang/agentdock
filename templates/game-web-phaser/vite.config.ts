import { defineConfig } from 'vite'

// The dev/preview port is pinned to 8080 on purpose — do not change it.
//
// The outer platform (the VM host running the AI coding agent) builds
// share/preview links against a fixed, known port. If this drifts (e.g. Vite
// falling back to 5174 because 5173 was busy), the share link silently
// breaks with no error visible to the agent. `strictPort: true` makes any
// port conflict a loud startup failure instead of a silent port change.
//
// `host: true` binds to 0.0.0.0 so the dev server is reachable from outside
// the VM's loopback interface (required for the platform to proxy/share it).
export default defineConfig({
  server: {
    port: 8080,
    strictPort: true,
    host: true,
  },
  preview: {
    port: 8080,
    strictPort: true,
    host: true,
  },
})
