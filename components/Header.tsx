"use client";

import React from "react";
import { useNearContext } from "../context/NearContext";

export default function Header() {
	const { modal } = useNearContext();
	return (
		<div>
			<button onClick={() => modal.show()}>Connect</button>
		</div>
	);
}
