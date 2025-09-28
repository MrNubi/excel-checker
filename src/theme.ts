import { createGlobalStyle } from 'styled-components';


export const theme = {
colors: {
bg: '#f7f7f8',
fg: '#1f2328',
muted: '#6a737d',
border: '#e5e7eb',
ok: '#2e7d32',
warn: '#8a6d3b',
card: '#ffffff',
btn: '#111111',
},
radius: { sm: '6px', md: '10px', lg: '12px' },
font: {
base: "system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Arial, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
},
};


export const GlobalStyle = createGlobalStyle`
*, *::before, *::after { box-sizing: border-box; }
html, body, #root { height: 100%; }
body {
margin: 0;
color: ${({ theme }) => theme.colors.fg};
background: ${({ theme }) => theme.colors.bg};
font-family: ${({ theme }) => theme.font.base};
}
`;