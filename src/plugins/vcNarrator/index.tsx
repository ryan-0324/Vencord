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

import { Settings } from "@api/Settings";
import { ErrorCard } from "@components/ErrorCard";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import { Margins } from "@utils/margins";
import { wordsToTitle } from "@utils/text";
import definePlugin, { OptionType, type PluginOptionsItem, ReporterTestable } from "@utils/types";
import type { Store } from "@vencord/discord-types";
import { findStoreLazy } from "@webpack";
import { Button, ChannelStore, Forms, GuildMemberStore, SelectedChannelStore, SelectedGuildStore, useMemo, UserStore } from "@webpack/common";
import type { ReactElement } from "react";

interface VoiceState {
    userId: string;
    channelId?: string;
    oldChannelId?: string;
    deaf: boolean;
    mute: boolean;
    selfDeaf: boolean;
    selfMute: boolean;
}

const VoiceStateStore: Store & Record<string, any> = findStoreLazy("VoiceStateStore");

// Mute/Deaf for other people than you is commented out, because otherwise someone can spam it and it will be annoying
// Filtering out events is not as simple as just dropping duplicates, as otherwise mute, unmute, mute would
// not say the second mute, which would lead you to believe they're unmuted

function speak(text: string, settings: any = Settings.plugins.VcNarrator) {
    if (!text) return;

    const speech = new SpeechSynthesisUtterance(text);
    let voice = speechSynthesis.getVoices().find(v => v.voiceURI === settings.voice);
    if (!voice) {
        new Logger("VcNarrator").error(`Voice "${settings.voice}" not found. Resetting to default.`);
        voice = speechSynthesis.getVoices().find(v => v.default);
        settings.voice = voice?.voiceURI;
        if (!voice) return; // This should never happen
    }
    speech.voice = voice!;
    speech.volume = settings.volume;
    speech.rate = settings.rate;
    speechSynthesis.speak(speech);
}

function clean(str: string) {
    const replacer = Settings.plugins.VcNarrator!.latinOnly
        ? /[^\p{Script=Latin}\p{Number}\p{Punctuation}\s]/gu
        : /[^\p{Letter}\p{Number}\p{Punctuation}\s]/gu;

    return str.normalize("NFKC")
        .replaceAll(replacer, "")
        .replaceAll(/_{2,}/g, "_")
        .trim();
}

function formatText(str: string, user: string, channel: string, displayName: string, nickname: string) {
    return str
        .replaceAll("{{USER}}", clean(user) || (user ? "Someone" : ""))
        .replaceAll("{{CHANNEL}}", clean(channel) || "channel")
        .replaceAll("{{DISPLAY_NAME}}", clean(displayName) || (displayName ? "Someone" : ""))
        .replaceAll("{{NICKNAME}}", clean(nickname) || (nickname ? "Someone" : ""));
}

/*
let StatusMap = {} as Record<string, {
    mute: boolean;
    deaf: boolean;
}>;
*/

// For every user, channelId and oldChannelId will differ when moving channel.
// Only for the local user, channelId and oldChannelId will be the same when moving channel,
// for some ungodly reason
let myLastChannelId: string | undefined;

function getTypeAndChannelId({ channelId, oldChannelId }: VoiceState, isMe: boolean) {
    if (isMe && channelId !== myLastChannelId) {
        oldChannelId = myLastChannelId;
        myLastChannelId = channelId;
    }

    if (channelId !== oldChannelId) {
        if (channelId) return [oldChannelId ? "move" : "join", channelId];
        if (oldChannelId) return ["leave", oldChannelId];
    }
    /*
    if (channelId) {
        if (deaf || selfDeaf) return ["deafen", channelId];
        if (mute || selfMute) return ["mute", channelId];
        const oldStatus = StatusMap[userId];
        if (oldStatus.deaf) return ["undeafen", channelId];
        if (oldStatus.mute) return ["unmute", channelId];
    }
    */
    return ["", ""];
}

/*
function updateStatuses(type: string, { deaf, mute, selfDeaf, selfMute, userId, channelId }: VoiceState, isMe: boolean) {
    if (isMe && (type === "join" || type === "move")) {
        StatusMap = {};
        const states = VoiceStateStore.getVoiceStatesForChannel(channelId!) as Record<string, VoiceState>;
        for (const userId in states) {
            const s = states[userId];
            StatusMap[userId] = {
                mute: s.mute || s.selfMute,
                deaf: s.deaf || s.selfDeaf
            };
        }
        return;
    }

    if (type === "leave" || (type === "move" && channelId !== SelectedChannelStore.getVoiceChannelId())) {
        if (isMe)
            StatusMap = {};
        else
            delete StatusMap[userId];

        return;
    }

    StatusMap[userId] = {
        deaf: deaf || selfDeaf,
        mute: mute || selfMute
    };
}
*/

function playSample(tempSettings: any, type: string) {
    const settings = { ...Settings.plugins.VcNarrator, ...tempSettings };
    const me = UserStore.getCurrentUser()!;
    const currGuildId = SelectedGuildStore.getGuildId();

    speak(
        formatText(
            settings[type + "Message"],
            me.username, "general",
            me.globalName ?? me.username,
            GuildMemberStore.getNick(currGuildId, me.id) ?? me.username
        ),
        settings
    );
}

export default definePlugin({
    name: "VcNarrator",
    description: "Announces when users join, leave, or move voice channels via narrator",
    authors: [Devs.Ven],
    reporterTestable: ReporterTestable.None,

    flux: {
        VOICE_STATE_UPDATES({ voiceStates }: { voiceStates: VoiceState[]; }) {
            const currGuildId = SelectedGuildStore.getGuildId();
            const currChanId = SelectedChannelStore.getVoiceChannelId()!;
            const meId = UserStore.getCurrentUser()!.id;

            const channel = ChannelStore.getChannel(currChanId);
            if (!channel || channel.isGuildStageVoice()) return;

            for (const state of voiceStates) {
                const { userId, channelId, oldChannelId } = state;
                const isMe = userId === meId;
                if (!isMe) {
                    if (!currChanId) continue;
                    if (channelId !== currChanId && oldChannelId !== currChanId) continue;
                }

                const [type, id] = getTypeAndChannelId(state, isMe);
                if (!type) continue;

                const template = Settings.plugins.VcNarrator![type + "Message"];
                const user = isMe && !Settings.plugins.VcNarrator!.sayOwnName ? "" : UserStore.getUser(userId)!.username;
                const displayName = user && (UserStore.getUser(userId)!.globalName ?? user);
                const nickname = user && (GuildMemberStore.getNick(currGuildId, userId) ?? user);
                const channelName = ChannelStore.getChannel(id)!.name;

                speak(formatText(template, user, channelName, displayName, nickname));

                // updateStatuses(type, state, isMe);
            }
        },

        AUDIO_TOGGLE_SELF_MUTE() {
            const chanId = SelectedChannelStore.getVoiceChannelId()!;
            const state: VoiceState | undefined = VoiceStateStore.getVoiceStateForChannel(chanId);
            if (!state) return;

            const event = state.mute || state.selfMute ? "unmute" : "mute";
            speak(formatText(
                Settings.plugins.VcNarrator![event + "Message"], "",
                ChannelStore.getChannel(chanId)!.name,
                "",
                ""
            ));
        },

        AUDIO_TOGGLE_SELF_DEAF() {
            const chanId = SelectedChannelStore.getVoiceChannelId()!;
            const state: VoiceState | undefined = VoiceStateStore.getVoiceStateForChannel(chanId);
            if (!state) return;

            const event = state.deaf || state.selfDeaf ? "undeafen" : "deafen";
            speak(formatText(
                Settings.plugins.VcNarrator![event + "Message"],
                "",
                ChannelStore.getChannel(chanId)!.name,
                "",
                ""
            ));
        }
    },

    start() {
        if (typeof speechSynthesis === "undefined" || speechSynthesis.getVoices().length <= 0)
            new Logger("VcNarrator").warn(
                "SpeechSynthesis not supported or no Narrator voices found. Thus, this plugin will not work. Check my Settings for more info"
            );
    },

    optionsCache: null as Record<string, PluginOptionsItem> | null,

    get options() {
        return this.optionsCache ??= {
            // @ts-ignore
            voice: {
                type: OptionType.SELECT,
                description: "Narrator Voice",
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                options: window.speechSynthesis?.getVoices().map(v => ({
                    label: v.name,
                    value: v.voiceURI,
                    default: v.default
                })) ?? []
            },
            // @ts-ignore
            volume: {
                type: OptionType.SLIDER,
                description: "Narrator Volume",
                default: 1,
                markers: [0, 0.25, 0.5, 0.75, 1],
                stickToMarkers: false
            },
            // @ts-ignore
            rate: {
                type: OptionType.SLIDER,
                description: "Narrator Speed",
                default: 1,
                markers: [0.1, 0.5, 1, 2, 5, 10],
                stickToMarkers: false
            },
            // @ts-ignore
            sayOwnName: {
                description: "Say own name",
                type: OptionType.BOOLEAN,
                default: false
            },
            // @ts-ignore
            latinOnly: {
                description: "Strip non latin characters from names before saying them",
                type: OptionType.BOOLEAN,
                default: false
            },
            // @ts-ignore
            joinMessage: {
                type: OptionType.STRING,
                description: "Join Message",
                default: "{{USER}} joined"
            },
            // @ts-ignore
            leaveMessage: {
                type: OptionType.STRING,
                description: "Leave Message",
                default: "{{USER}} left"
            },
            // @ts-ignore
            moveMessage: {
                type: OptionType.STRING,
                description: "Move Message",
                default: "{{USER}} moved to {{CHANNEL}}"
            },
            // @ts-ignore
            muteMessage: {
                type: OptionType.STRING,
                description: "Mute Message (only self for now)",
                default: "{{USER}} Muted"
            },
            // @ts-ignore
            unmuteMessage: {
                type: OptionType.STRING,
                description: "Unmute Message (only self for now)",
                default: "{{USER}} unmuted"
            },
            // @ts-ignore
            deafenMessage: {
                type: OptionType.STRING,
                description: "Deafen Message (only self for now)",
                default: "{{USER}} deafened"
            },
            // @ts-ignore
            undeafenMessage: {
                type: OptionType.STRING,
                description: "Undeafen Message (only self for now)",
                default: "{{USER}} undeafened"
            }
        };
    },

    settingsAboutComponent({ tempSettings: s }) {
        const [hasVoices, hasEnglishVoices] = useMemo(() => {
            const voices = speechSynthesis.getVoices();
            return [voices.length !== 0, voices.some(v => v.lang.startsWith("en"))];
        }, []);

        const types = useMemo(
            () => Object.keys(Vencord.Plugins.plugins.VcNarrator!.options!)
                .filter(k => k.endsWith("Message"))
                .map(k => k.slice(0, -7)),
            [],
        );

        let errorComponent: ReactElement | null = null;
        if (!hasVoices) {
            let error = "No narrator voices found. ";
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            error += navigator.platform?.toLowerCase().includes("linux")
                ? "Install speech-dispatcher or espeak and run Discord with the --enable-speech-dispatcher flag"
                : "Try installing some in the Narrator settings of your Operating System";
            errorComponent = <ErrorCard>{error}</ErrorCard>;
        } else if (!hasEnglishVoices) {
            errorComponent = <ErrorCard>You don't have any English voices installed, so the narrator might sound weird</ErrorCard>;
        }

        return (
            <Forms.FormSection>
                <Forms.FormText>
                    You can customise the spoken messages below. You can disable specific messages by setting them to nothing
                </Forms.FormText>
                <Forms.FormText>
                    The special placeholders <code>{"{{USER}}"}</code>, <code>{"{{DISPLAY_NAME}}"}</code>, <code>{"{{NICKNAME}}"}</code> and <code>{"{{CHANNEL}}"}</code>{" "}
                    will be replaced with the user's name (nothing if it's yourself), the user's display name, the user's nickname on current server and the channel's name respectively
                </Forms.FormText>
                {hasEnglishVoices && (
                    <>
                        <Forms.FormTitle className={Margins.top20} tag="h3">Play Example Sounds</Forms.FormTitle>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(4, 1fr)",
                                gap: "1rem",
                            }}
                            className="vc-narrator-buttons"
                        >
                            {types.map(t => (
                                <Button key={t} onClick={() => { playSample(s, t); }}>
                                    {wordsToTitle([t])}
                                </Button>
                            ))}
                        </div>
                    </>
                )}
                {errorComponent}
            </Forms.FormSection>
        );
    }
});
