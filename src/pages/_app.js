
import styles from '../styles/Home.module.css';
import { Web5Provider } from './Web5Context';
import Sidebar from '../components/Sidebar';
import { useState } from 'react';

export default function App({ Component, pageProps }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <>
      <div className={styles.header}>
        <div className={styles.avatar} onClick={toggleSidebar}>DB</div>
        <h1 className={styles.title}>Digital Burn Book</h1>
      </div>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <Web5Provider>
        <Component {...pageProps} />
      </Web5Provider>
    </>
  );
}
