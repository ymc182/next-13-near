import "./globals.scss";
import "@near-wallet-selector/modal-ui/styles.css";
import { NearProvider } from "../context/NearContext";
import Header from "../components/Header";
export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<head />
			<body>
				<NearProvider>
					<Header />
					{children}
				</NearProvider>
			</body>
		</html>
	);
}
