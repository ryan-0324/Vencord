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

import ErrorBoundary from "@components/ErrorBoundary";
import { ExpandableHeader } from "@components/ExpandableHeader";
import { classes } from "@utils/misc";
import type { GuildMember, GuildRecord } from "@vencord/discord-types";
import { filters, findBulk, proxyLazyWebpack } from "@webpack";
import { i18n, Permissions, Text, Tooltip, useMemo, UserStore } from "@webpack/common";

import { PermissionsSortOrder, settings } from "..";
import { cl, getPermissionString, getSortedRoles, sortUserRoles } from "../utils";
import openRolesAndUsersPermissionsModal, { PermissionType, type RoleOrUserPermission } from "./RolesAndUsersPermissions";

interface UserPermission {
    permission: string;
    roleColor: string;
    rolePosition: number;
}

const Classes: Record<"actionButton" | "addButton" | "addButtonIcon" | "alignCenter" | "background" | "desaturateUserColors" | "dot" | "dotBorderBase" | "dotBorderColor" | "flex" | "justifyCenter" | "overflowButton" | "overflowRolesPopout" | "overflowRolesPopoutArrow" | "overflowRolesPopoutArrowWrapper" | "overflowRolesPopoutHeader" | "overflowRolesPopoutHeaderIcon" | "overflowRolesPopoutHeaderText" | "popoutBottom" | "popoutTop" | "role" | "roleCircle" | "roleDot" | "roleFlowerStar" | "roleIcon" | "roleName" | "roleNameOverflow" | "rolePill" | "rolePillBorder" | "roleRemoveButton" | "roleRemoveIcon" | "roleRemoveIconFocused" | "roles" | "roleVerifiedIcon" | "root" | "svg" | "wrap", string>
    = proxyLazyWebpack(() => ({
        ...findBulk(
            filters.byProps("roles", "rolePill", "rolePillBorder"),
            filters.byProps("roleCircle", "dotBorderBase", "dotBorderColor"),
            filters.byProps("roleNameOverflow", "root", "roleName", "roleRemoveButton")
        )
    }));

interface UserPermissionsComponentProps {
    forceOpen?: boolean;
    guild: GuildRecord;
    guildMember: GuildMember;
    showBorder: boolean;
}

function UserPermissionsComponent({ forceOpen = false, guild, guildMember, showBorder }: UserPermissionsComponentProps) {
    const stns = settings.use(["permissionsSortOrder"]);

    const [rolePermissions, userPermissions] = useMemo(() => {
        const userPermissions: UserPermission[] = [];

        const userRoles = getSortedRoles(guild, guildMember);

        const rolePermissions: RoleOrUserPermission[] = userRoles.map(role => ({
            type: PermissionType.Role,
            ...role
        }));

        if (guild.ownerId === guildMember.userId) {
            rolePermissions.push({
                type: PermissionType.Owner,
                permissions: Object.values(Permissions).reduce((prev, curr) => prev | curr, 0n)
            });

            const OWNER = i18n.Messages.GUILD_OWNER || "Server Owner";
            userPermissions.push({
                permission: OWNER,
                roleColor: "var(--primary-300)",
                rolePosition: Infinity
            });
        }

        sortUserRoles(userRoles);

        for (const [permission, flag] of Object.entries(Permissions)) {
            for (const { permissions, colorString, position } of userRoles) {
                if ((permissions & flag) === flag) {
                    userPermissions.push({
                        permission: getPermissionString(permission),
                        roleColor: colorString || "var(--primary-300)",
                        rolePosition: position
                    });

                    break;
                }
            }
        }

        userPermissions.sort((a, b) => b.rolePosition - a.rolePosition);

        return [rolePermissions, userPermissions];
    }, [stns.permissionsSortOrder]);

    const { root, role, roleRemoveButton, roleNameOverflow, roles, rolePill, rolePillBorder, roleCircle, roleName } = Classes;

    return (
        <ExpandableHeader
            forceOpen={forceOpen}
            headerText="Permissions"
            moreTooltipText="Role Details"
            onMoreClick={() =>
                openRolesAndUsersPermissionsModal(
                    rolePermissions,
                    guild,
                    guildMember.nick || UserStore.getUser(guildMember.userId)!.username
                )
            }
            onDropDownClick={state => { settings.store.defaultPermissionsDropdownState = !state; }}
            defaultState={settings.store.defaultPermissionsDropdownState}
            buttons={[
                <Tooltip text={`Sorting by ${stns.permissionsSortOrder === PermissionsSortOrder.HighestRole ? "Highest Role" : "Lowest Role"}`}>
                    {tooltipProps => (
                        <button
                            {...tooltipProps}
                            className={cl("userperms-sortorder-btn")}
                            onClick={() => {
                                stns.permissionsSortOrder = stns.permissionsSortOrder === PermissionsSortOrder.HighestRole
                                    ? PermissionsSortOrder.LowestRole
                                    : PermissionsSortOrder.HighestRole;
                            }}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 96 960 960"
                                fill="var(--text-normal)"
                                transform={stns.permissionsSortOrder === PermissionsSortOrder.HighestRole ? "scale(1 1)" : "scale(1 -1)"}
                            >
                                <path d="M440 896V409L216 633l-56-57 320-320 320 320-56 57-224-224v487h-80Z" />
                            </svg>
                        </button>
                    )}
                </Tooltip>
            ]}
        >
            {userPermissions.length > 0 && (
                <div className={classes(root, roles)}>
                    {userPermissions.map(({ permission, roleColor }) => (
                        <div className={classes(role, rolePill, showBorder ? rolePillBorder : null)}>
                            <div className={roleRemoveButton}>
                                <span
                                    className={roleCircle}
                                    style={{ backgroundColor: roleColor }}
                                />
                            </div>
                            <div className={roleName}>
                                <Text
                                    className={roleNameOverflow}
                                    variant="text-xs/medium"
                                >
                                    {permission}
                                </Text>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ExpandableHeader>
    );
}

export default ErrorBoundary.wrap(UserPermissionsComponent, { noop: true });
