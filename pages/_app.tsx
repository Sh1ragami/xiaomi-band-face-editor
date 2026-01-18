import '../styles/globals.css';
import type { AppProps } from 'next/app';
import AppImpl from '@/pages/_app';

export default function App(props: AppProps) {
  return <AppImpl {...props} />;
}
