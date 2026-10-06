/** @type {import('tailwindcss').Config} */
// ============================================================
// 改版（2026-10-04）：视觉参照 policygenius.com（暖橙+墨绿+米白+衬线标题）。
// 色值取自参考站官方 CSS 变量（--pg-color-* / --mortar-colors-*）。
// seik.* = 主品牌橙阶；slate.* = 整体调暖的中性阶（覆盖默认冷灰）。
// ============================================================
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 主品牌橙（Policygenius orange #eb6424 及其衍生阶）
        seik: {
          50: '#fbede7', // orange100 浅底
          100: '#fcc1a4', // orange-lightest
          200: '#fbb48f',
          300: '#f78752', // orange-light
          400: '#f2753a',
          500: '#eb6424', // orange 主CTA
          600: '#db5820',
          700: '#c94f16', // orange-dark 悬停/强调文字
          800: '#a4350f',
          900: '#8a2c0d',
          950: '#4d1708',
        },
        // Policygenius 辅助色（绿/米白/藏青/黑/浅青）
        pg: {
          green: '#226f54',
          greenLight: '#90b7a9',
          greenLightest: '#e1ebe7',
          lightBlue: '#c3dfdf',
          navy: '#172436',
          black: '#131212',
          cream: '#f7f5f3', // light-beige 区块底
          beige: '#eae5e1',
          red: '#b12727',
        },
        // 中性整体调暖（默认 slate 为冷蓝灰，覆盖为暖灰；900/950 用 PG 藏青）
        slate: {
          50: '#f7f5f3',
          100: '#ece6df',
          200: '#e2dbd3',
          300: '#cfc6bc',
          400: '#a89f95',
          500: '#787471',
          600: '#5d5956',
          700: '#464240',
          800: '#312f2e',
          900: '#172436',
          950: '#0e1726',
        },
      },
      fontFamily: {
        // 参考站：正文 Urbanist（拉丁），中文回退系统中文字体
        sans: [
          'Urbanist',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'PingFang SC',
          'Microsoft YaHei',
          'Noto Sans Myanmar',
          'Myanmar Text',
          'Padauk',
          'sans-serif',
        ],
        // 参考站：大标题衬线——英文按用户要求用 Times New Roman/Georgia（Lora 观感偏重，
        // 保留为后备）；中文回退宋体系；缅文（serif 槽位）走 Futura 100 Myanmar→系统回退
        serif: [
          'Georgia',
          'Lora',
          'Songti SC',
          'STSong',
          'Noto Serif CJK SC',
          'SimSun',
          // 名称含数字，必须带引号输出，否则整条 font-family 声明非法被浏览器丢弃
          '"Futura 100 Myanmar"',
          'Myanmar Text',
          'Noto Sans Myanmar',
          'serif',
        ],
        // 首页宣传语：方正小标宋类极粗宋体（本机装有小标宋则直接生效，
        // 否则回退华文中宋/宋体并由 font-weight 900 合成加粗）；英文槽位 TNR 在前
        title: [
          'Georgia',
          'FZXiaoBiaoSong-B05S',
          '方正小标宋简体',
          '方正小标宋_GBK',
          'STZhongsong',
          '华文中宋',
          'Songti SC',
          'SimSun',
          '"Futura 100 Myanmar"',
          'Myanmar Text',
          'Noto Sans Myanmar',
          'serif',
        ],
      },
    },
  },
  plugins: [],
};
