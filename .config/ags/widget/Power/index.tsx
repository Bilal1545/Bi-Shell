import app from "ags/gtk4/app"
import GLib from "gi://GLib"
import Astal from "gi://Astal?version=4.0"
import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import Sidebar from "./Sidebar"
import { For, With, createBinding, createState } from "ags"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

export default function Power(gdkmonitor: Gdk.Monitor) {
    const { TOP, LEFT, RIGHT, BOTTOM } = Astal.WindowAnchor

    function launch(type: string) {
        if (type == "power") {
            execAsync("ags toggle power")
            execAsync("systemctl poweroff")
        } else if (type == "reboot") {
            execAsync("ags toggle power")
            execAsync("systemctl reboot")
        } else if (type == "exit") {
            execAsync("ags toggle power")
            execAsync("hyprctl exit")
        } else if (type == "sleep") {
            execAsync("ags toggle power")
            execAsync("systemctl suspend")
        }
    }

    return (
        <window
            name="power"
            class="Power"
            namespace={"power"}
            gdkmonitor={gdkmonitor}
            exclusivity={Astal.Exclusivity.IGNORE}
            anchor={TOP | BOTTOM | LEFT | RIGHT}
            application={app}
            keymode={Astal.Keymode.ON_DEMAND}
        >
            <Gtk.EventControllerKey
                onKeyPressed={({ widget }, keyval: number) => {
                    if (keyval === Gdk.KEY_Escape) {
                        widget.hide()
                    }
                }}
            />
            <box spacing={30} valign={Gtk.Align.CENTER} halign={Gtk.Align.CENTER} class={"selection"}>
                <box spacing={2} orientation={Gtk.Orientation.VERTICAL}>
                    <button class={"glass"} onClicked={() => launch("power")}>
                        <image pixelSize={75} iconName={"system-shutdown-symbolic"} />
                    </button>
                    <label label="Shutdown" />
                </box>
                <box spacing={2} orientation={Gtk.Orientation.VERTICAL}>
                    <button class={"glass"} onClicked={() => launch("exit")}>
                        <image pixelSize={75} iconName={"system-log-out-symbolic"} />
                    </button>
                    <label label="Log Out" />
                </box>
                <box spacing={2} orientation={Gtk.Orientation.VERTICAL}>
                    <button class={"glass"} onClicked={() => launch("reboot")}>
                        <image pixelSize={75} iconName={"system-reboot-symbolic"} />
                    </button>
                    <label label="Reboot" />
                </box>
                <box spacing={2} orientation={Gtk.Orientation.VERTICAL}>
                    <button class={"glass"} onClicked={() => launch("sleep")}>
                        <image pixelSize={75} iconName={"weather-clear-night-symbolic"} />
                    </button>
                    <label label="Sleep" />
                </box>
            </box>
        </window>
    )
}