import type {NextConfig} from 'next';
const config:NextConfig={
  ...(process.env.NEXT_OUTPUT==='standalone'?{output:'standalone' as const}:{}),
  // The homepage photos were converted from PNG to WebP. Keep old .png URLs working.
  async rewrites(){return [{source:'/images/homepage-v3/:name.png',destination:'/images/homepage-v3/:name.webp'}]},
};
export default config;
