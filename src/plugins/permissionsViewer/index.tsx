/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import "./styles.css";

import { findGroupChildrenByChildId, type NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { SafetyIcon } from "@components/Icons";
import { Devs } from "@utils/constants";
import { classes } from "@utils/misc";
import definePlugin, { OptionType } from "@utils/types";
import type { GuildMember, GuildRecord } from "@vencord/discord-types";
import { findByPropsLazy } from "@webpack";
import { Button, ChannelStore, Dialog, GuildMemberStore, GuildStore, Menu, Permissions, Popout, TooltipContainer, UserStore } from "@webpack/common";

import openRolesAndUsersPermissionsModal, { PermissionType, type RoleOrUserPermission } from "./components/RolesAndUsersPermissions";
import UserPermissions from "./components/UserPermissions";
import { getSortedRoles, sortPermissionOverwrites } from "./utils";

const PopoutClasses: Record<string, string> = findByPropsLazy("container", "scroller", "list");
const RoleButtonClasses: Record<string, string> = findByPropsLazy("button", "buttonInner", "icon", "banner");

export const enum PermissionsSortOrder {
    HighestRole,
    LowestRole
}

const enum MenuItemParentType {
    User,
    Channel,
    Guild
}

export const settings = definePluginSettings({
    permissionsSortOrder: {
        description: "The sort method used for defining which role grants an user a certain permission",
        type: OptionType.SELECT,
        options: [
            { label: "Highest Role", value: PermissionsSortOrder.HighestRole, default: true },
            { label: "Lowest Role", value: PermissionsSortOrder.LowestRole }
        ],
    },
    defaultPermissionsDropdownState: {
        description: "Whether the permissions dropdown on user popouts should be open by default",
        type: OptionType.BOOLEAN,
        default: false,
    }
});

function MenuItem(guildId: string, id?: string, type?: MenuItemParentType) {
    if (type === MenuItemParentType.User && !GuildMemberStore.isMember(guildId, id)) return null;

    return (
        <Menu.MenuItem
            id="perm-viewer-permissions"
            label="Permissions"
            action={() => {
                const guild = GuildStore.getGuild(guildId)!;

                let permissions: RoleOrUserPermission[];
                let header: string;

                switch (type) {
                    case MenuItemParentType.User: {
                        const member = GuildMemberStore.getMember(guildId, id!)!;

                        permissions = getSortedRoles(guild, member)
                            .map(role => ({
                                type: PermissionType.Role,
                                ...role
                            }));

                        if (guild.ownerId === id) {
                            permissions.push({
                                type: PermissionType.Owner,
                                permissions: Object.values(Permissions).reduce((prev, curr) => prev | curr, 0n)
                            });
                        }

                        header = member.nick ?? UserStore.getUser(member.userId)!.username;

                        break;
                    }

                    case MenuItemParentType.Channel: {
                        const channel = ChannelStore.getChannel(id)!;

                        permissions = sortPermissionOverwrites(Object.values(channel.permissionOverwrites).map(({ id, allow, deny, type }) => ({
                            type: type as number as PermissionType,
                            id,
                            overwriteAllow: allow,
                            overwriteDeny: deny
                        })), guildId);

                        header = channel.name;

                        break;
                    }

                    default: {
                        permissions = Object.values(GuildStore.getRoles(guild.id)).map(role => ({
                            type: PermissionType.Role,
                            ...role
                        }));

                        header = guild.name;

                        break;
                    }
                }

                openRolesAndUsersPermissionsModal(permissions, guild, header);
            }}
        />
    );
}

const makeContextMenuPatch = (childId: string | string[], type?: MenuItemParentType) =>
    ((children, props) => {
        if (!props) return;
        if ((type === MenuItemParentType.User && !props.user) || (type === MenuItemParentType.Guild && !props.guild) || (type === MenuItemParentType.Channel && (!props.channel || !props.guild)))
            return;

        const group = findGroupChildrenByChildId(childId, children);

        const item = (() => {
            switch (type) {
                case MenuItemParentType.User:
                    return MenuItem(props.guildId, props.user.id, type);
                case MenuItemParentType.Channel:
                    return MenuItem(props.guild.id, props.channel.id, type);
                case MenuItemParentType.Guild:
                    return MenuItem(props.guild.id);
                default:
                    return null;
            }
        })();

        if (item == null) return;

        if (group)
            group.push(item);
        else if (childId === "roles" && props.guildId)
            // "roles" may not be present due to the member not having any roles. In that case, add it above "Copy ID"
            children.splice(-1, 0, <Menu.MenuGroup>{item}</Menu.MenuGroup>);
    }) satisfies NavContextMenuPatchCallback;

export default definePlugin({
    name: "PermissionsViewer",
    description: "View the permissions a user or channel has, and the roles of a server",
    authors: [Devs.Nuckyz, Devs.Ven],
    settings,

    patches: [
        {
            find: ".VIEW_ALL_ROLES,",
            replacement: {
                match: /children:"\+"\.concat\(\i\.length-\i\.length\).{0,20}\}\),/,
                replace: "$&$self.ViewPermissionsButton(arguments[0]),"
            }
        }
    ],

    ViewPermissionsButton: ErrorBoundary.wrap(({ guild, guildMember }: { guild: GuildRecord; guildMember: GuildMember; }) => (
        <Popout
            position="bottom"
            align="center"
            renderPopout={() => (
                <Dialog className={PopoutClasses.container} style={{ width: "500px" }}>
                    <UserPermissions guild={guild} guildMember={guildMember} forceOpen />
                </Dialog>
            )}
        >
            {popoutProps => (
                <TooltipContainer text="View Permissions">
                    <Button
                        {...popoutProps}
                        color={Button.Colors.CUSTOM}
                        look={Button.Looks.FILLED}
                        size={Button.Sizes.NONE}
                        innerClassName={classes(RoleButtonClasses.buttonInner, RoleButtonClasses.icon)}
                        className={classes(RoleButtonClasses.button, RoleButtonClasses.icon, "vc-permviewer-role-button")}
                    >
                        <SafetyIcon height="16" width="16" />
                    </Button>
                </TooltipContainer>
            )}
        </Popout>
    ), { noop: true }),

    contextMenus: {
        "user-context": makeContextMenuPatch("roles", MenuItemParentType.User),
        "channel-context": makeContextMenuPatch(["mute-channel", "unmute-channel"], MenuItemParentType.Channel),
        "guild-context": makeContextMenuPatch("privacy", MenuItemParentType.Guild),
        "guild-header-popout": makeContextMenuPatch("privacy", MenuItemParentType.Guild)
    }
});
