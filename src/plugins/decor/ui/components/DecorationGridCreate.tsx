/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { PlusIcon } from "@components/Icons";
import { i18n, Text } from "@webpack/common";
import type { HTMLProps } from "react";

import { DecorationGridItem } from ".";

interface DecorationGridCreateProps extends HTMLProps<HTMLDivElement> {
    onSelect: () => void;
}

export default function DecorationGridCreate(props: DecorationGridCreateProps) {
    return (
        <DecorationGridItem
            {...props}
            isSelected={false}
        >
            <PlusIcon />
            <Text
                variant="text-xs/normal"
                color="header-primary"
            >
                {i18n.Messages.CREATE}
            </Text>
        </DecorationGridItem >
    );
}
