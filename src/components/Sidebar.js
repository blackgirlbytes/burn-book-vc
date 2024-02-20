import Link from 'next/link';
import styles from '../styles/Sidebar.module.css';

export default function Sidebar({ isOpen, toggleSidebar }) {
    return (
        <div className={isOpen ? `${styles.sidebar} ${styles.open}` : styles.sidebar}>
            <button className={styles.closeButton} onClick={toggleSidebar}>Close</button>
            <nav>
                <ul>
                    <li>
                        <Link href="/">
                           Entries
                        </Link>
                    </li>
                    <li>
                        <Link href="/badges">
                            Badges
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
}
