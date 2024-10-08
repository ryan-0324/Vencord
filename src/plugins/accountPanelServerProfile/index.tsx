/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import { getCurrentChannel } from "@utils/discord";
import definePlugin, { OptionType } from "@utils/types";
import type { UserRecord } from "@vencord/discord-types";
import { findByPropsLazy, findComponentByCodeLazy } from "@webpack";
import { ContextMenuApi, Menu, useEffect, useRef } from "@webpack/common";
import type { MutableRefObject, ReactNode, UIEvent } from "react";

interface UserProfileProps {
    popoutProps: Record<string, any>;
    currentUser: UserRecord;
    originalPopout: () => ReactNode;
}

const UserProfilePopoutWrapper = findComponentByCodeLazy("UserProfilePopoutWrapper: user cannot be undefined");
const styles: Record<string, string> = findByPropsLazy("accountProfilePopoutWrapper");

let openAlternatePopout = false;
let accountPanelRef: MutableRefObject<Record<PropertyKey, any> | null> = { current: null };

const AccountPanelContextMenu = ErrorBoundary.wrap(() => {
    const { prioritizeServerProfile } = settings.use(["prioritizeServerProfile"]);

    const currentChannel = getCurrentChannel();

    return (
        <Menu.Menu
            navId="vc-ap-server-profile"
            onClose={ContextMenuApi.closeContextMenu}
        >
            <Menu.MenuItem
                id="vc-ap-view-alternate-popout"
                label={prioritizeServerProfile ? "View Account Profile" : "View Server Profile"}
                disabled={!currentChannel || currentChannel.isPrivate()}
                action={e => {
                    openAlternatePopout = true;
                    accountPanelRef.current?.props.onMouseDown();
                    accountPanelRef.current?.props.onClick(e);
                }}
            />
            <Menu.MenuCheckboxItem
                id="vc-ap-prioritize-server-profile"
                label="Prioritize Server Profile"
                checked={prioritizeServerProfile}
                action={() => { settings.store.prioritizeServerProfile = !prioritizeServerProfile; }}
            />
        </Menu.Menu>
    );
}, { noop: true });

const settings = definePluginSettings({
    prioritizeServerProfile: {
        type: OptionType.BOOLEAN,
        description: "Prioritize Server Profile when left clicking your account panel",
        default: false
    }
});

export default definePlugin({
    name: "AccountPanelServerProfile",
    description: "Right click your account panel in the bottom left to view your profile in the current server",
    authors: [Devs.Nuckyz, Devs.relitrix],
    settings,

    patches: [
        {
            find: ".Messages.ACCOUNT_SPEAKING_WHILE_MUTED",
            group: true,
            replacement: [
                {
                    match: /(?<=\.SIZE_32\)}\);)/,
                    replace: "$self.useAccountPanelRef();"
                },
                {
                    match: /(\.AVATAR,children:.+?renderPopout:(\i)=>){(.+?)}(?=,position)(?<=currentUser:(\i).+?)/,
                    replace: (_, rest, popoutProps, originalPopout, currentUser) => `${rest}$self.UserProfile({popoutProps:${popoutProps},currentUser:${currentUser},originalPopout:()=>{${originalPopout}}})`
                },
                {
                    match: /\.AVATAR,children:.+?(?=renderPopout:)/,
                    replace: "$&onRequestClose:$self.onPopoutClose,"
                },
                {
                    match: /(?<=.avatarWrapper,)/,
                    replace: "ref:$self.accountPanelRef,onContextMenu:$self.openAccountPanelContextMenu,"
                }
            ]
        }
    ],

    get accountPanelRef() {
        return accountPanelRef;
    },

    useAccountPanelRef() {
        useEffect(() => () => {
            accountPanelRef.current = null;
        }, []);

        return (accountPanelRef = useRef(null));
    },

    openAccountPanelContextMenu(event: UIEvent) {
        ContextMenuApi.openContextMenu(event, AccountPanelContextMenu);
    },

    onPopoutClose() {
        openAlternatePopout = false;
    },

    UserProfile: ErrorBoundary.wrap(({ popoutProps, currentUser, originalPopout }: UserProfileProps) => {
        if (
            (settings.store.prioritizeServerProfile && openAlternatePopout) ||
            (!settings.store.prioritizeServerProfile && !openAlternatePopout)
        ) return originalPopout();

        const currentChannel = getCurrentChannel();
        if (!currentChannel || currentChannel.isPrivate())
            return originalPopout();

        return (
            <div className={styles.accountProfilePopoutWrapper}>
                <UserProfilePopoutWrapper
                    {...popoutProps}
                    userId={currentUser.id}
                    guildId={currentChannel.getGuildId()}
                    channelId={currentChannel.id}
                />
            </div>
        );
    }, { noop: true })
});
