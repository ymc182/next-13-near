"use client";

import React from "react";
import { CONTRACT_ID, useNearContext } from "../context/NearContext";

export default function Header() {
	const { modal, callMethods, viewMethod, selector } = useNearContext();

	//dev-1668149532445-37289092214188
	async function testTransaction() {
		const res = await callMethods([
			{
				contractId: CONTRACT_ID,
				methodName: "add_message",
				args: { message: "Hello World" },
				gas: 250000000000000,
				amount: 0,
			},
		]);
		console.log(res);
	}
	return (
		<div>
			<button onClick={() => modal!.show()}>Connect</button>
			<button onClick={testTransaction}>Test Transaction</button>
		</div>
	);
}
