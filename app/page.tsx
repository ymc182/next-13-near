import Image from "next/image";
import { Inter } from "@next/font/google";
import { use } from "react";
import styles from "./page.module.css";
import { useNearContext } from "../context/NearContext";
const inter = Inter({ subsets: ["latin"] });

export default function Home() {
	return <main>Server Component</main>;
}
