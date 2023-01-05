"use client";
import {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import { map, distinctUntilChanged } from "rxjs";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupDefaultWallets } from "@near-wallet-selector/default-wallets";
/* import { setupNearWallet } from "@near-wallet-selector/near-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupCoin98Wallet } from "@near-wallet-selector/coin98-wallet"; */
const NearContext = createContext();
const CONTRACT_ID = "guest-book.testnet";

export const NearProvider = ({ children }) => {
	const [selector, setSelector] = useState(null);
	const [modal, setModal] = useState(null);
	const [accounts, setAccounts] = useState([]);
	const init = useCallback(async () => {
		const _selector = await setupWalletSelector({
			network: "testnet",
			debug: true,
			modules: [...(await setupDefaultWallets())],
		});
		const _modal = setupModal(_selector, { contractId: CONTRACT_ID });
		const state = _selector.store.getState();
		setAccounts(state.accounts);

		window.selector = _selector;
		window.modal = _modal;

		setSelector(_selector);
		setModal(_modal);
	}, []);
	useEffect(() => {
		init().catch((err) => {
			console.error(err);
			alert("Failed to initialise wallet selector");
		});
	}, [init]);
	useEffect(() => {
		if (!selector) {
			return;
		}

		const subscription = selector.store.observable
			.pipe(
				map((state) => state.accounts),
				distinctUntilChanged()
			)
			.subscribe((nextAccounts) => {
				console.log("Accounts Update", nextAccounts);

				setAccounts(nextAccounts);
			});

		return () => subscription.unsubscribe();
	}, [selector]);
	if (!selector || !modal) {
		return null;
	}
	const accountId =
		accounts.find((account) => account.active)?.accountId || null;
	const sharedState = {
		selector,
		modal,
		accounts,
		accountId,
	};

	return (
		<NearContext.Provider value={sharedState}>{children}</NearContext.Provider>
	);
};
export function useNearContext() {
	return useContext(NearContext);
}
