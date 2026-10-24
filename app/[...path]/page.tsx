import Site from '@/components/travel-site';
export default async function Page({params}:{params:Promise<{path:string[]}>}){const {path}=await params;return <Site initialPath={'/'+path.join('/')}/>}
