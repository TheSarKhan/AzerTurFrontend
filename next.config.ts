import type {NextConfig} from 'next';
const config:NextConfig={...(process.env.NEXT_OUTPUT==='standalone'?{output:'standalone' as const}:{})};
export default config;
