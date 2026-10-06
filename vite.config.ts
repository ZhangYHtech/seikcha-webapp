import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 静态参赛站：base='.' 保证 build 产物可在任意子路径/离线打开；
// viteSingleFile 把 JS/CSS 全部内联进 dist/index.html —— 双击即可打开（绕开 file:// 的
// ES module CORS 限制）；视频/海报仍在 dist/media/ 相对引用。
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  server: { port: 5173 },
});
