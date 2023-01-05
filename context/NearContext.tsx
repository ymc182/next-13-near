"use client";
import {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import { map, distinctUntilChanged } from "rxjs";
import {
	FinalExecutionOutcome,
	Optional,
	setupWalletSelector,
	WalletSelector,
} from "@near-wallet-selector/core";
import {
	setupModal,
	WalletSelectorModal,
} from "@near-wallet-selector/modal-ui";
import { setupDefaultWallets } from "@near-wallet-selector/default-wallets";
import { providers } from "near-api-js";
import { toast } from "react-toastify";
import { Transaction } from "near-api-js/lib/transaction";
/* import { setupNearWallet } from "@near-wallet-selector/near-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupCoin98Wallet } from "@near-wallet-selector/coin98-wallet"; */
type Account = {
	accountId: string;
	active: boolean;
};
type CallMethodsParams = {
	contractId: string;
	methodName: string;
	args: any;
	gas: number;
	amount: number;
};
const NearContext = createContext<{
	selector: WalletSelector | null;
	modal: WalletSelectorModal | null;
	accounts: Account[];
	viewMethod: (
		contractId: string,
		methodName: string,
		args: any
	) => Promise<any>;
	signOut: () => Promise<void>;
	callMethods: (
		params: CallMethodsParams[]
	) => Promise<void | FinalExecutionOutcome[]>;
}>({
	selector: null,
	modal: null,
	accounts: [],
	viewMethod: () => Promise.resolve(null),
	signOut: () => Promise.resolve(),
	callMethods: () => Promise.resolve(),
});
export const CONTRACT_ID = "guest-book.testnet";

interface NearProviderProps {
	children: React.ReactNode | React.ReactNode[];
}
declare global {
	interface Window {
		selector: any;
		modal: any;
	}
}

export const NearProvider = ({ children }: NearProviderProps) => {
	const [selector, setSelector] = useState<WalletSelector | null>(null);
	const [modal, setModal] = useState<WalletSelectorModal | null>(null);
	const [accounts, setAccounts] = useState<Account[]>([]);
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
				map((state: any) => state.accounts),
				distinctUntilChanged()
			)
			.subscribe((nextAccounts: any) => {
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
	async function viewMethod(contractId: string, methodName: string, args: {}) {
		if (!selector) return;

		const { network } = selector.options;
		const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });
		const res: any = await provider.query({
			request_type: "call_function",
			account_id: contractId,
			method_name: methodName,
			args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
			finality: "optimistic",
		});

		return JSON.parse(Buffer.from(res.result).toString());
	}
	async function signOut() {
		if (!selector) return;
		const _wallet = await selector.wallet();
		_wallet.signOut().catch((err) => {
			console.log("Failed to sign out");
			console.error(err);
		});
	}

	async function callMethods(params: CallMethodsParams[]) {
		if (!selector) return;
		if (!accountId) {
			toast.warn("Please connect wallet");
			throw new Error("ERR_NOT_SIGNED_IN");
		}
		const { contract } = selector.store.getState();
		const wallet = await selector.wallet();
		if (!contract) {
			toast.warn("Error getting contract");
			throw new Error("ERR_NOT_SIGNED_IN");
		}
		const transactions: any = [];
		for (const param of params) {
			transactions.push({
				signerId: accountId,
				receiverId: param.contractId || contract.contractId,
				actions: [
					{
						type: "FunctionCall",
						params: {
							methodName: param.methodName || "add_message",
							args: param.args || { message: "Hello World" },
							gas: param.gas ? param.gas : "250000000000000",
							deposit: param.amount ? param.amount.toString() : "0",
						},
					},
				],
			});
		}

		const res = await wallet
			.signAndSendTransactions({
				transactions,
			})
			.catch((err) => {
				throw err;
			});
		return res;
	}
	const sharedState = {
		selector,
		modal,
		accounts,
		accountId,
		viewMethod,
		signOut,
		callMethods,
	};

	return (
		<NearContext.Provider value={sharedState}>{children}</NearContext.Provider>
	);
};
export function useNearContext() {
	return useContext(NearContext);
}
